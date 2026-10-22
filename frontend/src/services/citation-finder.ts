/**
 * Find real sources for claims that lack a citation.
 * Candidates come from OpenAlex; the model only judges, from each abstract, whether the
 * source supports the claim. Nothing is inserted unless the user picks a source.
 */

import { completeLLM, parseJSONResponse } from './llm';
import { Reference, searchReferences } from './references-api';
import {
    CitationStyle, formatDatasetCitation, formatInTextCitation, formatReference, generateStyledReferenceList, isNumberedStyle,
    renumberCitations, CITATION_STYLES,
} from './citation-formatter';
import type { PaperSection } from './paper-generator';

export interface ClaimLocation {
    sectionId: string;
    sectionTitle: string;
    paragraph: number;
    sentence: string;
}

export type SupportVerdict = 'supports' | 'related' | 'unrelated' | 'unchecked';

export interface SourceCandidate {
    reference: Reference;
    verdict: SupportVerdict;
    reason: string;
}

// Abbreviations that end with a period but do not end a sentence
const ABBREVIATIONS = /\b(et al|e\.g|i\.e|etc|vs|cf|Fig|Figs|Eq|Eqs|Dr|Mr|Ms|Prof|No|Vol|pp|approx|ca)\.$/i;

export function splitSentences(paragraph: string): string[] {
    const sentences: string[] = [];
    let start = 0;
    const re = /[.!?]+["')\]]*\s+(?=["([]?[A-Z0-9])/g;
    for (const m of paragraph.matchAll(re)) {
        const end = m.index! + m[0].length;
        const candidate = paragraph.slice(start, end).trim();
        if (ABBREVIATIONS.test(paragraph.slice(start, m.index! + 1).trim())) continue;
        sentences.push(candidate);
        start = end;
    }
    const rest = paragraph.slice(start).trim();
    if (rest) sentences.push(rest);
    return sentences;
}

const CITATION_PATTERNS = [
    /\([^()]*\b(1[5-9]|20)\d{2}[a-z]?\b[^()]*\)/,          // (Author, 2020), (2020)
    /\b(1[5-9]|20)\d{2}[a-z]?\)/,                           // Author (2020)
    /\[\d+(?:\s*[-–,]\s*\d+)*\]/,                           // [3], [1, 4]
    /\bet al\./,
    /\((?:[A-Z][\w'’-]+)(?:\s+(?:and|&)\s+[A-Z][\w'’-]+)?(?:\s+et al\.)?(?:\s+\d+(?:-\d+)?)?\)/, // MLA (Author 12)
    /\(n\.d\.\)|no date/,
];

export function hasCitation(sentence: string): boolean {
    return CITATION_PATTERNS.some(p => p.test(sentence));
}

// Statements about the paper itself or its own analysis do not need outside sources
const OWN_WORK = /\b(this (paper|study|essay|report|section|article|analysis)|we |our |in this |table \d|figure \d)/i;

/**
 * Sentences in body sections that make a claim without citing anything
 */
export function findUncitedClaims(sections: PaperSection[], options: { minWords?: number; max?: number } = {}): ClaimLocation[] {
    const { minWords = 12, max = 20 } = options;
    const claims: ClaimLocation[] = [];
    for (const section of sections) {
        if (section.id === 'references' || section.id === 'abstract') continue;
        section.content.split(/\n\s*\n/).forEach((paragraph, p) => {
            for (const sentence of splitSentences(paragraph.replace(/\s*\n\s*/g, ' '))) {
                if (claims.length >= max) return;
                const words = sentence.split(/\s+/).length;
                if (words < minWords || sentence.endsWith('?') || hasCitation(sentence) || OWN_WORK.test(sentence)) continue;
                claims.push({ sectionId: section.id, sectionTitle: section.title, paragraph: p, sentence });
            }
        });
    }
    return claims;
}

