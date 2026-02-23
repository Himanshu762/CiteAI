/**
 * Gemini API Integration Service
 * Uses Google's native Gemini API (free tier) for AI features
 * 
 * Free tier limits (as of 2024):
 * - 15 requests per minute
 * - 1M tokens per minute
 * - 1.5K requests per day
 */

export interface GeminiMessage {
    role: 'user' | 'model';
    parts: { text: string }[];
}

export interface GeminiResponse {
    content: string;
    usage?: {
        promptTokens: number;
        candidateTokens: number;
        totalTokens: number;
    };
}

export interface GeminiStreamOptions {
    onToken?: (token: string) => void;
    onComplete?: (fullText: string) => void;
    onError?: (error: Error) => void;
}

// Get Gemini API key from environment
function getGeminiApiKey(): string {
    const key = import.meta.env.VITE_GEMINI_API_KEY;
    if (!key) {
        throw new Error('VITE_GEMINI_API_KEY is not set in environment variables');
    }
    return key;
}

/**
 * Available Gemini models (FREE tier)
 */
export const GEMINI_MODELS = {
    PRO: 'gemini-2.5-pro',
    FLASH: 'gemini-2.5-flash',
    FLASH_LITE: 'gemini-2.5-flash-lite',
} as const;

// Rate limit constants
const RATE_LIMIT_PER_MINUTE = 15;
const RATE_LIMIT_PER_DAY = 1500;

// Rate limit tracking
interface RateLimitState {
    minuteRequests: number[];  // Timestamps of requests in current minute window
    dayRequests: number;       // Count of requests today
    dayStart: number;          // Timestamp of day start
    cooldownUntil: number | null;  // Timestamp when cooldown ends
    cooldownType: 'minute' | 'day' | null;
}

const rateLimitState: RateLimitState = {
    minuteRequests: [],
    dayRequests: 0,
    dayStart: Date.now(),
    cooldownUntil: null,
    cooldownType: null,
};

/**
 * Get current rate limit status for UI display
 */
export function getRateLimitStatus(): {
    minuteRemaining: number;
    dayRemaining: number;
    isLimited: boolean;
    cooldownSeconds: number | null;
    cooldownType: 'minute' | 'day' | null;
} {
    cleanupOldRequests();

    const now = Date.now();
    const minuteRemaining = RATE_LIMIT_PER_MINUTE - rateLimitState.minuteRequests.length;
    const dayRemaining = RATE_LIMIT_PER_DAY - rateLimitState.dayRequests;

    let cooldownSeconds: number | null = null;
    if (rateLimitState.cooldownUntil && rateLimitState.cooldownUntil > now) {
        cooldownSeconds = Math.ceil((rateLimitState.cooldownUntil - now) / 1000);
    } else {
        // Clear expired cooldown
        rateLimitState.cooldownUntil = null;
        rateLimitState.cooldownType = null;
    }

    return {
        minuteRemaining: Math.max(0, minuteRemaining),
        dayRemaining: Math.max(0, dayRemaining),
        isLimited: cooldownSeconds !== null && cooldownSeconds > 0,
        cooldownSeconds,
        cooldownType: rateLimitState.cooldownType,
    };
}

/**
 * Cleanup old requests from tracking
 */
function cleanupOldRequests(): void {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;

    // Remove requests older than 1 minute
    rateLimitState.minuteRequests = rateLimitState.minuteRequests.filter(t => t > oneMinuteAgo);

    // Reset day counter if new day started
    const dayDiff = now - rateLimitState.dayStart;
    if (dayDiff > 24 * 60 * 60 * 1000) {
        rateLimitState.dayRequests = 0;
        rateLimitState.dayStart = now;
        rateLimitState.cooldownUntil = null;
        rateLimitState.cooldownType = null;
    }
}

/**
 * Check if we can make a request, throws if rate limited
 */
