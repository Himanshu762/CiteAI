/**
 * Hugging Face Datasets API Integration
 * Real dataset search using Hugging Face Hub API (free: 300 req/hr)
 * 
 * API Documentation: https://huggingface.co/docs/hub/api
 */

export interface HFDataset {
    id: string;
    author: string;
    title: string;
    description: string;
    downloads: number;
    likes: number;
    lastModified: string;
    tags: string[];
    cardData?: {
        license?: string;
        language?: string[];
        size_categories?: string[];
        task_categories?: string[];
    };
    url: string;
}

export interface HFSearchParams {
    query: string;
    limit?: number;
    author?: string;
    tags?: string[];
}

const HF_API_BASE = 'https://huggingface.co/api';

/**
 * Get Hugging Face token from environment (optional - increases rate limits)
 */
function getHFToken(): string | null {
    const token = import.meta.env.VITE_HF_TOKEN;
    if (!token || token === 'your_huggingface_token') {
        return null;
    }
    return token;
}

/**
 * Check if Hugging Face token is configured (optional - works without it)
 */
export function isHFConfigured(): boolean {
    return true; // Works without token, just with lower rate limits
}

/**
 * Get headers for Hugging Face API
 */
function getHFHeaders(): HeadersInit {
    const headers: HeadersInit = {
        'Content-Type': 'application/json',
    };

    const token = getHFToken();
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
}

/**
 * Search datasets on Hugging Face
 */
export async function searchHFDatasets(
    params: HFSearchParams
): Promise<HFDataset[]> {
    const { query, limit = 20, author, tags } = params;

    const searchParams = new URLSearchParams({
        search: query,
        limit: Math.min(limit, 100).toString(),
        full: 'true',
    });

    if (author) {
        searchParams.set('author', author);
    }

    const response = await fetch(
        `${HF_API_BASE}/datasets?${searchParams}`,
        {
            method: 'GET',
            headers: getHFHeaders(),
        }
    );

    if (!response.ok) {
        if (response.status === 429) {
            throw new Error('Rate limit exceeded. Please try again later.');
        }
        throw new Error(`Hugging Face API error: ${response.status}`);
    }

    const datasets = await response.json();

    return datasets.map((ds: any) => ({
        id: ds.id || ds._id,
        author: ds.author || ds.id?.split('/')[0] || 'Unknown',
        title: ds.id?.split('/').pop() || ds.id,
        description: ds.description || ds.cardData?.description || '',
        downloads: ds.downloads || 0,
        likes: ds.likes || 0,
        lastModified: ds.lastModified || '',
        tags: ds.tags || [],
        cardData: ds.cardData || {},
        url: `https://huggingface.co/datasets/${ds.id}`,
    }));
}

/**
 * Get dataset card (README) from Hugging Face
 */
export async function getHFDatasetCard(datasetId: string): Promise<string> {
    const response = await fetch(
        `${HF_API_BASE}/datasets/${datasetId}/resolve/main/README.md`,
        {
            method: 'GET',
            headers: getHFHeaders(),
        }
    );

    if (!response.ok) {
        return '';
    }

    return response.text();
}

/**
 * Get dataset info/metadata
 */
export async function getHFDatasetInfo(datasetId: string): Promise<any> {
    const response = await fetch(
        `${HF_API_BASE}/datasets/${datasetId}`,
        {
            method: 'GET',
            headers: getHFHeaders(),
        }
    );

    if (!response.ok) {
        throw new Error(`Failed to get dataset info: ${response.status}`);
    }

    return response.json();
}

/**
 * Get dataset parquet files info (for size estimation)
 */
export async function getHFDatasetFiles(datasetId: string): Promise<any[]> {
    const response = await fetch(
        `${HF_API_BASE}/datasets/${datasetId}/tree/main`,
        {
            method: 'GET',
            headers: getHFHeaders(),
        }
    );

    if (!response.ok) {
        return [];
    }

    return response.json();
}