const STOPWORDS = new Set('a an the of and or in on for to with by from as is are was were be been that this these those it its their which than more most also can may has have had into such between across'.split(' '));

function keywordQuery(sentence: string): string {
    return sentence.replace(/[^\w\s-]/g, ' ').split(/\s+/)
        .filter(w => w.length > 2 && !STOPWORDS.has(w.toLowerCase()))
        .slice(0, 8).join(' ');
}

async function searchQueryFor(claim: string, discipline?: string): Promise<string> {
    try {
        const raw = await completeLLM(`Write a 3-8 word academic database search query that would find papers supporting this claim${discipline ? ` in ${discipline}` : ''}.
Claim: "${claim}"
Respond ONLY with JSON: {"query": "..."}`, { temperature: 0.2, maxTokens: 120 });
        const q = parseJSONResponse<{ query?: unknown }>(raw).query;
        if (typeof q === 'string' && q.trim()) return q.trim();
    } catch {
        // Fall back to keywords below
    }
    return keywordQuery(claim);
}

async function assessSupport(claim: string, refs: Reference[]): Promise<{ verdict: SupportVerdict; reason: string }[]> {
    const withAbstract = refs.map((r, i) => ({ r, i })).filter(x => x.r.abstract);
    const results: { verdict: SupportVerdict; reason: string }[] = refs.map(r => ({
        verdict: 'unchecked',
        reason: r.abstract ? 'Could not be checked automatically' : 'No abstract available; read the paper to check',
    }));
    if (withAbstract.length === 0) return results;

    try {
        const listing = withAbstract.map(({ r, i }) => `[${i}] ${r.title}\nAbstract: ${(r.abstract ?? '').slice(0, 700)}`).join('\n\n');
        const raw = await completeLLM(`For each source, judge from its abstract whether it supports this claim.
"supports": the abstract directly backs the claim. "related": same topic but does not establish the claim. "unrelated": off topic.

Claim: "${claim}"

Sources:
${listing}

Respond ONLY with a JSON array: [{"index": 0, "verdict": "supports|related|unrelated", "reason": "one short sentence"}]`, { temperature: 0, maxTokens: 600 });
        for (const item of parseJSONResponse<{ index?: unknown; verdict?: unknown; reason?: unknown }[]>(raw)) {
            if (typeof item.index !== 'number' || !results[item.index] || !refs[item.index].abstract) continue;
            if (item.verdict === 'supports' || item.verdict === 'related' || item.verdict === 'unrelated') {
                results[item.index] = { verdict: item.verdict, reason: typeof item.reason === 'string' ? item.reason : '' };
            }
        }
    } catch {
        // Leave everything "unchecked" rather than guess
    }
    return results;
}

const VERDICT_ORDER: Record<SupportVerdict, number> = { supports: 0, related: 1, unchecked: 2, unrelated: 3 };

export async function findSourcesForClaim(
    claim: string,
    options: { fieldId?: string; discipline?: string; limit?: number } = {}
): Promise<SourceCandidate[]> {
    const query = await searchQueryFor(claim, options.discipline);
    const { references } = await searchReferences({ query, limit: 5, fieldId: options.fieldId });
    if (references.length === 0) return [];
    const verdicts = await assessSupport(claim, references);
    return references
        .map((reference, i) => ({ reference, ...verdicts[i] }))
        .sort((a, b) => VERDICT_ORDER[a.verdict] - VERDICT_ORDER[b.verdict])
        .slice(0, options.limit ?? 4);
}

// --- Inserting a chosen citation ------------------------------------------------

export interface CitablePaper {
    sections: PaperSection[];
    sources: Reference[];
    datasets: { id: string; title: string; url: string }[];
    citationStyle: CitationStyle;
    origin: 'generated' | 'imported';
}