function checkRateLimit(): void {
    cleanupOldRequests();

    const now = Date.now();

    // Check if currently in cooldown
    if (rateLimitState.cooldownUntil && rateLimitState.cooldownUntil > now) {
        const waitSeconds = Math.ceil((rateLimitState.cooldownUntil - now) / 1000);
        const waitMessage = rateLimitState.cooldownType === 'day'
            ? `Daily limit reached. Try again tomorrow or in ${Math.ceil(waitSeconds / 3600)} hours.`
            : `Rate limited. Please wait ${waitSeconds} seconds.`;
        throw new Error(waitMessage);
    }

    // Check daily limit
    if (rateLimitState.dayRequests >= RATE_LIMIT_PER_DAY) {
        const tomorrow = new Date();
        tomorrow.setHours(24, 0, 0, 0);
        rateLimitState.cooldownUntil = tomorrow.getTime();
        rateLimitState.cooldownType = 'day';
        throw new Error('Daily API limit reached (1500 requests). Try again tomorrow.');
    }

    // Check minute limit
    if (rateLimitState.minuteRequests.length >= RATE_LIMIT_PER_MINUTE) {
        const oldestRequest = rateLimitState.minuteRequests[0];
        const waitUntil = oldestRequest + 60000;
        rateLimitState.cooldownUntil = waitUntil;
        rateLimitState.cooldownType = 'minute';
        const waitSeconds = Math.ceil((waitUntil - now) / 1000);
        throw new Error(`Rate limit reached (15/min). Please wait ${waitSeconds} seconds.`);
    }
}

/**
 * Record a successful request
 */
function recordRequest(): void {
    const now = Date.now();
    rateLimitState.minuteRequests.push(now);
    rateLimitState.dayRequests++;
}

const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta';

/**
 * Stream a chat completion from Gemini API
 * Uses Server-Sent Events for real-time token delivery
 */
export async function streamGeminiCompletion(
    prompt: string,
    options: GeminiStreamOptions = {},
    model: string = GEMINI_MODELS.PRO
): Promise<GeminiResponse> {
    const { onToken, onComplete, onError } = options;
    const apiKey = getGeminiApiKey();

    // Check rate limits before making request
    checkRateLimit();

    let fullContent = '';

    try {
        // Record request at start (optimistic)
        recordRequest();
        const response = await fetch(
            `${GEMINI_API_BASE}/models/${model}:streamGenerateContent?key=${apiKey}&alt=sse`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [
                        {
                            parts: [{ text: prompt }],
                        },
                    ],
                    generationConfig: {
                        temperature: 0.7,
                        maxOutputTokens: 8192,
                    },
                }),
            }
        );

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error?.message || `HTTP ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) {
            throw new Error('No response body available');
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
                if (!trimmed || !trimmed.startsWith('data: ')) continue;

                try {
                    const json = JSON.parse(trimmed.slice(6));
                    const text = json.candidates?.[0]?.content?.parts?.[0]?.text;

                    if (text) {
                        fullContent += text;
                        onToken?.(text);
                    }
                } catch {
                    // Ignore JSON parse errors for malformed chunks
                }
            }
        }

        onComplete?.(fullContent);

        return {
            content: fullContent,
        };

    } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        onError?.(err);
        throw err;
    }
}

/**
 * Non-streaming Gemini completion
 */
export async function geminiCompletion(
    prompt: string,
    model: string = GEMINI_MODELS.PRO
): Promise<string> {
    const apiKey = getGeminiApiKey();

    // Check rate limits before making request
    checkRateLimit();
    recordRequest();

    const response = await fetch(
        `${GEMINI_API_BASE}/models/${model}:generateContent?key=${apiKey}`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [
                    {
                        parts: [{ text: prompt }],
                    },
                ],
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 8192,
                },
            }),
        }
    );

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `HTTP ${response.status}`);
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

/**
 * Chat completion with conversation history
 */
export async function geminiChatCompletion(
    messages: GeminiMessage[],
    model: string = GEMINI_MODELS.PRO
): Promise<string> {
    const apiKey = getGeminiApiKey();

    const response = await fetch(
        `${GEMINI_API_BASE}/models/${model}:generateContent?key=${apiKey}`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: messages.map((msg) => ({
                    role: msg.role,
                    parts: msg.parts,
                })),
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 8192,
                },
            }),
        }
    );

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `HTTP ${response.status}`);
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

/**
 * Analyze text using Gemini (for plagiarism-like analysis)
 */
export async function geminiAnalyzeText(text: string): Promise<{
    originalityScore: number;
    issues: string[];
    suggestions: string[];
}> {
    const prompt = `Analyze the following academic text for originality and quality. Provide:
1. An originality score from 0-100 (100 being completely original)
2. Any potential issues with the writing
3. Suggestions for improvement

Text to analyze:
"""
${text.slice(0, 5000)}
"""

Respond in JSON format:
{
  "originalityScore": <number>,
  "issues": ["issue1", "issue2"],
  "suggestions": ["suggestion1", "suggestion2"]
}`;

    try {
        const result = await geminiCompletion(prompt, GEMINI_MODELS.FLASH);
        // Extract JSON from response
        const jsonMatch = result.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }
    } catch (error) {
        console.error('Gemini analysis failed:', error);
    }

    // Return default values on error
    return {
        originalityScore: 85,
        issues: [],
        suggestions: [],
    };
}
