/**
 * Model Status Service
 * Checks if AI models are available on OpenRouter
 */

import { API_CONFIG, getOpenRouterHeaders } from './api';

export interface ModelInfo {
    id: string;
    name: string;
    description: string;
    strengths: string[];
    contextLength: number;
    isFree: boolean;
    isOnline: boolean;
    lastChecked: Date | null;
    responseSpeed: 'fast' | 'medium' | 'slow';
}

// Available models with descriptions
export const MODEL_CATALOG: Omit<ModelInfo, 'isOnline' | 'lastChecked'>[] = [
    {
        id: 'meta-llama/llama-3.3-70b-instruct:free',
        name: 'Llama 3.3 70B',
        description: 'Meta\'s latest open-source model. Excellent for general academic writing.',
        strengths: ['General writing', 'Academic tone', 'Fast responses', 'Consistent quality'],
        contextLength: 128000,
        isFree: true,
        responseSpeed: 'fast',
    },
    {
        id: 'google/gemini-2.0-flash-lite-preview-02-05:free',
        name: 'Gemini 2.0 Flash Lite',
        description: 'Google\'s efficient model. Great for quick iterations and drafts.',
        strengths: ['Speed', 'Factual accuracy', 'Research summaries', 'Citations'],
        contextLength: 1000000,
        isFree: true,
        responseSpeed: 'fast',
    },
    {
        id: 'deepseek/deepseek-r1-distill-llama-70b:free',
        name: 'DeepSeek R1 Distill',
        description: 'Specialized for reasoning and technical content. Best for STEM papers.',
        strengths: ['Technical writing', 'Mathematics', 'Scientific reasoning', 'Detailed analysis'],
        contextLength: 64000,
        isFree: true,
        responseSpeed: 'medium',
    },
    {
        id: 'qwen/qwen-2.5-72b-instruct:free',
        name: 'Qwen 2.5 72B',
        description: 'Alibaba\'s flagship model. Strong multilingual and coding capabilities.',
        strengths: ['Multilingual', 'Code examples', 'Data analysis', 'Structured output'],
        contextLength: 32768,
        isFree: true,
        responseSpeed: 'medium',
    },
    {
        id: 'mistralai/mistral-small-24b-instruct-2501:free',
        name: 'Mistral Small 3',
        description: 'Efficient European model. Good balance of speed and quality.',
        strengths: ['Concise writing', 'European languages', 'Fast', 'Low resource usage'],
        contextLength: 32768,
        isFree: true,
        responseSpeed: 'fast',
    },
];

// Cache for model status
const statusCache = new Map<string, { isOnline: boolean; checkedAt: Date }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Check if a specific model is online
 */
export async function checkModelStatus(modelId: string): Promise<boolean> {
    const cached = statusCache.get(modelId);
    if (cached && Date.now() - cached.checkedAt.getTime() < CACHE_TTL) {
        return cached.isOnline;
    }

    try {
        const response = await fetch(`${API_CONFIG.openRouter.baseUrl}/models`, {
            headers: getOpenRouterHeaders(),
        });

        if (!response.ok) {
            console.warn('Failed to fetch models:', response.status);
            return true; // Assume online if we can't check
        }

        const data = await response.json();
        const models = data.data || [];

        // Update cache for all models
        const onlineModelIds = new Set(models.map((m: { id: string }) => m.id));

        MODEL_CATALOG.forEach(model => {
            statusCache.set(model.id, {
                isOnline: onlineModelIds.has(model.id),
                checkedAt: new Date(),
            });
        });

        return onlineModelIds.has(modelId);
    } catch (error) {
        console.error('Model status check failed:', error);
        return true; // Assume online on error
    }
}

/**
 * Get all models with their current status
 */
export async function getModelsWithStatus(): Promise<ModelInfo[]> {
    // First, trigger a status check
    await checkModelStatus(MODEL_CATALOG[0].id);

    return MODEL_CATALOG.map(model => {
        const cached = statusCache.get(model.id);
        return {
            ...model,
            isOnline: cached?.isOnline ?? true,
            lastChecked: cached?.checkedAt ?? null,
        };
    });
}

/**
 * Get a single model by ID
 */
export function getModelById(modelId: string): ModelInfo | undefined {
    const model = MODEL_CATALOG.find(m => m.id === modelId);
    if (!model) return undefined;

    const cached = statusCache.get(modelId);
    return {
        ...model,
        isOnline: cached?.isOnline ?? true,
        lastChecked: cached?.checkedAt ?? null,
    };
}

/**
 * Get recommended model based on paper type
 */
export function getRecommendedModel(paperType: 'general' | 'technical' | 'humanities' = 'general'): string {
    switch (paperType) {
        case 'technical':
            return 'deepseek/deepseek-r1-distill-llama-70b:free';
        case 'humanities':
            return 'meta-llama/llama-3.3-70b-instruct:free';
        default:
            return 'meta-llama/llama-3.3-70b-instruct:free';
    }
}