/** Put the citation before the sentence's closing punctuation */
function withCitation(sentence: string, citation: string): string {
    const m = sentence.match(/^(.*?)([.!?]+["')\]]*)$/s);
    return m ? `${m[1]} ${citation}${m[2]}` : `${sentence} ${citation}`;
}

function rebuildReferences(sources: Reference[], datasets: CitablePaper['datasets'], style: CitationStyle): string {
    const literature = sources.length ? [generateStyledReferenceList(sources, style)] : [];
    const data = datasets.map((d, j) => {
        const entry = formatDatasetCitation(d, style);
        return isNumberedStyle(style) ? `[${sources.length + j + 1}] ${entry}` : entry;
    });
    return [...literature, ...data].join('\n\n');
}

/**
 * Insert a citation for `ref` after the claim and add it to the reference list.
 * Generated papers rebuild the list from their sources; imported drafts keep the student's
 * own list and get the new entry added to it.
 */
export function insertCitation(paper: CitablePaper, claim: ClaimLocation, ref: Reference): { sections: PaperSection[]; sources: Reference[] } {
    const style = paper.citationStyle;
    let sources = paper.sources.some(s => s.id === ref.id) ? paper.sources : [...paper.sources, ref];
    const refsSection = paper.sections.find(s => s.id === 'references');
    const importedEntries = paper.origin === 'imported' && refsSection
        ? refsSection.content.split(/\n\s*\n/).map(e => e.trim()).filter(Boolean)
        : [];

    // Numbered styles: imported drafts continue their own numbering; generated papers renumber below
    const number = isNumberedStyle(style)
        ? (paper.origin === 'imported'
            ? importedEntries.length + 1
            : sources.findIndex(s => s.id === ref.id) + 1)
        : undefined;
    const citation = formatInTextCitation(ref, style, number);

    let sections = paper.sections.map(section => {
        if (section.id !== claim.sectionId) return section;
        const paragraphs = section.content.split(/\n\s*\n/);
        const target = paragraphs[claim.paragraph] ?? '';
        const flat = target.replace(/\s*\n\s*/g, ' ');
        if (!flat.includes(claim.sentence)) return section;
        paragraphs[claim.paragraph] = flat.replace(claim.sentence, withCitation(claim.sentence, citation));
        const content = paragraphs.join('\n\n');
        return { ...section, content, wordCount: content.split(/\s+/).filter(Boolean).length };
    });

    if (paper.origin === 'imported') {
        const entry = formatReference(ref, style, number);
        const alreadyListed = importedEntries.some(e => e.includes(ref.title));
        const entries = alreadyListed ? importedEntries : [...importedEntries, entry];
        // Author-date lists are alphabetical; numbered lists keep their order
        if (!isNumberedStyle(style)) entries.sort((a, b) => a.replace(/^\W+/, '').localeCompare(b.replace(/^\W+/, '')));
        sections = upsertReferences(sections, entries.join('\n\n'), style);
        return { sections, sources };
    }

    if (isNumberedStyle(style)) {
        const prose = sections.filter(s => s.id !== 'references');
        const { texts, order } = renumberCitations(prose.map(s => s.content), sources.length);
        const renumbered = new Map(prose.map((s, i) => [s.id, texts[i]]));
        sections = sections.map(s => (renumbered.has(s.id) ? { ...s, content: renumbered.get(s.id)! } : s));
        if (order.length) sources = order.map(n => sources[n - 1]);
    }
    sections = upsertReferences(sections, rebuildReferences(sources, paper.datasets, style), style);
    return { sections, sources };
}

function upsertReferences(sections: PaperSection[], content: string, style: CitationStyle): PaperSection[] {
    const wordCount = content.split(/\s+/).filter(Boolean).length;
    if (sections.some(s => s.id === 'references')) {
        return sections.map(s => (s.id === 'references' ? { ...s, content, wordCount } : s));
    }
    return [...sections, {
        id: 'references', title: CITATION_STYLES[style].referencesTitle, content, wordCount, isGenerating: false, isComplete: true,
    }];
}
