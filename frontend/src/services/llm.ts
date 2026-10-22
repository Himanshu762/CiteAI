/**
 * Client for the /api/llm gateway (see frontend/api/_lib/llm-gateway.ts).
 * API keys live on the server; the gateway picks a free provider and falls back automatically.
 */

export interface ChatMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

export interface LLMProviderInfo {
    id: string;
    label: string;
    model: string;
}

export interface LLMOptions {
    maxTokens?: number;
    temperature?: number;
    provider?: string; // Preferred provider id; the gateway still falls back to others
    onToken?: (token: string) => void;
    onProvider?: (info: LLMProviderInfo) => void;
    signal?: AbortSignal;
}

export interface LLMResult {
    content: string;
    provider: string;
    model: string;
}

const ENDPOINT = '/api/llm';

type GatewayEvent =
    | { type: 'meta'; provider: string; label: string; model: string }
    | { type: 'token'; text: string }
    | { type: 'error'; message: string }
    | { type: 'done' };

/**
 * Stream a completion. Resolves with the full text once the stream ends.
 */
export async function streamLLM(prompt: string | ChatMessage[], options: LLMOptions = {}): Promise<LLMResult> {
    const messages = typeof prompt === 'string' ? [{ role: 'user' as const, content: prompt }] : prompt;

    const response = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            messages,
            maxTokens: options.maxTokens,
            temperature: options.temperature,
            provider: options.provider,
        }),
        signal: options.signal,
    });

    if (!response.ok || !response.body) {
        const detail = await response.text().catch(() => '');
        throw new Error(`AI request failed (HTTP ${response.status})${detail ? `: ${detail.slice(0, 200)}` : ''}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let content = '';
    let provider = '';
    let model = '';
    let finished = false;

    const handle = (event: GatewayEvent) => {
        switch (event.type) {
            case 'meta':
                // A fallback provider restarts the answer from scratch
                content = '';
                provider = event.provider;
                model = event.model;
                options.onProvider?.({ id: event.provider, label: event.label, model: event.model });
                break;
            case 'token':
                content += event.text;
                options.onToken?.(event.text);
                break;
            case 'error':
                throw new Error(event.message);
            case 'done':
                finished = true;
                break;
        }
    };

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const line of lines) {
            if (line.trim()) handle(JSON.parse(line));
        }
    }
    if (buffer.trim()) handle(JSON.parse(buffer));

    if (!finished) {
        throw new Error('AI response ended unexpectedly. Please try again.');
    }

    return { content, provider, model };
}

/**
 * Non-streaming convenience wrapper
 */
export async function completeLLM(prompt: string | ChatMessage[], options: Omit<LLMOptions, 'onToken'> = {}): Promise<string> {
    return (await streamLLM(prompt, options)).content;
}

/**
 * Extract and parse the first JSON object or array in a model response
 */
export function parseJSONResponse<T>(text: string): T {
    const match = text.match(/```(?:json)?\s*([\s\S]*?)```/) ?? null;
    const candidate = match ? match[1] : text;
    const start = candidate.search(/[[{]/);
    if (start === -1) throw new Error('AI response did not contain JSON');
    const open = candidate[start];
    const close = open === '{' ? '}' : ']';
    const end = candidate.lastIndexOf(close);
    if (end <= start) throw new Error('AI response contained incomplete JSON');
    return JSON.parse(candidate.slice(start, end + 1)) as T;
}

/**
 * Providers configured on the server, in fallback order
 */
export async function getLLMProviders(): Promise<LLMProviderInfo[]> {
    try {
        const response = await fetch(ENDPOINT);
        if (!response.ok) return [];
        const data = await response.json();
        return Array.isArray(data.providers) ? data.providers : [];
    } catch {
        return [];
    }
}
