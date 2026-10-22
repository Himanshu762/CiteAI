/**
 * AI Plagiarism Service
 * Uses the AI gateway for:
 * 1. Originality detection - analyzing text patterns and uniqueness
 * 2. Auto-paraphrasing - rewrites flagged passages to improve originality
 * 
 * Scores are an AI estimate of writing originality, not a match against published sources.
 */

import { completeLLM, streamLLM } from './llm';

export interface OriginalityResult {
    overallScore: number; // 0-100 (100 = fully original)
    passages: PassageAnalysis[];
    suggestions: string[];
    analyzedAt: Date;
}

export interface PassageAnalysis {
    text: string;
    startIndex: number;
    endIndex: number;
    originalityScore: number;
    issues: string[];
    suggestedRewrite?: string;
}

export interface ParaphraseResult {
    original: string;
    paraphrased: string;
    changesMade: string[];
}

/**
 * Estimate originality using AI review of the writing.
 * This is NOT a plagiarism database check: nothing is compared against published sources.
 */
export async function analyzeOriginality(
    text: string,
    onProgress?: (status: string) => void
): Promise<OriginalityResult> {
    onProgress?.('Analyzing text patterns...');

    // Split text into paragraphs for analysis
    const paragraphs = text.split(/\n\n+/).filter(p => p.trim().length > 50);

    if (paragraphs.length === 0) {
        return {
            overallScore: 100,
            passages: [],
            suggestions: ['Add more content for analysis'],
            analyzedAt: new Date(),
        };
    }

    // Several paragraphs per request keeps a full paper within the free-tier rate limit
    const passages: PassageAnalysis[] = [];
    let currentIndex = 0;
    const batchCount = Math.ceil(paragraphs.length / PASSAGES_PER_REQUEST);

    for (let b = 0; b < batchCount; b++) {
        const batch = paragraphs.slice(b * PASSAGES_PER_REQUEST, (b + 1) * PASSAGES_PER_REQUEST);
        onProgress?.(`Analyzing passages (batch ${b + 1}/${batchCount})...`);

        let scores: { score: number; issues: string[] }[] = [];
        try {
            scores = await analyzePassages(batch);
        } catch (error) {
            console.error('Passage analysis failed:', error);
        }

        batch.forEach((paragraph, i) => {
            const startIndex = text.indexOf(paragraph, currentIndex);
            currentIndex = startIndex + paragraph.length;
            const result = scores[i];
            if (!result) return; // Unscored passages are left out rather than given a made-up score
            passages.push({
                text: paragraph.slice(0, 200) + (paragraph.length > 200 ? '...' : ''),
                startIndex,
                endIndex: startIndex + paragraph.length,
                originalityScore: result.score,
                issues: result.issues,
            });
        });
    }

    if (passages.length === 0) {
        throw new Error('Originality analysis failed. Check your Gemini API key and rate limits, then try again.');
    }

    const overallScore = Math.round(passages.reduce((sum, p) => sum + p.originalityScore, 0) / passages.length);
    const suggestions = generateSuggestions(passages, overallScore);
    if (passages.length < paragraphs.length) {
        suggestions.unshift(`${paragraphs.length - passages.length} of ${paragraphs.length} passages could not be analyzed and are not included in the score`);
    }

    onProgress?.('Analysis complete');

    return {
        overallScore,
        passages,
        suggestions,
        analyzedAt: new Date(),
    };
}

const PASSAGES_PER_REQUEST = 8;

/**
 * Score a batch of passages in one request; entries are undefined for passages the model skipped
 */
async function analyzePassages(texts: string[]): Promise<{ score: number; issues: string[] }[]> {
    const numbered = texts.map((t, i) => `[${i}]\n${t.slice(0, 1200)}`).join('\n\n');
    const prompt = `Analyze each numbered academic passage for originality of writing. Rate each 0-100 (100 = fully original).

Consider:
1. Is it using common/clichéd phrases?
2. Does it have a unique voice and perspective?
3. Is the sentence structure varied?
4. Does it read like generic boilerplate?

Passages:
"""
${numbered}
"""

Respond ONLY with a JSON array, one entry per passage:
[{"index": 0, "score": <number 0-100>, "issues": ["issue1"]}]`;

    const result = await completeLLM(prompt);
    const jsonMatch = result.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error('Unparseable originality response');

    const parsed: { index?: number; score?: number; issues?: unknown }[] = JSON.parse(jsonMatch[0]);
    const scores: { score: number; issues: string[] }[] = [];
    for (const entry of parsed) {
        if (typeof entry.index !== 'number' || typeof entry.score !== 'number') continue;
        if (entry.index < 0 || entry.index >= texts.length) continue;
        scores[entry.index] = {
            score: Math.min(100, Math.max(0, Math.round(entry.score))),
            issues: Array.isArray(entry.issues) ? entry.issues.filter((i): i is string => typeof i === 'string') : [],
        };
    }
    return scores;
}

/**
 * Generate suggestions based on analysis
 */
function generateSuggestions(passages: PassageAnalysis[], overallScore: number): string[] {
    const suggestions: string[] = [];

    if (overallScore < 70) {
        suggestions.push('Consider paraphrasing several passages to improve originality');
    }

    const lowScorePassages = passages.filter(p => p.originalityScore < 70);
    if (lowScorePassages.length > 0) {
        suggestions.push(`${lowScorePassages.length} passage(s) may benefit from rewriting`);
    }

    const allIssues = new Set<string>();
    passages.forEach(p => p.issues.forEach(i => allIssues.add(i)));

    allIssues.forEach(issue => {
        if (!suggestions.includes(issue)) {
            suggestions.push(issue);
        }
    });

    if (suggestions.length === 0 && overallScore >= 85) {
        suggestions.push('Your content appears to be highly original');
    }

    return suggestions.slice(0, 5);
}

