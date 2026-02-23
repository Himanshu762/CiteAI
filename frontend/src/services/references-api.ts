/**
 * References API - Academic Paper Search
 * Uses CrossRef (free, no CORS) with fallback to OpenAlex as primary sources
 * Semantic Scholar has CORS issues from browser, so we use alternatives
 */

export interface Reference {
    id: string;
    title: string;
    authors: Author[];
    year: number;
    venue?: string;
    abstract?: string;
    doi?: string;
    url?: string;
    citationCount?: number;
    isOpenAccess?: boolean;
    pdfUrl?: string;
}

export interface Author {
    name: string;
    authorId?: string;
}

export interface ReferenceSearchParams {
    query: string;
    limit?: number;
    offset?: number;
    year?: { min?: number; max?: number };
    fieldsOfStudy?: string[];
    openAccessOnly?: boolean;
}

export interface SearchResult {
    references: Reference[];
    total: number;
    offset: number;
}

/**
 * Search for academic papers
 * Primary: Google Scholar (with AI relevance scoring)
 * Fallback: CrossRef and OpenAlex
 */
export async function searchReferences(params: ReferenceSearchParams & { topic?: string }): Promise<SearchResult> {
    const { query, limit = 10, offset = 0, topic } = params;

    // Try Google Scholar first (best relevance, but rate limited)
    if (topic) {
        try {
            const { searchGoogleScholar } = await import('./google-scholar');
            const scholarResults = await searchGoogleScholar(query, topic, limit);

            if (scholarResults.length > 0) {
                console.log('[References] Using Google Scholar results');
                return {
                    references: scholarResults,
                    total: scholarResults.length,
                    offset,
                };
            }
        } catch (error) {
            console.warn('[References] Google Scholar failed, falling back:', error);
        }
    }

    try {
        // Fallback to CrossRef - has no CORS issues
        const crossRefResults = await searchCrossRef(query, limit);

        if (crossRefResults.length > 0) {
            return {
                references: crossRefResults,
                total: crossRefResults.length,
                offset,
            };
        }

        // Fallback to OpenAlex (also CORS-friendly)
        return await searchOpenAlex(query, limit, offset);

    } catch (error) {
        console.error('Reference search error:', error);
        // Return empty results on error, don't throw
        return { references: [], total: 0, offset };
    }
}

/**
 * Search CrossRef for academic papers
 * Free API, no authentication needed, no CORS issues
 */
async function searchCrossRef(query: string, limit: number): Promise<Reference[]> {
    try {
        const response = await fetch(
            `https://api.crossref.org/works?query=${encodeURIComponent(query)}&rows=${limit}&select=DOI,title,author,published-print,container-title,abstract,is-referenced-by-count,link`,
            {
                headers: {
                    'Accept': 'application/json',
                },
            }
        );

        if (!response.ok) {
            throw new Error(`CrossRef API error: ${response.status}`);
        }

        const data = await response.json();

        return (data.message?.items || []).map((item: any) => {
            const year = item['published-print']?.['date-parts']?.[0]?.[0] ||
                item['published-online']?.['date-parts']?.[0]?.[0] ||
                item['created']?.['date-parts']?.[0]?.[0];

            const authors = (item.author || []).map((a: any) => ({
                name: `${a.given || ''} ${a.family || ''}`.trim() || 'Unknown',
            }));

            const doi = item.DOI;

            return {
                id: doi || `crossref-${Math.random().toString(36).slice(2)}`,
                title: Array.isArray(item.title) ? item.title[0] : item.title || 'Untitled',
                authors,
                year: year || 2023,
                venue: item['container-title']?.[0] || '',
                abstract: item.abstract?.replace(/<[^>]*>/g, '').slice(0, 500) || '',
                doi,
                url: doi ? `https://doi.org/${doi}` : item.URL,
                citationCount: item['is-referenced-by-count'] || 0,
                isOpenAccess: false,
                pdfUrl: item.link?.find((l: any) => l['content-type'] === 'application/pdf')?.URL,
            };
        });
    } catch (error) {
        console.error('CrossRef search failed:', error);
        return [];
    }
}

/**
 * Search OpenAlex for academic papers
 * Free API, no authentication needed for basic use
 */
