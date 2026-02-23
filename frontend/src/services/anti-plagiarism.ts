/**
 * Anti-Plagiarism Service v2
 * 
 * 4-Layer Anti-Plagiarism System:
 * 1. Synonym Rotation - Replace words with synonyms
 * 2. Sentence Restructuring - Change sentence structure
 * 3. Quote Integration - Properly cite sources
 * 4. Information Reordering - Shuffle content flow
 */

import { SYNONYMS } from './humanizer-v2';

export interface AntiPlagiarismResult {
    originalText: string;
    processedText: string;
    changesApplied: ChangeRecord[];
    estimatedSimilarityReduction: number;
}

export interface ChangeRecord {
    type: 'synonym' | 'restructure' | 'quote' | 'reorder';
    original: string;
    replacement: string;
}

// Extended synonym database for anti-plagiarism
const EXTENDED_SYNONYMS: Record<string, string[]> = {
    ...SYNONYMS,
    // Academic terms
    'research': ['study', 'investigation', 'analysis', 'inquiry', 'examination'],
    'study': ['research', 'investigation', 'analysis', 'examination', 'survey'],
    'analysis': ['examination', 'assessment', 'evaluation', 'review', 'study'],
    'method': ['approach', 'technique', 'procedure', 'process', 'methodology'],
    'results': ['findings', 'outcomes', 'data', 'evidence', 'conclusions'],
    'findings': ['results', 'discoveries', 'observations', 'outcomes', 'data'],
    'evidence': ['proof', 'data', 'support', 'documentation', 'verification'],
    'conclusion': ['finding', 'determination', 'outcome', 'result', 'verdict'],
    'impact': ['effect', 'influence', 'consequence', 'result', 'outcome'],
    'develop': ['create', 'build', 'establish', 'form', 'design'],
    'create': ['develop', 'produce', 'generate', 'form', 'establish'],
    'evaluate': ['assess', 'analyze', 'examine', 'review', 'appraise'],
    'examine': ['analyze', 'study', 'investigate', 'review', 'scrutinize'],
    'significant': ['notable', 'important', 'substantial', 'meaningful', 'considerable'],
    'various': ['different', 'diverse', 'several', 'multiple', 'numerous'],
    'previous': ['prior', 'earlier', 'past', 'former', 'preceding'],
    'current': ['present', 'existing', 'ongoing', 'contemporary', 'modern'],
    'improve': ['enhance', 'better', 'upgrade', 'advance', 'refine'],
    'successful': ['effective', 'productive', 'fruitful', 'triumphant', 'accomplished'],
    'problem': ['issue', 'challenge', 'difficulty', 'concern', 'obstacle'],
    'solution': ['answer', 'resolution', 'remedy', 'fix', 'approach'],
    'approach': ['method', 'strategy', 'technique', 'way', 'manner'],
    'example': ['instance', 'case', 'illustration', 'sample', 'demonstration'],
    'process': ['procedure', 'method', 'operation', 'system', 'mechanism'],
    'system': ['framework', 'structure', 'mechanism', 'arrangement', 'setup'],
    'factor': ['element', 'component', 'aspect', 'consideration', 'variable'],
    'aspect': ['element', 'feature', 'component', 'dimension', 'facet'],
    'relationship': ['connection', 'link', 'association', 'correlation', 'tie'],
    'context': ['setting', 'situation', 'environment', 'background', 'framework'],
    'theory': ['concept', 'hypothesis', 'principle', 'framework', 'model'],
    'concept': ['idea', 'notion', 'theory', 'principle', 'thought'],
    'data': ['information', 'evidence', 'facts', 'statistics', 'figures'],
    'information': ['data', 'details', 'facts', 'knowledge', 'intelligence'],
};

