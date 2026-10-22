// @vitest-environment node
import { describe, it, expect, vi, afterEach } from 'vitest';
import { streamLLM, parseJSONResponse } from '../services/llm';

const ndjson = (...events: object[]) => new Response(events.map(e => JSON.stringify(e)).join('\n') + '\n');

afterEach(() => vi.unstubAllGlobals());

describe('streamLLM', () => {
  it('collects tokens and restarts the text when the gateway falls back', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ndjson(
      { type: 'meta', provider: 'groq', label: 'Groq', model: 'a' },
      { type: 'token', text: 'partial' },
      { type: 'meta', provider: 'mistral', label: 'Mistral', model: 'b' },
      { type: 'token', text: 'Full ' },
      { type: 'token', text: 'answer' },
      { type: 'done' },
    )));
    const result = await streamLLM('hi');
    expect(result).toEqual({ content: 'Full answer', provider: 'mistral', model: 'b' });
  });

  it('throws the gateway error message', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ndjson({ type: 'error', message: 'All AI providers failed. Groq: rate limited' })));
    await expect(streamLLM('hi')).rejects.toThrow('Groq: rate limited');
  });

  it('treats a stream without done as a failure', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ndjson({ type: 'meta', provider: 'groq', label: 'Groq', model: 'a' }, { type: 'token', text: 'x' })));
    await expect(streamLLM('hi')).rejects.toThrow('ended unexpectedly');
  });
});

describe('parseJSONResponse', () => {
  it('reads JSON from fenced or chatty responses', () => {
    expect(parseJSONResponse('Sure!\n```json\n{"a": [1]}\n```')).toEqual({ a: [1] });
    expect(parseJSONResponse('Result: [{"x": 1}] hope this helps')).toEqual([{ x: 1 }]);
  });
});
