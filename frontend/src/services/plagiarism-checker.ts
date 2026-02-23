/**
 * Plagiarism Checker Service
 * Uses AI-powered analysis for unlimited originality detection
 * Plus auto-paraphrasing to fix detected issues
 */

import {
    analyzeOriginality,
    paraphraseText,
    autoFixPlagiarism,
    OriginalityResult
} from './ai-plagiarism';

export interface PlagiarismResult {
    score: number; // 0-100, percentage of plagiarized content (inverse of originality)
    originalityScore: number; // 0-100, percentage original
    passages: PlagiarismPassage[];
    totalWords: number;
    matchedWords: number;
    sources: PlagiarismSource[];
    suggestions: string[];
    canAutoFix: boolean;
}

export interface PlagiarismPassage {
    text: string;
    startIndex: number;
    endIndex: number;
    matchPercentage: number;
    originalityScore: number;
    issues: string[];
    source?: PlagiarismSource;
}

export interface PlagiarismSource {
    url: string;
    title: string;
    matchPercentage: number;
}

/**
 * Check for plagiarism in text content
 * Uses AI to analyze originality - unlimited usage
 */
export async function checkPlagiarism(
    text: string,
    onProgress?: (status: string) => void
): Promise<PlagiarismResult> {
    const words = text.split(/\s+/).filter(Boolean);
    const totalWords = words.length;

    if (totalWords < 50) {
        return createEmptyResult(totalWords, 'Add more content for analysis');
    }

    try {
        const analysis = await analyzeOriginality(text, onProgress);
        return transformAnalysisResult(analysis, totalWords);
    } catch (error) {
        console.error('AI analysis failed:', error);
        onProgress?.('Using local analysis...');
        return await localPlagiarismAnalysis(text, totalWords);
    }
}

/**
 * Transform AI analysis to plagiarism result format
 */
function transformAnalysisResult(
    analysis: OriginalityResult,
    totalWords: number
): PlagiarismResult {
    const plagiarismScore = 100 - analysis.overallScore;
    const matchedWords = Math.round((plagiarismScore / 100) * totalWords);

    const passages: PlagiarismPassage[] = analysis.passages
        .filter(p => p.originalityScore < 80)
        .map(p => ({
            text: p.text,
            startIndex: p.startIndex,
            endIndex: p.endIndex,
            matchPercentage: 100 - p.originalityScore,
            originalityScore: p.originalityScore,
            issues: p.issues,
        }));

    const canAutoFix = passages.length > 0;

    return {
        score: Math.round(plagiarismScore * 10) / 10,
        originalityScore: analysis.overallScore,
        passages,
        totalWords,
        matchedWords,
        sources: [],
        suggestions: analysis.suggestions,
        canAutoFix,
    };
}

/**
 * Create empty result for insufficient content
 */
function createEmptyResult(totalWords: number, message: string): PlagiarismResult {
    return {
        score: 0,
        originalityScore: 100,
        passages: [],
        totalWords,
        matchedWords: 0,
        sources: [],
        suggestions: [message],
        canAutoFix: false,
    };
}

/**
 * Local plagiarism analysis using text fingerprinting (fallback)
 */
async function localPlagiarismAnalysis(
    text: string,
    totalWords: number
): Promise<PlagiarismResult> {
    await new Promise(resolve => setTimeout(resolve, 500));

    // Calculate text uniqueness metrics
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
    const uniqueSentences = new Set(sentences.map(s => s.toLowerCase().trim()));

    // Check for repetitive patterns
    const ngrams = generateNgrams(text, 5);
    const uniqueNgrams = new Set(ngrams);
    const repetitionRate = ngrams.length > 0
        ? 1 - (uniqueNgrams.size / ngrams.length)
        : 0;

    const sentenceUniqueness = sentences.length > 0
        ? uniqueSentences.size / sentences.length
        : 1;

    const originalityScore = Math.round(
        (sentenceUniqueness * 50 + (1 - repetitionRate) * 50)
    );

    const plagiarismScore = 100 - originalityScore;
    const matchedWords = Math.round((plagiarismScore / 100) * totalWords);

    return {
        score: Math.round(plagiarismScore * 10) / 10,
        originalityScore,
        passages: [],
        totalWords,
        matchedWords,
        sources: [],
        suggestions: ['Enable AI analysis for detailed results'],
        canAutoFix: false,
    };
}

