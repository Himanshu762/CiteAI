// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getProviders, runWithFallback, handleLLMRequest, parseChatStream, resetCooldowns, GatewayEvent, GatewayDeps,
} from '../../api/_lib/llm-gateway';

const env = { GROQ_API_KEY: 'g', MISTRAL_API_KEY: 'm' };

function sse(chunks: string[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream({
    start(controller) {
      chunks.forEach(c => controller.enqueue(encoder.encode(c)));
      controller.close();
    },
  });
}

const delta = (text: string) => `data: ${JSON.stringify({ choices: [{ delta: { content: text } }] })}\n\n`;
const ok = (...texts: string[]) => new Response(sse([...texts.map(delta), 'data: [DONE]\n\n']), { status: 200 });
const limited = (retryAfter: string) => new Response('{}', { status: 429, headers: { 'retry-after': retryAfter } });

async function collect(gen: AsyncGenerator<GatewayEvent>): Promise<GatewayEvent[]> {
  const events: GatewayEvent[] = [];
  for await (const e of gen) events.push(e);
  return events;
}

const text = (events: GatewayEvent[]) =>
  events.filter((e): e is { type: 'token'; text: string } => e.type === 'token').map(e => e.text).join('');

function deps(responses: Response[]): GatewayDeps & { fetch: ReturnType<typeof vi.fn>; sleep: ReturnType<typeof vi.fn> } {
  const queue = [...responses];
  return {
    fetch: vi.fn(async () => queue.shift()!),
    sleep: vi.fn(async () => {}),
    now: () => 1_000_000,
  };
}

beforeEach(() => resetCooldowns());

describe('getProviders', () => {
  it('includes only providers with keys, in default order', () => {
    expect(getProviders({ GEMINI_API_KEY: 'x', GROQ_API_KEY: 'y' }).map(p => p.id)).toEqual(['groq', 'gemini']);
  });

  it('honors LLM_PROVIDER_ORDER and model overrides', () => {
    const providers = getProviders({ ...env, LLM_PROVIDER_ORDER: 'mistral,groq', MISTRAL_MODEL: 'mistral-small-latest' });
    expect(providers.map(p => p.id)).toEqual(['mistral', 'groq']);
    expect(providers[0].model).toBe('mistral-small-latest');
  });

  it('places NVIDIA NIM after Groq by default', () => {
    const providers = getProviders({ NVIDIA_API_KEY: 'n', GROQ_API_KEY: 'g', MISTRAL_API_KEY: 'm' });
    expect(providers.map(p => p.id)).toEqual(['groq', 'nvidia', 'mistral']);
    expect(providers[1].url).toBe('https://integrate.api.nvidia.com/v1/chat/completions');
    expect(providers[1].model).toBe('moonshotai/kimi-k2.6');
  });

  it('keeps gpt-oss reasoning out of the token budget on Groq', () => {
    expect(getProviders(env)[0].extraBodyFor?.('openai/gpt-oss-120b')).toEqual({ reasoning_effort: 'low', include_reasoning: false });
  });
});

describe('parseChatStream', () => {
  it('reassembles frames split across chunks', async () => {
    const frame = delta('Hello world');
    const parts: string[] = [];
    for await (const t of parseChatStream(sse([frame.slice(0, 10), frame.slice(10), 'data: [DONE]\n\n']))) parts.push(t);
    expect(parts.join('')).toBe('Hello world');
  });
});

describe('runWithFallback', () => {
  it('reports a helpful error when no provider is configured', async () => {
    const events = await collect(runWithFallback({ messages: [{ role: 'user', content: 'hi' }] }, []));
    expect(events).toEqual([expect.objectContaining({ type: 'error', message: expect.stringContaining('GROQ_API_KEY') })]);
  });

  it('streams from the first provider and caps max_tokens to its budget', async () => {
    const d = deps([ok('Hel', 'lo')]);
    const events = await collect(runWithFallback({ messages: [{ role: 'user', content: 'hi' }], maxTokens: 8000 }, getProviders(env), d));
    expect(text(events)).toBe('Hello');
    expect(events[0]).toEqual(expect.objectContaining({ type: 'meta', provider: 'groq' }));
    expect(events.at(-1)).toEqual({ type: 'done' });
    expect(JSON.parse(d.fetch.mock.calls[0][1].body).max_tokens).toBe(4096);
  });

  it('falls back on a rate limit and skips the cooled-down provider next time', async () => {
    const providers = getProviders(env);
    const d = deps([limited('40'), ok('from mistral'), ok('again')]);
    const first = await collect(runWithFallback({ messages: [{ role: 'user', content: 'a' }] }, providers, d));
    expect(text(first)).toBe('from mistral');

    const second = await collect(runWithFallback({ messages: [{ role: 'user', content: 'b' }] }, providers, d));
    expect(text(second)).toBe('again');
    expect(d.fetch).toHaveBeenCalledTimes(3);
    expect(d.fetch.mock.calls[2][0]).toContain('mistral.ai');
  });

  it('waits out a short rate limit on the last provider', async () => {
    const d = deps([limited('3'), ok('done')]);
    const events = await collect(runWithFallback({ messages: [{ role: 'user', content: 'a' }] }, getProviders({ GROQ_API_KEY: 'g' }), d));
    expect(d.sleep).toHaveBeenCalledWith(3000);
    expect(text(events)).toBe('done');
  });

  it('falls back on auth errors and reports every failure when all fail', async () => {
    const d = deps([
      new Response(JSON.stringify({ error: { message: 'Invalid API Key' } }), { status: 401 }),
      new Response('{}', { status: 503 }),
    ]);
    const events = await collect(runWithFallback({ messages: [{ role: 'user', content: 'a' }] }, getProviders(env), d));
    const error = events.at(-1) as { type: 'error'; message: string };
    expect(error.type).toBe('error');
    expect(error.message).toContain('Groq: HTTP 401 Invalid API Key');
    expect(error.message).toContain('Mistral: HTTP 503');
  });

  it('moves past retired models and remembers them', async () => {
    const providers = getProviders({ NVIDIA_API_KEY: 'n', NVIDIA_MODEL: 'old/model, new/model' });
    const d = deps([
      new Response(JSON.stringify({ detail: 'reached its end of life' }), { status: 410 }),
      ok('from new'),
      ok('again'),
    ]);
    const first = await collect(runWithFallback({ messages: [{ role: 'user', content: 'a' }] }, providers, d));
    expect(text(first)).toBe('from new');
    expect(first[0]).toEqual(expect.objectContaining({ type: 'meta', model: 'new/model' }));

    await collect(runWithFallback({ messages: [{ role: 'user', content: 'b' }] }, providers, d));
    expect(JSON.parse(d.fetch.mock.calls[2][1].body).model).toBe('new/model');
    expect(getProviders({ NVIDIA_API_KEY: 'n', NVIDIA_MODEL: 'old/model, new/model' })[0].model).toBe('new/model');
  });

  it('prefers the requested provider', async () => {
    const d = deps([ok('m')]);
    await collect(runWithFallback({ messages: [{ role: 'user', content: 'a' }], provider: 'mistral' }, getProviders(env), d));
    expect(d.fetch.mock.calls[0][0]).toContain('mistral.ai');
  });
});

describe('handleLLMRequest', () => {
  it('lists providers without exposing keys', async () => {
    const res = await handleLLMRequest(new Request('http://app.test/api/llm'), env);
    const body = await res.json();
    expect(body.providers.map((p: { id: string }) => p.id)).toEqual(['groq', 'mistral']);
    expect(JSON.stringify(body)).not.toContain('"g"');
  });

  it('rejects cross-origin and invalid requests', async () => {
    const post = (body: unknown, origin?: string) => handleLLMRequest(new Request('http://app.test/api/llm', {
      method: 'POST', body: JSON.stringify(body), headers: origin ? { origin } : {},
    }), env);
    expect((await post({ messages: [{ role: 'user', content: 'x' }] }, 'http://evil.test')).status).toBe(403);
    expect((await post({ messages: [] })).status).toBe(400);
    expect((await post({ messages: [{ role: 'user', content: 'x'.repeat(70_000) }] })).status).toBe(400);
  });

  it('streams NDJSON events', async () => {
    const fetchMock = vi.fn(async () => ok('Hi'));
    const res = await handleLLMRequest(new Request('http://app.test/api/llm', {
      method: 'POST', body: JSON.stringify({ messages: [{ role: 'user', content: 'x' }] }), headers: { origin: 'http://app.test' },
    }), env, { fetch: fetchMock });
    const lines = (await res.text()).trim().split('\n').map(l => JSON.parse(l));
    expect(lines.map(l => l.type)).toEqual(['meta', 'token', 'done']);
  });
});
