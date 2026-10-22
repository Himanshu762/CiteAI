/**
 * Server-side LLM gateway.
 *
 * Tries free-tier providers in order and falls back on rate limits or outages, so the
 * browser never holds an API key and generation keeps going when one quota runs out.
 * Every provider is called through its OpenAI-compatible chat completions endpoint.
 */

export interface ChatMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

export interface LLMRequest {
    messages: ChatMessage[];
    maxTokens?: number;
    temperature?: number;
    provider?: string; // Preferred provider id; others are still used as fallbacks
}

export interface Provider {
    id: string;
    label: string;
    url: string;
    model: string;    // First model that has not been retired
    models: string[]; // Tried in order; hosted models get retired, so keep alternatives
    apiKey: string;
    maxTokensCap: number; // Keeps one request inside the provider's tokens-per-minute budget
    extraBodyFor?: (model: string) => Record<string, unknown> | undefined;
    headers?: Record<string, string>;
}

export type GatewayEvent =
    | { type: 'meta'; provider: string; label: string; model: string }
    | { type: 'token'; text: string }
    | { type: 'error'; message: string }
    | { type: 'done' };

export type Env = Record<string, string | undefined>;

interface ProviderDefinition {
    id: string;
    label: string;
    keyVar: string;
    modelVar: string; // Comma-separated list overrides defaultModels
    defaultModels: string[];
    url: string;
    maxTokensCap: number;
    extraBody?: (model: string) => Record<string, unknown> | undefined;
    headers?: Record<string, string>;
}

const DEFINITIONS: ProviderDefinition[] = [
    {
        // Free plan, no card: 30 req/min, 1K req/day, 8K tokens/min, 200K tokens/day for gpt-oss-120b
        id: 'groq',
        label: 'Groq',
        keyVar: 'GROQ_API_KEY',
        modelVar: 'GROQ_MODEL',
        defaultModels: ['openai/gpt-oss-120b'],
        url: 'https://api.groq.com/openai/v1/chat/completions',
        maxTokensCap: 4096,
        // Spend the token budget on the answer, not on hidden reasoning
        extraBody: (model) => model.startsWith('openai/gpt-oss')
            ? { reasoning_effort: 'low', include_reasoning: false }
            : undefined,
    },
    {
        // NVIDIA NIM (build.nvidia.com): free Developer Program key, ~40 req/min, no published daily
        // token cap. NVIDIA scopes the free tier to prototyping and evaluation, not production.
        id: 'nvidia',
        label: 'NVIDIA NIM',
        keyVar: 'NVIDIA_API_KEY',
        modelVar: 'NVIDIA_MODEL',
        // NIM retires hosted models every few months (410 Gone); the gateway moves down this list
        defaultModels: ['moonshotai/kimi-k2.6', 'deepseek-ai/deepseek-v4.1-flash', 'z-ai/glm-5.3', 'nvidia/nemotron-3-super-120b-a12b'],
        url: 'https://integrate.api.nvidia.com/v1/chat/completions',
        maxTokensCap: 8192,
    },
    {
        // Free "Experiment" plan (phone number, no card); requests may be used for training
        id: 'mistral',
        label: 'Mistral',
        keyVar: 'MISTRAL_API_KEY',
        modelVar: 'MISTRAL_MODEL',
        defaultModels: ['mistral-large-latest'],
        url: 'https://api.mistral.ai/v1/chat/completions',
        maxTokensCap: 8192,
    },
    {
        // Free models: 20 req/min, 50 req/day (1K/day after a one-time $10 credit purchase)
        id: 'openrouter',
        label: 'OpenRouter',
        keyVar: 'OPENROUTER_API_KEY',
        modelVar: 'OPENROUTER_MODEL',
        defaultModels: ['openai/gpt-oss-120b:free'],
        url: 'https://openrouter.ai/api/v1/chat/completions',
        maxTokensCap: 8192,
        headers: { 'X-Title': 'CiteAI' },
    },
    {
        // Free tier limits are only shown in AI Studio and have been cut repeatedly; last resort
        id: 'gemini',
        label: 'Gemini',
        keyVar: 'GEMINI_API_KEY',
        modelVar: 'GEMINI_MODEL',
        defaultModels: ['gemini-2.5-flash'],
        url: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
        maxTokensCap: 8192,
    },
];

const DEFAULT_ORDER = DEFINITIONS.map(d => d.id);

/**
 * Providers that have a key configured, in LLM_PROVIDER_ORDER (or default) order
 */
