/**
 * Google Scholar Scraping Service
 * Scrapes Google Scholar for academic papers with AI-powered relevance scoring
 * 
 * Strategy:
 * 1. Use CORS proxy to fetch Scholar HTML
 * 2. Parse HTML to extract paper data
 * 3. Score relevance using Gemini AI
 * 4. Return only highly relevant papers
 */

import { geminiCompletion, GEMINI_MODELS } from './gemini-api';
import { Reference, Author } from './references-api';

// CORS proxy configuration with fallback chain
const CORS_PROXIES = [
    'https://api.allorigins.win/raw?url=',
    'https://corsproxy.io/?',
    'https://api.codetabs.com/v1/proxy?quest=',
];

// Rate limiting configuration
const RATE_LIMIT = {
    minInterval: 10000,      // 10 seconds between requests
    maxPerHour: 30,          // Max requests per hour
    requestTimes: [] as number[],
    lastRequest: 0,
};

// Cache for search results (5 minute TTL)
const searchCache = new Map<string, { results: ScholarResult[], timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export interface ScholarResult {
    title: string;
    authors: string[];
    year: number | null;
    venue: string;
    abstract: string;
    citationCount: number;
    url: string;
    pdfUrl?: string;
    relevanceScore?: number;  // 0-100, set by AI
}

/**
 * Search Google Scholar and return relevance-scored results
 */
export async function searchGoogleScholar(
    query: string,
    topic: string,
    limit: number = 10
): Promise<Reference[]> {
    // Check cache first
    const cacheKey = `${query}-${limit}`;
    const cached = searchCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        console.log('[Scholar] Using cached results');
        const scored = await scoreRelevance(cached.results, topic);
        return scored.map(normalizeToReference);
    }

    // Check rate limit
    await enforceRateLimit();

    // Fetch from Google Scholar
    const scholarUrl = buildScholarUrl(query, limit);
    let html: string;

    try {
        html = await fetchWithProxy(scholarUrl);
    } catch (error) {
        console.error('[Scholar] Fetch failed:', error);
        throw new Error('Failed to fetch from Google Scholar. Try again later.');
    }

    // Parse HTML
    const results = parseScholarHTML(html);

    if (results.length === 0) {
        console.warn('[Scholar] No results found or blocked by CAPTCHA');
        throw new Error('No results found. Google Scholar may be blocking requests.');
    }

    // Cache results
    searchCache.set(cacheKey, { results, timestamp: Date.now() });

    // Score relevance using AI
    const scoredResults = await scoreRelevance(results, topic);

    // Filter to only highly relevant papers (score >= 60)
    const relevant = scoredResults.filter(r => (r.relevanceScore || 0) >= 60);

    return relevant.map(normalizeToReference);
}

/**
 * Build Google Scholar search URL
 */
function buildScholarUrl(query: string, limit: number): string {
    const params = new URLSearchParams({
        q: query,
        hl: 'en',
        num: String(Math.min(limit, 20)), // Scholar max is 20
    });
    return `https://scholar.google.com/scholar?${params}`;
}

/**
 * Fetch HTML using CORS proxy with fallback chain
 */
