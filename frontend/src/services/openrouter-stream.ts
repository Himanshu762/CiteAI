import { API_CONFIG, getOpenRouterHeaders, APIError } from './api';

export interface ChatMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

export interface StreamOptions {
    model?: string;
    maxTokens?: number;
    temperature?: number;
    onToken?: (token: string) => void;
    onComplete?: (fullContent: string) => void;
    onError?: (error: Error) => void;
}

export interface StreamingResponse {
    content: string;
    isComplete: boolean;
}

export const AVAILABLE_MODELS = [
    { id: 'openai/gpt-oss-120b:free', name: 'GPT OSS 120B (Free)', free: true },
    { id: 'meta-llama/llama-3.3-70b-instruct:free', name: 'Llama 3.3 70B (Free)', free: true },
    { id: 'deepseek/deepseek-r1-0528:free', name: 'DeepSeek R1 0528 (Free)', free: true },
    { id: 'meta-llama/llama-3.3-70b-instruct:free', name: 'Llama 3.3 70B (Free)', free: true },
] as const;

/**
 * Stream a chat completion from OpenRouter
 * Uses the Streaming API for real-time token delivery
 */
export async function streamChatCompletion(
    messages: ChatMessage[],
    options: StreamOptions = {}
): Promise<StreamingResponse> {
    const {
        model = API_CONFIG.openRouter.defaultModel,
        maxTokens = 4096,
        temperature = 0.7,
        onToken,
        onComplete,
        onError,
    } = options;

    let fullContent = '';

    try {
        const response = await fetch(`${API_CONFIG.openRouter.baseUrl}/chat/completions`, {
            method: 'POST',
            headers: getOpenRouterHeaders(),
            body: JSON.stringify({
                model,
                messages,
                max_tokens: maxTokens,
                temperature,
                stream: true,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const errorMessage = errorData.error?.message || `HTTP ${response.status}`;

            // Check for specific error types
            if (response.status === 402) {
                throw new APIError('Insufficient credits or non-free model selected', 402);
            }
            if (errorMessage.includes('privacy')) {
                throw new APIError('Privacy settings prevent using this model. Please enable "Allow training on prompts" in OpenRouter settings.', 403);
            }

            throw new APIError(errorMessage, response.status);
        }

        const reader = response.body?.getReader();
        if (!reader) {
            throw new APIError('No response body available');
        }

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
                if (!trimmed || trimmed === 'data: [DONE]') continue;
                if (!trimmed.startsWith('data: ')) continue;

                try {
                    const json = JSON.parse(trimmed.slice(6));
                    // Handle OpenRouter specific error format in stream
                    if (json.error) {
                        throw new Error(json.error.message || 'Stream error');
                    }

                    const delta = json.choices?.[0]?.delta?.content;

                    if (delta) {
                        fullContent += delta;
                        onToken?.(delta);
                    }
                } catch (e) {
                    // Ignore JSON parse errors for malformed chunks, but rethrow actual errors
                    if (e instanceof Error && e.message !== 'Unexpected end of JSON input') {
                        // console.warn('Stream chunk parse error:', e);
                    }
                }
            }
        }

        onComplete?.(fullContent);

        return {
            content: fullContent,
            isComplete: true,
        };

    } catch (error) {
        console.error('Stream completion error:', error);
        const err = error instanceof Error ? error : new Error(String(error));
        onError?.(err);
        throw err;
    }
}