export function getProviders(env: Env): Provider[] {
    const order = env.LLM_PROVIDER_ORDER
        ? env.LLM_PROVIDER_ORDER.split(',').map(s => s.trim()).filter(Boolean)
        : DEFAULT_ORDER;

    return order
        .map(id => DEFINITIONS.find(d => d.id === id))
        .filter((d): d is ProviderDefinition => Boolean(d && env[d.keyVar]))
        .map(d => {
            const configured = env[d.modelVar]?.split(',').map(m => m.trim()).filter(Boolean);
            const models = configured?.length ? configured : d.defaultModels;
            return {
                id: d.id,
                label: d.label,
                url: d.url,
                model: models.find(m => !retiredModels.has(`${d.id}:${m}`)) ?? models[0],
                models,
                apiKey: env[d.keyVar]!,
                maxTokensCap: d.maxTokensCap,
                extraBodyFor: d.extraBody,
                headers: d.headers,
            };
        });
}

// Per-instance memory of providers that recently returned 429, so later calls skip them
const cooldownUntil = new Map<string, number>();
// Models a provider reported as retired or unknown ("provider:model")
const retiredModels = new Set<string>();

export function resetCooldowns(): void {
    cooldownUntil.clear();
    retiredModels.clear();
}

export interface GatewayDeps {
    fetch: typeof fetch;
    sleep: (ms: number) => Promise<void>;
    now: () => number;
    signal?: AbortSignal;
}

const defaultDeps: GatewayDeps = {
    fetch: (...args) => fetch(...args),
    sleep: (ms) => new Promise(resolve => setTimeout(resolve, ms)),
    now: () => Date.now(),
};

// Wait out a short rate limit on the last provider instead of failing
const MAX_INLINE_WAIT_SECONDS = 20;

function retryAfterSeconds(response: Response): number | null {
    const header = response.headers.get('retry-after');
    if (!header) return null;
    const seconds = Number(header);
    if (Number.isFinite(seconds)) return Math.max(0, seconds);
    const date = Date.parse(header);
    return Number.isNaN(date) ? null : Math.max(0, (date - Date.now()) / 1000);
}

async function errorDetail(response: Response): Promise<string> {
    try {
        const body = await response.json();
        return body?.error?.message || body?.message || '';
    } catch {
        return '';
    }
}

/**
 * Parse an OpenAI-style SSE stream into content deltas
 */
export async function* parseChatStream(body: ReadableStream<Uint8Array>): AsyncGenerator<string> {
    const reader = body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith('data:')) continue;
            const data = trimmed.slice(5).trim();
            if (data === '[DONE]') return;
            let json;
            try {
                json = JSON.parse(data);
            } catch {
                continue; // Ignore keep-alive comments and partial frames
            }
            if (json.error) throw new Error(json.error.message || 'Provider stream error');
            const text = json.choices?.[0]?.delta?.content;
            if (text) yield text;
        }
    }
}

/**
 * Run a chat request against the configured providers, falling back on failure.
 * A provider that fails before producing any text is skipped; the client resets its
 * buffer on each `meta` event, so a fallback after a mid-stream failure starts clean.
 */