// Sentence structure patterns for restructuring
const RESTRUCTURE_PATTERNS: Array<{
    pattern: RegExp;
    transforms: Array<(match: RegExpMatchArray) => string>;
}> = [
        {
            // "X causes Y" → "Y is caused by X" / "Y results from X"
            pattern: /(\w+(?:\s+\w+)*)\s+causes?\s+(\w+(?:\s+\w+)*)/gi,
            transforms: [
                (m) => `${m[2]} is caused by ${m[1]}`,
                (m) => `${m[2]} results from ${m[1]}`,
                (m) => `${m[1]} leads to ${m[2]}`,
            ],
        },
        {
            // "X shows that Y" → "It is shown by X that Y" / "Y, as X shows"
            pattern: /(\w+(?:\s+\w+)*)\s+shows?\s+that\s+(.+)/gi,
            transforms: [
                (m) => `It is shown by ${m[1]} that ${m[2]}`,
                (m) => `${m[2]}, as ${m[1]} shows`,
                (m) => `According to ${m[1]}, ${m[2]}`,
            ],
        },
        {
            // "X is important for Y" → "Y requires X" / "For Y, X is essential"
            pattern: /(\w+(?:\s+\w+)*)\s+is\s+important\s+for\s+(\w+(?:\s+\w+)*)/gi,
            transforms: [
                (m) => `${m[2]} requires ${m[1]}`,
                (m) => `For ${m[2]}, ${m[1]} is essential`,
                (m) => `${m[2]} depends on ${m[1]}`,
            ],
        },
        {
            // "The study found that X" → "X was found in the study" / "Findings indicate X"
            pattern: /The\s+study\s+found\s+that\s+(.+)/gi,
            transforms: [
                (m) => `${m[1]} was found in the study`,
                (m) => `Findings indicate that ${m[1]}`,
                (m) => `Research revealed that ${m[1]}`,
            ],
        },
        {
            // "Research suggests that X" → "X is suggested by research"
            pattern: /Research\s+suggests?\s+that\s+(.+)/gi,
            transforms: [
                (m) => `It is suggested by research that ${m[1]}`,
                (m) => `${m[1]}, research suggests`,
                (m) => `According to research, ${m[1]}`,
            ],
        },
        {
            // "X has been shown to Y" → "Studies show X leads to Y"
            pattern: /(\w+(?:\s+\w+)*)\s+has\s+been\s+shown\s+to\s+(.+)/gi,
            transforms: [
                (m) => `Studies show ${m[1]} leads to ${m[2]}`,
                (m) => `Evidence indicates ${m[1]} can ${m[2]}`,
                (m) => `${m[1]} demonstrably ${m[2]}`,
            ],
        },
    ];

/**
 * Main anti-plagiarism function
 */
export function reduceTextSimilarity(
    text: string,
    intensity: 'light' | 'moderate' | 'strong' = 'moderate'
): AntiPlagiarismResult {
    const changes: ChangeRecord[] = [];
    let processedText = text;

    // Layer 1: Synonym Rotation
    processedText = applySynonymRotation(processedText, intensity, changes);

    // Layer 2: Sentence Restructuring
    if (intensity !== 'light') {
        processedText = applySentenceRestructuring(processedText, changes);
    }

    // Layer 3: Add variety through paraphrasing patterns
    if (intensity === 'strong') {
        processedText = applyParaphrasingPatterns(processedText, changes);
    }

    // Layer 4: Information Reordering (at paragraph level)
    if (intensity === 'strong') {
        processedText = reorderInformation(processedText, changes);
    }

    // Calculate estimated reduction
    const estimatedSimilarityReduction = calculateSimilarityReduction(changes, intensity);

    return {
        originalText: text,
        processedText,
        changesApplied: changes,
        estimatedSimilarityReduction,
    };
}

/**
 * Layer 1: Synonym Rotation
 */
function applySynonymRotation(
    text: string,
    intensity: 'light' | 'moderate' | 'strong',
    changes: ChangeRecord[]
): string {
    let result = text;

    // Determine replacement frequency based on intensity
    const replacementRate = intensity === 'light' ? 0.2 : intensity === 'moderate' ? 0.4 : 0.6;

    for (const [word, synonyms] of Object.entries(EXTENDED_SYNONYMS)) {
        const regex = new RegExp(`\\b${word}\\b`, 'gi');
        let matchCount = 0;

        result = result.replace(regex, (match) => {
            matchCount++;
            // Replace based on rate
            if (Math.random() < replacementRate) {
                const synonym = synonyms[Math.floor(Math.random() * synonyms.length)];
                const replacement = preserveCase(match, synonym);

                changes.push({
                    type: 'synonym',
                    original: match,
                    replacement,
                });

                return replacement;
            }
            return match;
        });
    }

    return result;
}

/**
 * Layer 2: Sentence Restructuring
 */
function applySentenceRestructuring(
    text: string,
    changes: ChangeRecord[]
): string {
    let result = text;

    for (const { pattern, transforms } of RESTRUCTURE_PATTERNS) {
        result = result.replace(pattern, (match, ...groups) => {
            // Skip some matches to avoid over-processing
            if (Math.random() > 0.5) return match;

            const stringGroups = groups.filter((g): g is string => typeof g === 'string');
            const matchArray: RegExpMatchArray = [match, ...stringGroups] as RegExpMatchArray;
            const transform = transforms[Math.floor(Math.random() * transforms.length)];
            const replacement = transform(matchArray);

            if (replacement !== match) {
                changes.push({
                    type: 'restructure',
                    original: match,
                    replacement,
                });
            }

            return replacement;
        });
    }

    return result;
}