async function fetchWithProxy(url: string): Promise<string> {
    let lastError: Error | null = null;

    for (const proxy of CORS_PROXIES) {
        try {
            const proxyUrl = proxy + encodeURIComponent(url);
            const response = await fetch(proxyUrl, {
                headers: {
                    'Accept': 'text/html',
                },
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const html = await response.text();

            // Check if we got actual content
            if (html.includes('gs_r') || html.includes('gs_ri')) {
                return html;
            }

            // Check for CAPTCHA
            if (html.includes('captcha') || html.includes('unusual traffic')) {
                throw new Error('CAPTCHA detected');
            }

            throw new Error('Invalid response');
        } catch (error) {
            lastError = error instanceof Error ? error : new Error(String(error));
            console.warn(`[Scholar] Proxy ${proxy} failed:`, lastError.message);
        }
    }

    throw lastError || new Error('All proxies failed');
}

/**
 * Parse Google Scholar HTML to extract paper data
 */
function parseScholarHTML(html: string): ScholarResult[] {
    const results: ScholarResult[] = [];

    // Create a DOM parser
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // Find all result containers
    const containers = doc.querySelectorAll('.gs_r.gs_or.gs_scl, .gs_r');

    containers.forEach(container => {
        try {
            // Title
            const titleEl = container.querySelector('.gs_rt a, .gs_rt');
            const title = titleEl?.textContent?.trim() || '';
            if (!title) return;

            // URL
            const linkEl = container.querySelector('.gs_rt a') as HTMLAnchorElement;
            const url = linkEl?.href || '';

            // Authors, venue, year from .gs_a
            const metaEl = container.querySelector('.gs_a');
            const metaText = metaEl?.textContent || '';
            const { authors, venue, year } = parseMetadata(metaText);

            // Abstract
            const abstractEl = container.querySelector('.gs_rs');
            const abstract = abstractEl?.textContent?.trim() || '';

            // Citation count
            const citationEl = Array.from(container.querySelectorAll('.gs_fl a'))
                .find(a => a.textContent?.includes('Cited by'));
            const citationMatch = citationEl?.textContent?.match(/Cited by (\d+)/);
            const citationCount = citationMatch ? parseInt(citationMatch[1]) : 0;

            // PDF URL
            const pdfEl = container.querySelector('.gs_or_ggsm a, a[href$=".pdf"]') as HTMLAnchorElement;
            const pdfUrl = pdfEl?.href;

            results.push({
                title,
                authors,
                year,
                venue,
                abstract,
                citationCount,
                url,
                pdfUrl,
            });
        } catch (e) {
            console.warn('[Scholar] Failed to parse result:', e);
        }
    });

    return results;
}

/**
 * Parse author/venue/year metadata string
 * Format: "A Author, B Author - Journal Name, 2023 - Publisher"
 */
function parseMetadata(text: string): { authors: string[], venue: string, year: number | null } {
    const parts = text.split(' - ');

    // Authors are before first dash
    const authorPart = parts[0] || '';
    const authors = authorPart.split(',').map(a => a.trim()).filter(a => a.length > 0);

    // Year is a 4-digit number
    const yearMatch = text.match(/\b(19|20)\d{2}\b/);
    const year = yearMatch ? parseInt(yearMatch[0]) : null;

    // Venue is typically in the middle part
    const venue = parts[1]?.replace(/,?\s*\d{4}/, '').trim() || '';

    return { authors, venue, year };
}

/**
 * Score paper relevance using Gemini AI
 */
async function scoreRelevance(results: ScholarResult[], topic: string): Promise<ScholarResult[]> {
    if (results.length === 0) return [];

    const prompt = `Score how RELEVANT each paper is to this research topic on a scale of 0-100.

Research Topic: "${topic}"

Papers to score:
${results.map((r, i) => `${i + 1}. "${r.title}" (${r.year || 'N/A'}) - ${r.abstract.slice(0, 150)}...`).join('\n')}

SCORING CRITERIA:
- 90-100: Directly addresses the exact topic
- 70-89: Closely related, covers main concepts
- 50-69: Somewhat related, shares some themes
- 30-49: Tangentially related
- 0-29: Not relevant

Respond with ONLY a JSON array of scores in order:
[score1, score2, score3, ...]`;

    try {
        const response = await geminiCompletion(prompt, GEMINI_MODELS.FLASH);
        const match = response.match(/\[[\s\S]*?\]/);

        if (match) {
            const scores: number[] = JSON.parse(match[0]);
            return results.map((r, i) => ({
                ...r,
                relevanceScore: scores[i] || 0,
            })).sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));
        }
    } catch (e) {
        console.error('[Scholar] Relevance scoring failed:', e);
    }

    // Fallback: return unsorted with default score
    return results.map(r => ({ ...r, relevanceScore: 50 }));
}

/**
 * Normalize ScholarResult to Reference format
 */
function normalizeToReference(result: ScholarResult): Reference {
    return {
        id: `scholar-${hashString(result.title)}`,
        title: result.title,
        authors: result.authors.map(name => ({ name })),
        year: result.year || new Date().getFullYear(),
        venue: result.venue,
        abstract: result.abstract,
        url: result.url,
        citationCount: result.citationCount,
        pdfUrl: result.pdfUrl,
        isOpenAccess: !!result.pdfUrl,
    };
}

/**
 * Simple string hash for ID generation
 */
function hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
}

/**
 * Rate limiting enforcement
 */
async function enforceRateLimit(): Promise<void> {
    const now = Date.now();

    // Clean old timestamps
    RATE_LIMIT.requestTimes = RATE_LIMIT.requestTimes.filter(t => now - t < 3600000);

    // Check hourly limit
    if (RATE_LIMIT.requestTimes.length >= RATE_LIMIT.maxPerHour) {
        throw new Error('Hourly request limit reached. Try again later.');
    }

    // Enforce minimum interval
    const timeSinceLastRequest = now - RATE_LIMIT.lastRequest;
    if (timeSinceLastRequest < RATE_LIMIT.minInterval) {
        const waitTime = RATE_LIMIT.minInterval - timeSinceLastRequest;
        await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    // Record this request
    RATE_LIMIT.lastRequest = Date.now();
    RATE_LIMIT.requestTimes.push(Date.now());
}

/**
 * Clear cache (for testing/debugging)
 */
export function clearScholarCache(): void {
    searchCache.clear();
}

/**
 * Get rate limit status
 */
export function getScholarRateLimitStatus(): {
    requestsThisHour: number;
    maxPerHour: number;
    canRequest: boolean;
    nextRequestIn: number;
} {
    const now = Date.now();
    const requestsThisHour = RATE_LIMIT.requestTimes.filter(t => now - t < 3600000).length;
    const timeSinceLastRequest = now - RATE_LIMIT.lastRequest;
    const nextRequestIn = Math.max(0, RATE_LIMIT.minInterval - timeSinceLastRequest);

    return {
        requestsThisHour,
        maxPerHour: RATE_LIMIT.maxPerHour,
        canRequest: requestsThisHour < RATE_LIMIT.maxPerHour && nextRequestIn === 0,
        nextRequestIn: Math.ceil(nextRequestIn / 1000),
    };
}
