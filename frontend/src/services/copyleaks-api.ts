/**
 * Copyleaks API Integration Service
 * Real plagiarism detection using Copyleaks API (Free tier: 20 pages/month)
 * 
 * API Documentation: https://api.copyleaks.com/documentation
 */

export interface CopyleaksConfig {
    email: string;
    apiKey: string;
}

export interface CopyleaksScanResult {
    scannedDocument: {
        scanId: string;
        totalWords: number;
        totalExcluded: number;
        credits: number;
        creationTime: string;
    };
    results: CopyleaksMatch[];
    statistics: {
        aggregatedScore: number;
        identicalWords: number;
        minorChangedWords: number;
        relatedMeaningWords: number;
    };
}

export interface CopyleaksMatch {
    id: string;
    title: string;
    introduction: string;
    url: string;
    matchedWords: number;
    matchPercentage: number;
}

export interface CopyleaksAuthToken {
    accessToken: string;
    expiresIn: number;
    issuedAt: Date;
}

const COPYLEAKS_API_BASE = 'https://api.copyleaks.com/v3';
const COPYLEAKS_ID_API = 'https://id.copyleaks.com/v3';

let authToken: CopyleaksAuthToken | null = null;

/**
 * Get Copyleaks credentials from environment
 */
function getCredentials(): CopyleaksConfig {
    const email = import.meta.env.VITE_COPYLEAKS_EMAIL;
    const apiKey = import.meta.env.VITE_COPYLEAKS_API_KEY;

    if (!email || !apiKey || email === 'your_email@example.com') {
        throw new Error('Copyleaks credentials not configured. Please set VITE_COPYLEAKS_EMAIL and VITE_COPYLEAKS_API_KEY in .env');
    }

    return { email, apiKey };
}

/**
 * Check if credentials are configured
 */
export function isCopyleaksConfigured(): boolean {
    try {
        getCredentials();
        return true;
    } catch {
        return false;
    }
}

/**
 * Authenticate with Copyleaks API
 * Token is valid for 48 hours
 */
export async function authenticate(): Promise<string> {
    // Check if we have a valid cached token
    if (authToken && authToken.issuedAt) {
        const elapsed = Date.now() - authToken.issuedAt.getTime();
        const expiresInMs = authToken.expiresIn * 1000;
        if (elapsed < expiresInMs - 60000) { // 1 minute buffer
            return authToken.accessToken;
        }
    }

    const { email, apiKey } = getCredentials();

    const response = await fetch(`${COPYLEAKS_ID_API}/account/login/api`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            email,
            key: apiKey,
        }),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || `Authentication failed: ${response.status}`);
    }

    const data = await response.json();

    authToken = {
        accessToken: data.access_token,
        expiresIn: data.expires_in || 172800, // Default 48 hours
        issuedAt: new Date(),
    };

    return authToken.accessToken;
}

/**
 * Get authorization headers
 */
async function getAuthHeaders(): Promise<HeadersInit> {
    const token = await authenticate();
    return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
    };
}

/**
 * Submit text for plagiarism scanning
 * Returns scan ID for result retrieval
 */
export async function submitScan(text: string, scanId?: string): Promise<string> {
    const headers = await getAuthHeaders();
    const id = scanId || `citeai-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Encode text to base64
    const base64Text = btoa(unescape(encodeURIComponent(text)));

    const webhookUrl = import.meta.env.VITE_API_URL || window.location.origin;

    const response = await fetch(`${COPYLEAKS_API_BASE}/businesses/submit/file/${id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
            base64: base64Text,
            filename: 'document.txt',
            properties: {
                webhooks: {
                    status: `${webhookUrl}/api/copyleaks/status/{STATUS}/${id}`,
                },
                sandbox: false, // Set to true for testing without using credits
                includeHtml: false,
                developerPayload: JSON.stringify({ source: 'citeai' }),
            },
        }),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || `Scan submission failed: ${response.status}`);
    }

    return id;
}

/**
 * Get scan status
 */
export async function getScanStatus(scanId: string): Promise<'pending' | 'completed' | 'error'> {
    const headers = await getAuthHeaders();

    try {
        const response = await fetch(`${COPYLEAKS_API_BASE}/businesses/${scanId}/status`, {
            method: 'GET',
            headers,
        });

        if (!response.ok) {
            if (response.status === 404) {
                return 'pending';
            }
            return 'error';
        }

        const data = await response.json();
        return data.status === 'Completed' ? 'completed' : 'pending';
    } catch {
        return 'error';
    }
}

/**
 * Get scan results
 */
export async function getScanResults(scanId: string): Promise<CopyleaksScanResult> {
    const headers = await getAuthHeaders();

    const response = await fetch(`${COPYLEAKS_API_BASE}/businesses/${scanId}/result`, {
        method: 'GET',
        headers,
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || `Failed to get results: ${response.status}`);
    }

    const data = await response.json();

    // Transform to our format
    return {
        scannedDocument: {
            scanId: data.scannedDocument?.scanId || scanId,
            totalWords: data.scannedDocument?.totalWords || 0,
            totalExcluded: data.scannedDocument?.totalExcluded || 0,
            credits: data.scannedDocument?.credits || 1,
            creationTime: data.scannedDocument?.creationTime || new Date().toISOString(),
        },
        results: (data.results?.internet || []).map((result: any) => ({
            id: result.id,
            title: result.title || 'Unknown Source',
            introduction: result.introduction || '',
            url: result.url || '',
            matchedWords: result.matchedWords || 0,
            matchPercentage: result.percentPlagiarized || 0,
        })),
        statistics: {
            aggregatedScore: data.statistics?.aggregatedScore || 0,
            identicalWords: data.statistics?.identicalWords || 0,
            minorChangedWords: data.statistics?.minorChangedWords || 0,
            relatedMeaningWords: data.statistics?.relatedMeaningWords || 0,
        },
    };
}

/**
 * Full plagiarism check with polling
 * Submits scan and polls for results
 */
export async function checkPlagiarismWithCopyleaks(
    text: string,
    onProgress?: (status: string) => void
): Promise<CopyleaksScanResult> {
    onProgress?.('Submitting document for scanning...');

    const scanId = await submitScan(text);

    onProgress?.('Scanning in progress...');

    // Poll for completion (max 5 minutes)
    const maxAttempts = 60;
    const pollInterval = 5000; // 5 seconds

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        await new Promise(resolve => setTimeout(resolve, pollInterval));

        const status = await getScanStatus(scanId);

        if (status === 'completed') {
            onProgress?.('Retrieving results...');
            return await getScanResults(scanId);
        }

        if (status === 'error') {
            throw new Error('Scan failed. Please try again.');
        }

        onProgress?.(`Scanning... (${Math.round((attempt / maxAttempts) * 100)}%)`);
    }

    throw new Error('Scan timed out. Please try again later.');
}

/**
 * Get remaining credits
 */
export async function getRemainingCredits(): Promise<number> {
    const headers = await getAuthHeaders();

    try {
        const response = await fetch(`${COPYLEAKS_API_BASE}/businesses/credits`, {
            method: 'GET',
            headers,
        });

        if (!response.ok) {
            return -1;
        }

        const data = await response.json();
        return data.amount || 0;
    } catch {
        return -1;
    }
}