export async function* runWithFallback(
    request: LLMRequest,
    providers: Provider[],
    deps: GatewayDeps = defaultDeps
): AsyncGenerator<GatewayEvent> {
    if (providers.length === 0) {
        yield {
            type: 'error',
            message: 'No AI provider is configured. Add GROQ_API_KEY (free at console.groq.com) to frontend/.env and restart the dev server.',
        };
        return;
    }

    const ordered = request.provider
        ? [...providers.filter(p => p.id === request.provider), ...providers.filter(p => p.id !== request.provider)]
        : providers;
    const failures: string[] = [];

    for (let i = 0; i < ordered.length; i++) {
        const provider = ordered[i];
        const isLast = i === ordered.length - 1;
        const coolUntil = cooldownUntil.get(provider.id) ?? 0;

        if (coolUntil > deps.now() && !isLast) {
            failures.push(`${provider.label}: rate limited`);
            continue;
        }

        const models = provider.models.filter(m => !retiredModels.has(`${provider.id}:${m}`));
        if (models.length === 0) {
            failures.push(`${provider.label}: all configured models are retired`);
            continue;
        }

        modelLoop: for (const model of models) {
            for (let attempt = 0; attempt < 2; attempt++) {
                let response: Response;
                try {
                    response = await deps.fetch(provider.url, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${provider.apiKey}`,
                            'Content-Type': 'application/json',
                            ...provider.headers,
                        },
                        body: JSON.stringify({
                            model,
                            messages: request.messages,
                            max_tokens: Math.min(request.maxTokens ?? 4096, provider.maxTokensCap),
                            temperature: request.temperature ?? 0.7,
                            stream: true,
                            ...provider.extraBodyFor?.(model),
                        }),
                        signal: deps.signal,
                    });
                } catch (error) {
                    if (deps.signal?.aborted) return;
                    failures.push(`${provider.label}: ${error instanceof Error ? error.message : 'network error'}`);
                    break modelLoop;
                }

                if (response.status === 404 || response.status === 410) {
                    // Retired or unknown model: remember it and try the provider's next model
                    retiredModels.add(`${provider.id}:${model}`);
                    failures.push(`${provider.label}: model ${model} unavailable (HTTP ${response.status})`);
                    continue modelLoop;
                }

                if (response.status === 429) {
                    const wait = retryAfterSeconds(response) ?? 30;
                    cooldownUntil.set(provider.id, deps.now() + wait * 1000);
                    if (isLast && attempt === 0 && wait <= MAX_INLINE_WAIT_SECONDS) {
                        await deps.sleep(wait * 1000);
                        continue;
                    }
                    failures.push(`${provider.label}: rate limited (retry in ${Math.ceil(wait)}s)`);
                    break modelLoop;
                }

                if (!response.ok || !response.body) {
                    const detail = await errorDetail(response);
                    failures.push(`${provider.label}: HTTP ${response.status}${detail ? ` ${detail}` : ''}`);
                    break modelLoop;
                }

                yield { type: 'meta', provider: provider.id, label: provider.label, model };

                let produced = false;
                try {
                    for await (const text of parseChatStream(response.body)) {
                        produced = true;
                        yield { type: 'token', text };
                    }
                } catch (error) {
                    if (deps.signal?.aborted) return;
                    failures.push(`${provider.label}: stream interrupted (${error instanceof Error ? error.message : 'unknown'})`);
                    break modelLoop;
                }

                if (!produced) {
                    failures.push(`${provider.label}: empty response`);
                    break modelLoop;
                }

                yield { type: 'done' };
                return;
            }
        }
    }

    yield { type: 'error', message: `All AI providers failed. ${failures.join('; ')}` };
}

const MAX_MESSAGES = 20;
const MAX_INPUT_CHARS = 60_000;

function validate(body: unknown): LLMRequest | string {
    const req = body as LLMRequest;
    if (!req || !Array.isArray(req.messages) || req.messages.length === 0) return 'messages is required';
    if (req.messages.length > MAX_MESSAGES) return 'too many messages';
    let chars = 0;
    for (const m of req.messages) {
        if (!['system', 'user', 'assistant'].includes(m?.role) || typeof m.content !== 'string') return 'invalid message';
        chars += m.content.length;
    }
    if (chars > MAX_INPUT_CHARS) return 'input too long';
    return {
        messages: req.messages,
        maxTokens: typeof req.maxTokens === 'number' ? Math.max(1, Math.min(8192, req.maxTokens)) : undefined,
        temperature: typeof req.temperature === 'number' ? Math.max(0, Math.min(1.5, req.temperature)) : undefined,
        provider: typeof req.provider === 'string' ? req.provider : undefined,
    };
}

/**
 * Reject calls from other websites. Not a security boundary (curl can set any Origin),
 * but it stops other pages from spending this deployment's free quota through visitors' browsers.
 */
function isCrossOrigin(request: Request): boolean {
    const origin = request.headers.get('origin');
    if (!origin) return false;
    try {
        return new URL(origin).host !== new URL(request.url).host;
    } catch {
        return true;
    }
}

/**
 * HTTP handler shared by the Vercel function and the Vite dev server.
 * GET lists configured providers; POST streams NDJSON GatewayEvents.
 */
export async function handleLLMRequest(request: Request, env: Env, deps?: Partial<GatewayDeps>): Promise<Response> {
    const providers = getProviders(env);

    if (request.method === 'GET') {
        return Response.json({
            providers: providers.map(p => ({ id: p.id, label: p.label, model: p.model })),
        });
    }

    if (request.method !== 'POST') {
        return new Response('Method not allowed', { status: 405 });
    }

    if (isCrossOrigin(request)) {
        return Response.json({ error: 'cross-origin requests are not allowed' }, { status: 403 });
    }

    let body: unknown;
    try {
        body = await request.json();
    } catch {
        return Response.json({ error: 'invalid JSON' }, { status: 400 });
    }

    const parsed = validate(body);
    if (typeof parsed === 'string') {
        return Response.json({ error: parsed }, { status: 400 });
    }

    const encoder = new TextEncoder();
    const events = runWithFallback(parsed, providers, { ...defaultDeps, signal: request.signal, ...deps });

    const stream = new ReadableStream<Uint8Array>({
        async pull(controller) {
            const { value, done } = await events.next();
            if (done) {
                controller.close();
                return;
            }
            controller.enqueue(encoder.encode(JSON.stringify(value) + '\n'));
        },
        async cancel() {
            await events.return(undefined);
        },
    });

    return new Response(stream, {
        headers: {
            'Content-Type': 'application/x-ndjson; charset=utf-8',
            'Cache-Control': 'no-store',
        },
    });
}
