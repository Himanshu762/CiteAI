/**
 * Kaggle API Integration Service
 * Real dataset search using Kaggle API (free with account)
 * 
 * API Documentation: https://www.kaggle.com/docs/api
 */

export interface KaggleDataset {
    id: string;
    ref: string;
    title: string;
    subtitle: string;
    creator: string;
    totalBytes: number;
    size: string;
    lastUpdated: string;
    downloadCount: number;
    voteCount: number;
    usabilityRating: number;
    licenseName: string;
    url: string;
    tags: string[];
}

export interface KaggleSearchParams {
    query: string;
    sortBy?: 'relevance' | 'hottest' | 'votes' | 'updated' | 'active';
    fileType?: 'csv' | 'json' | 'sqlite' | 'bigQuery';
    license?: 'all' | 'cc' | 'gpl' | 'odb' | 'other';
    page?: number;
    pageSize?: number;
}

const KAGGLE_API_BASE = 'https://www.kaggle.com/api/v1';

/**
 * Get Kaggle credentials from environment
 */
function getKaggleCredentials(): { username: string; key: string } | null {
    const username = import.meta.env.VITE_KAGGLE_USERNAME;
    const key = import.meta.env.VITE_KAGGLE_KEY;

    if (!username || !key || username === 'your_kaggle_username') {
        return null;
    }

    return { username, key };
}

/**
 * Check if Kaggle API is configured
 */
export function isKaggleConfigured(): boolean {
    return getKaggleCredentials() !== null;
}

/**
 * Get authorization headers for Kaggle API
 */
function getKaggleAuthHeaders(): HeadersInit {
    const creds = getKaggleCredentials();
    if (!creds) {
        throw new Error('Kaggle credentials not configured');
    }

    // Kaggle uses Basic Auth with username:key
    const authString = btoa(`${creds.username}:${creds.key}`);

    return {
        'Authorization': `Basic ${authString}`,
        'Content-Type': 'application/json',
    };
}

/**
 * Search datasets on Kaggle
 */
export async function searchKaggleDatasets(
    params: KaggleSearchParams
): Promise<KaggleDataset[]> {
    const {
        query,
        sortBy = 'relevance',
        fileType,
        license = 'all',
        page = 1,
        pageSize = 20
    } = params;

    const searchParams = new URLSearchParams({
        search: query,
        sortBy: sortBy === 'relevance' ? 'relevance' : sortBy,
        page: page.toString(),
        pageSize: Math.min(pageSize, 20).toString(),
    });

    if (fileType) {
        searchParams.set('fileType', fileType);
    }
    if (license !== 'all') {
        searchParams.set('license', license);
    }

    const response = await fetch(`${KAGGLE_API_BASE}/datasets/list?${searchParams}`, {
        method: 'GET',
        headers: getKaggleAuthHeaders(),
    });

    if (!response.ok) {
        if (response.status === 401) {
            throw new Error('Invalid Kaggle credentials. Please check your API key.');
        }
        throw new Error(`Kaggle API error: ${response.status}`);
    }

    const datasets = await response.json();

    return datasets.map((ds: any) => ({
        id: ds.id?.toString() || ds.ref,
        ref: ds.ref,
        title: ds.title,
        subtitle: ds.subtitle || '',
        creator: ds.ownerUser || ds.creatorName || 'Unknown',
        totalBytes: ds.totalBytes || 0,
        size: formatBytes(ds.totalBytes || 0),
        lastUpdated: ds.lastUpdated || ds.currentDatasetVersionCreatedAt || '',
        downloadCount: ds.downloadCount || 0,
        voteCount: ds.voteCount || 0,
        usabilityRating: ds.usabilityRating || 0,
        licenseName: ds.licenseName || 'Unknown',
        url: `https://www.kaggle.com/datasets/${ds.ref}`,
        tags: ds.tags || [],
    }));
}

/**
 * Get dataset metadata
 */
export async function getKaggleDatasetMetadata(
    ownerSlug: string,
    datasetSlug: string
): Promise<any> {
    const response = await fetch(
        `${KAGGLE_API_BASE}/datasets/metadata/${ownerSlug}/${datasetSlug}`,
        {
            method: 'GET',
            headers: getKaggleAuthHeaders(),
        }
    );

    if (!response.ok) {
        throw new Error(`Failed to get dataset metadata: ${response.status}`);
    }

    return response.json();
}

/**
 * Format bytes to human readable string
 */
function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}