/**
 * Generate n-grams from text
 */
function generateNgrams(text: string, n: number): string[] {
    const words = text.toLowerCase().split(/\s+/).filter(Boolean);
    const ngrams: string[] = [];

    for (let i = 0; i <= words.length - n; i++) {
        ngrams.push(words.slice(i, i + n).join(' '));
    }

    return ngrams;
}

/**
 * Auto-fix plagiarism by paraphrasing flagged passages
 */
export async function fixPlagiarism(
    text: string,
    onProgress?: (status: string, progress: number) => void
): Promise<{
    fixedText: string;
    originalScore: number;
    newScore: number;
    passagesFixed: number;
}> {
    return autoFixPlagiarism(text, onProgress);
}

/**
 * Paraphrase a specific passage
 */
export async function paraphrasePassage(
    text: string,
    style: 'academic' | 'formal' | 'simple' = 'academic'
): Promise<string> {
    const result = await paraphraseText(text, style);
    return result.paraphrased;
}

/**
 * Calculate readability score using Flesch-Kincaid Reading Ease
 */
export function calculateReadabilityScore(text: string): number {
    if (!text || text.length < 100) return 0;

    const sentences = (text.match(/[.!?]+/g) || []).length || 1;
    const words = text.split(/\s+/).filter(Boolean).length;
    const syllables = countSyllables(text);

    const readingEase = 206.835 - (1.015 * (words / sentences)) - (84.6 * (syllables / words));
    return Math.max(0, Math.min(100, Math.round(readingEase)));
}

/**
 * Calculate Flesch-Kincaid Grade Level
 */
export function calculateGradeLevel(text: string): number {
    if (!text || text.length < 100) return 0;

    const sentences = (text.match(/[.!?]+/g) || []).length || 1;
    const words = text.split(/\s+/).filter(Boolean).length;
    const syllables = countSyllables(text);

    const gradeLevel = (0.39 * (words / sentences)) + (11.8 * (syllables / words)) - 15.59;
    return Math.max(0, Math.min(20, Math.round(gradeLevel * 10) / 10));
}

function countSyllables(text: string): number {
    const words = text.toLowerCase().split(/\s+/);
    return words.reduce((acc, word) => acc + countWordSyllables(word), 0);
}

function countWordSyllables(word: string): number {
    word = word.toLowerCase().replace(/[^a-z]/g, '');
    if (word.length <= 3) return 1;
    word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
    word = word.replace(/^y/, '');
    const matches = word.match(/[aeiouy]{1,2}/g);
    return matches ? matches.length : 1;
}

/**
 * Quality analysis combining plagiarism and readability
 */
export interface QualityAnalysis {
    plagiarismScore: number;
    originalityScore: number;
    readabilityScore: number;
    gradeLevel: number;
    wordCount: number;
    sentenceCount: number;
    avgWordsPerSentence: number;
    avgSyllablesPerWord: number;
    recommendations: string[];
    canAutoFix: boolean;
}

export async function analyzeQuality(
    text: string,
    onProgress?: (status: string) => void
): Promise<QualityAnalysis> {
    const plagiarism = await checkPlagiarism(text, onProgress);
    const readability = calculateReadabilityScore(text);
    const gradeLevel = calculateGradeLevel(text);

    const sentences = (text.match(/[.!?]+/g) || []).length || 1;
    const words = text.split(/\s+/).filter(Boolean).length;
    const syllables = countSyllables(text);

    const recommendations = [...plagiarism.suggestions];

    if (readability < 30) {
        recommendations.push('Simplify sentences for better readability');
    }
    if (words / sentences > 25) {
        recommendations.push('Break up long sentences');
    }
    if (gradeLevel > 16) {
        recommendations.push('Content may be too complex');
    }

    return {
        plagiarismScore: plagiarism.score,
        originalityScore: plagiarism.originalityScore,
        readabilityScore: readability,
        gradeLevel,
        wordCount: words,
        sentenceCount: sentences,
        avgWordsPerSentence: Math.round((words / sentences) * 10) / 10,
        avgSyllablesPerWord: Math.round((syllables / words) * 10) / 10,
        recommendations: recommendations.slice(0, 5),
        canAutoFix: plagiarism.canAutoFix,
    };
}
