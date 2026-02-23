// Central API configuration and utilities
export const API_CONFIG = {
    openRouter: {
        baseUrl: 'https://openrouter.ai/api/v1',
        defaultModel: 'meta-llama/llama-3.3-70b-instruct:free',
    },
    semanticScholar: {
        baseUrl: 'https://api.semanticscholar.org/graph/v1',
    },
    crossRef: {
        baseUrl: 'https://api.crossref.org/works',
    },
};

// Get API key from environment
export function getOpenRouterApiKey(): string {
    const key = import.meta.env.VITE_OPENROUTER_API_KEY;
    if (!key) {
        throw new Error('VITE_OPENROUTER_API_KEY is not set in environment variables');
    }
    return key;
}

// Common headers for OpenRouter API
export function getOpenRouterHeaders(): HeadersInit {
    return {
        'Authorization': `Bearer ${getOpenRouterApiKey()}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': window.location.origin,
        'X-Title': 'CiteAI',
    };
}

// Error handling utilities
export class APIError extends Error {
    constructor(
        message: string,
        public status?: number,
        public code?: string
    ) {
        super(message);
        this.name = 'APIError';
    }
}

export async function handleAPIResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
        let errorMessage = `API Error: ${response.status}`;
        try {
            const errorData = await response.json();
            errorMessage = errorData.error?.message || errorData.message || errorMessage;
        } catch {
            // Ignore JSON parse errors
        }
        throw new APIError(errorMessage, response.status);
    }
    return response.json();
}

// Retry logic for transient failures
export async function withRetry<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000
): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error as Error;
            if (attempt < maxRetries - 1) {
                await new Promise(resolve => setTimeout(resolve, delay * (attempt + 1)));
            }
        }
    }

    throw lastError;
}
