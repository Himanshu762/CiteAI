/**
 * Compatibility wrapper for modules written against the old browser-side Gemini client.
 * Calls now go through the server-side gateway (./llm), which picks the provider and model;
 * the `model` arguments are ignored. New code should import from './llm' directly.
 */

import { completeLLM, streamLLM } from './llm';

export const GEMINI_MODELS = {
    PRO: 'gemini-2.5-pro',
    FLASH: 'gemini-2.5-flash',
    FLASH_LITE: 'gemini-2.5-flash-lite',
} as const;

export interface GeminiStreamOptions {
    onToken?: (token: string) => void;
    onComplete?: (fullText: string) => void;
    onError?: (error: Error) => void;
}

export async function geminiCompletion(prompt: string, _model?: string): Promise<string> {
    return completeLLM(prompt);
}

export async function streamGeminiCompletion(
    prompt: string,
    options: GeminiStreamOptions = {},
    _model?: string
): Promise<{ content: string }> {
    try {
        const result = await streamLLM(prompt, { onToken: options.onToken });
        options.onComplete?.(result.content);
        return { content: result.content };
    } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        options.onError?.(err);
        throw err;
    }
}