/**
 * Layer 3: Paraphrasing Patterns
 */
function applyParaphrasingPatterns(
    text: string,
    changes: ChangeRecord[]
): string {
    const paraphrasePatterns: Array<[RegExp, string[]]> = [
        [
            /In addition to/gi,
            ['Besides', 'Apart from', 'Along with', 'Beyond'],
        ],
        [
            /As a result of/gi,
            ['Because of', 'Due to', 'Owing to', 'Thanks to'],
        ],
        [
            /In terms of/gi,
            ['Regarding', 'Concerning', 'With respect to', 'As for'],
        ],
        [
            /A number of/gi,
            ['Several', 'Multiple', 'Various', 'Many'],
        ],
        [
            /In spite of/gi,
            ['Despite', 'Notwithstanding', 'Regardless of', 'Even with'],
        ],
        [
            /With regard to/gi,
            ['Regarding', 'Concerning', 'About', 'On the subject of'],
        ],
        [
            /For example/gi,
            ['For instance', 'Such as', 'Like', 'To illustrate'],
        ],
        [
            /In other words/gi,
            ['Put differently', 'That is to say', 'Meaning', 'Essentially'],
        ],
    ];

    let result = text;

    for (const [pattern, alternatives] of paraphrasePatterns) {
        result = result.replace(pattern, (match) => {
            if (Math.random() < 0.7) {
                const replacement = alternatives[Math.floor(Math.random() * alternatives.length)];
                changes.push({
                    type: 'restructure',
                    original: match,
                    replacement,
                });
                return preserveCase(match, replacement);
            }
            return match;
        });
    }

    return result;
}

/**
 * Layer 4: Information Reordering
 */
function reorderInformation(
    text: string,
    changes: ChangeRecord[]
): string {
    const paragraphs = text.split(/\n\s*\n/);

    // Don't reorder if too few paragraphs
    if (paragraphs.length < 4) return text;

    // Keep first and last paragraphs in place (intro and conclusion)
    const first = paragraphs[0];
    const last = paragraphs[paragraphs.length - 1];
    const middle = paragraphs.slice(1, -1);

    // Shuffle middle paragraphs slightly (swap adjacent pairs)
    for (let i = 0; i < middle.length - 1; i += 2) {
        if (Math.random() < 0.3) {
            [middle[i], middle[i + 1]] = [middle[i + 1], middle[i]];
            changes.push({
                type: 'reorder',
                original: `Paragraph ${i + 2}`,
                replacement: `Swapped with Paragraph ${i + 3}`,
            });
        }
    }

    return [first, ...middle, last].join('\n\n');
}

/**
 * Calculate estimated similarity reduction
 */
function calculateSimilarityReduction(
    changes: ChangeRecord[],
    intensity: 'light' | 'moderate' | 'strong'
): number {
    const baseReduction = intensity === 'light' ? 10 : intensity === 'moderate' ? 25 : 40;

    const synonymChanges = changes.filter(c => c.type === 'synonym').length;
    const restructureChanges = changes.filter(c => c.type === 'restructure').length;
    const reorderChanges = changes.filter(c => c.type === 'reorder').length;

    const changeBonus = Math.min(30,
        synonymChanges * 0.5 +
        restructureChanges * 2 +
        reorderChanges * 5
    );

    return Math.min(70, baseReduction + changeBonus);
}

/**
 * Preserve original case pattern
 */
function preserveCase(original: string, replacement: string): string {
    if (original === original.toUpperCase()) {
        return replacement.toUpperCase();
    }
    if (original[0] === original[0].toUpperCase()) {
        return replacement.charAt(0).toUpperCase() + replacement.slice(1);
    }
    return replacement.toLowerCase();
}

/**
 * Format text with proper citations
 */
export function formatWithCitations(
    text: string,
    citations: Array<{ text: string; source: string; author: string; year: number }>
): string {
    let result = text;

    for (const citation of citations) {
        // Find the text and wrap it with citation
        const escapedText = citation.text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(escapedText, 'gi');

        result = result.replace(regex, (match) => {
            return `"${match}" (${citation.author}, ${citation.year})`;
        });
    }

    return result;
}

/**
 * Check text similarity (simple Jaccard-based)
 */
export function checkSimilarity(text1: string, text2: string): number {
    const words1 = new Set(text1.toLowerCase().match(/\b\w+\b/g) || []);
    const words2 = new Set(text2.toLowerCase().match(/\b\w+\b/g) || []);

    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);

    return (intersection.size / union.size) * 100;
}

export { EXTENDED_SYNONYMS };