async function searchOpenAlex(query: string, limit: number, offset: number): Promise<SearchResult> {
    try {
        const response = await fetch(
            `https://api.openalex.org/works?search=${encodeURIComponent(query)}&per-page=${limit}&page=${Math.floor(offset / limit) + 1}`,
            {
                headers: {
                    'Accept': 'application/json',
                },
            }
        );

        if (!response.ok) {
            throw new Error(`OpenAlex API error: ${response.status}`);
        }

        const data = await response.json();

        const references: Reference[] = (data.results || []).map((work: any) => {
            const authors = (work.authorships || []).map((a: any) => ({
                name: a.author?.display_name || 'Unknown',
                authorId: a.author?.id,
            }));

            return {
                id: work.id || `openalex-${Math.random().toString(36).slice(2)}`,
                title: work.title || 'Untitled',
                authors,
                year: work.publication_year || 2023,
                venue: work.primary_location?.source?.display_name || '',
                abstract: work.abstract_inverted_index
                    ? reconstructAbstract(work.abstract_inverted_index)
                    : '',
                doi: work.doi?.replace('https://doi.org/', ''),
                url: work.doi || work.id,
                citationCount: work.cited_by_count || 0,
                isOpenAccess: work.open_access?.is_oa || false,
                pdfUrl: work.open_access?.oa_url,
            };
        });

        return {
            references,
            total: data.meta?.count || references.length,
            offset,
        };
    } catch (error) {
        console.error('OpenAlex search failed:', error);
        return { references: [], total: 0, offset };
    }
}

/**
 * Reconstruct abstract from OpenAlex inverted index format
 */
function reconstructAbstract(invertedIndex: Record<string, number[]>): string {
    if (!invertedIndex) return '';

    const words: { word: string; position: number }[] = [];

    for (const [word, positions] of Object.entries(invertedIndex)) {
        for (const pos of positions) {
            words.push({ word, position: pos });
        }
    }

    words.sort((a, b) => a.position - b.position);
    return words.map(w => w.word).join(' ').slice(0, 500);
}

/**
 * Get a direct link to view/access the paper
 */
export function getPaperUrl(reference: Reference): string {
    if (reference.pdfUrl) return reference.pdfUrl;
    if (reference.doi) return `https://doi.org/${reference.doi}`;
    if (reference.url) return reference.url;
    // Fallback: Google Scholar search
    return `https://scholar.google.com/scholar?q=${encodeURIComponent(reference.title)}`;
}

/**
 * Generate smart search queries for a research topic using AI
 * Extracts key concepts that are more likely to find relevant academic papers
 */
export async function generateReferenceQueries(topic: string): Promise<string[]> {
    try {
        const { geminiCompletion, GEMINI_MODELS } = await import('./gemini-api');

        const prompt = `For this research topic, generate 3 academic search queries that would find the MOST RELEVANT papers.

Research Topic: "${topic}"

Guidelines:
- Extract the CORE CONCEPTS, not individual words
- Combine related concepts into searchable phrases
- Focus on the INTERSECTION of ideas (the unique contribution)
- Think about what papers this research would cite

Example:
Topic: "Role of Modular Python Design in Agile Business Analytics"
Good queries:
1. "modular software architecture business analytics" ← combines architecture + domain
2. "agile methodology software design patterns" ← combines methodology + design
3. "Python modular programming data analysis" ← combines language + technique + purpose

Bad queries:
- "Role of Modular" ← meaningless phrase
- "Python" ← too broad
- "Business" ← too generic

Respond with ONLY a JSON array of 3 search queries:
["query1", "query2", "query3"]`;

        const result = await geminiCompletion(prompt, GEMINI_MODELS.FLASH);
        const jsonMatch = result.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
            const queries = JSON.parse(jsonMatch[0]);
            return queries.filter((q: string) => q.length > 5);
        }
    } catch (e) {
        console.error('Query generation failed:', e);
    }

    // Fallback: use topic as is
    return [topic];
}

/**
 * Get recommended papers based on a topic using AI-generated queries
 * Searches using multiple concept-based queries and merges results
 */
export async function getAIRecommendedPapers(topic: string): Promise<Reference[]> {
    const queries = await generateReferenceQueries(topic);
    const allRefs: Reference[] = [];
    const seenIds = new Set<string>();

    // Search with each query
    for (const query of queries.slice(0, 3)) {
        try {
            const result = await searchReferences({ query, limit: 5 });
            for (const ref of result.references) {
                if (!seenIds.has(ref.id)) {
                    seenIds.add(ref.id);
                    allRefs.push(ref);
                }
            }
        } catch (e) {
            console.error('Search failed for query:', query, e);
        }
    }

    // Sort by citation count (most cited = more established)
    return allRefs.sort((a, b) => (b.citationCount || 0) - (a.citationCount || 0));
}