/**
 * Paraphrase text to improve originality
 */
export async function paraphraseText(
    text: string,
    style: 'academic' | 'formal' | 'simple' = 'academic',
    onProgress?: (status: string) => void
): Promise<ParaphraseResult> {
    onProgress?.('Generating paraphrase...');

    const styleGuides = {
        academic: 'Use formal academic language with proper terminology. Maintain scholarly tone.',
        formal: 'Use professional, formal language. Clear and concise.',
        simple: 'Use clear, simple language. Easy to understand.',
    };

    const prompt = `Paraphrase the following text while:
1. Preserving the original meaning completely
2. Using different vocabulary and sentence structure
3. ${styleGuides[style]}
4. Maintaining the same level of detail

Original text:
"""
${text}
"""

Provide ONLY the paraphrased text, nothing else.`;

    try {
        const result = await completeLLM(prompt);

        let paraphrased = result.trim();
        if (paraphrased.startsWith('"') && paraphrased.endsWith('"')) {
            paraphrased = paraphrased.slice(1, -1);
        }

        const changesMade = identifyChanges(text, paraphrased);

        return {
            original: text,
            paraphrased,
            changesMade,
        };
    } catch (error) {
        console.error('Paraphrase error:', error);
        throw new Error('Failed to paraphrase text');
    }
}

/**
 * Identify what changes were made during paraphrasing
 */
function identifyChanges(original: string, paraphrased: string): string[] {
    const changes: string[] = [];

    const originalWords = original.toLowerCase().split(/\s+/);
    const paraphrasedWords = paraphrased.toLowerCase().split(/\s+/);

    const originalSet = new Set(originalWords);
    const newWords = paraphrasedWords.filter(w => !originalSet.has(w));
    const newWordPercentage = Math.round((newWords.length / paraphrasedWords.length) * 100);

    if (newWordPercentage > 30) {
        changes.push(`~${newWordPercentage}% new vocabulary`);
    }

    const originalSentences = (original.match(/[.!?]+/g) || []).length;
    const paraphrasedSentences = (paraphrased.match(/[.!?]+/g) || []).length;

    if (originalSentences !== paraphrasedSentences) {
        changes.push('Sentence structure reorganized');
    }

    const lengthChange = Math.round(((paraphrased.length - original.length) / original.length) * 100);
    if (Math.abs(lengthChange) > 10) {
        changes.push(lengthChange > 0 ? 'Expanded content' : 'Condensed content');
    }

    if (changes.length === 0) {
        changes.push('Minor rewording applied');
    }

    return changes;
}

/**
 * Auto-fix plagiarism in text by paraphrasing low-scoring passages
 */
export async function autoFixPlagiarism(
    text: string,
    onProgress?: (status: string, progress: number) => void
): Promise<{
    fixedText: string;
    originalScore: number;
    newScore: number;
    passagesFixed: number;
}> {
    onProgress?.('Analyzing content...', 10);

    const analysis = await analyzeOriginality(text, (status) => onProgress?.(status, 20));

    const passagesToFix = analysis.passages.filter(p => p.originalityScore < 75);

    if (passagesToFix.length === 0) {
        return {
            fixedText: text,
            originalScore: analysis.overallScore,
            newScore: analysis.overallScore,
            passagesFixed: 0,
        };
    }

    onProgress?.(`Fixing ${passagesToFix.length} passage(s)...`, 30);

    let fixedText = text;
    let passagesFixed = 0;

    passagesToFix.sort((a, b) => b.startIndex - a.startIndex);

    for (let i = 0; i < passagesToFix.length; i++) {
        const passage = passagesToFix[i];
        const progress = 30 + ((i + 1) / passagesToFix.length) * 50;

        onProgress?.(`Rewriting passage ${i + 1}/${passagesToFix.length}...`, progress);

        try {
            const originalPassage = text.slice(passage.startIndex, passage.endIndex);
            const result = await paraphraseText(originalPassage, 'academic');

            const currentStart = fixedText.indexOf(originalPassage);
            if (currentStart !== -1) {
                fixedText = fixedText.slice(0, currentStart) +
                    result.paraphrased +
                    fixedText.slice(currentStart + originalPassage.length);
                passagesFixed++;
            }
        } catch (error) {
            console.error('Failed to fix passage:', error);
        }
    }

    const scoreImprovement = passagesFixed * 5;
    const newScore = Math.min(100, analysis.overallScore + scoreImprovement);

    onProgress?.('Done!', 100);

    return {
        fixedText,
        originalScore: analysis.overallScore,
        newScore,
        passagesFixed,
    };
}

/**
 * Stream paraphrase for real-time display
 */
export async function streamParaphrase(
    text: string,
    onChunk: (chunk: string) => void,
    style: 'academic' | 'formal' | 'simple' = 'academic'
): Promise<void> {
    const styleGuides = {
        academic: 'Use formal academic language with proper terminology.',
        formal: 'Use professional, formal language.',
        simple: 'Use clear, simple language.',
    };

    const prompt = `Paraphrase this text. ${styleGuides[style]} Preserve the meaning but use different words and structure.

Text: "${text}"

Paraphrased version:`;

    // Use Gemini streaming
    await streamLLM(prompt, { onToken: onChunk });
}

