/**
 * AI Humanizer Service
 * Reduces AI detection patterns in generated text by:
 * 1. Varying sentence structure and length
 * 2. Adding natural language patterns
 * 3. Introducing vocabulary diversity
 * 4. Reducing repetitive patterns
 */

import { geminiCompletion, GEMINI_MODELS } from './gemini-api';

export interface HumanizationResult {
    original: string;
    humanized: string;
    changes: HumanizationChange[];
    aiDetectionRisk: 'low' | 'medium' | 'high';
    humanScore: number; // 0-100, higher is more human-like
}

export interface HumanizationChange {
    type: 'sentence_variation' | 'vocabulary' | 'structure' | 'tone';
    description: string;
}

export type HumanizationLevel = 'light' | 'moderate' | 'strong';

/**
 * Humanize text to reduce AI detection
 */
export async function humanizeText(
    text: string,
    level: HumanizationLevel = 'moderate',
    onProgress?: (status: string) => void
): Promise<HumanizationResult> {
    onProgress?.('Analyzing text patterns...');

    const levelInstructions = {
        light: `Make minimal changes. Slightly vary sentence lengths and add minor natural variations. Keep the academic tone fully intact. Only change what's necessary to reduce obvious AI patterns.`,
        moderate: `Make balanced changes. Vary sentence structure more noticeably, substitute some vocabulary with natural alternatives, and add subtle personal touches while maintaining academic formality.`,
        strong: `Make significant changes. Substantially vary sentence structure, use more diverse vocabulary, add rhetorical questions or mild colloquialisms where appropriate, and make the text feel distinctly human-written while preserving meaning.`,
    };

    const prompt = `You are an expert at making academic text sound more natural and human-written, reducing patterns that AI detectors look for.

Rewrite the following text to sound more naturally human-written while:
1. Preserving all factual content and citations
2. Maintaining academic appropriateness
3. ${levelInstructions[level]}

Key techniques to apply:
- Vary sentence lengths (mix short and long)
- Use active voice more often
- Add occasional transitional phrases
- Reduce repetitive sentence starters
- Use more specific/concrete vocabulary
- Add subtle hedging language ("perhaps", "it appears", "one might argue")

Original text:
"""
${text}
"""

Provide ONLY the rewritten text, nothing else.`;

    onProgress?.('Humanizing content...');

    try {
        const result = await geminiCompletion(prompt, GEMINI_MODELS.FLASH);

        let humanized = result.trim();

        // Clean up any quotes or prefixes
        if (humanized.startsWith('"') && humanized.endsWith('"')) {
            humanized = humanized.slice(1, -1);
        }

        const changes = analyzeChanges(text, humanized);
        const scores = calculateHumanScore(humanized);

        return {
            original: text,
            humanized,
            changes,
            aiDetectionRisk: scores.risk,
            humanScore: scores.score,
        };
    } catch (error) {
        console.error('Humanization failed:', error);
        throw new Error('Failed to humanize text');
    }
}

/**
 * Analyze what changes were made
 */
function analyzeChanges(original: string, humanized: string): HumanizationChange[] {
    const changes: HumanizationChange[] = [];

    // Check sentence length variation
    const origSentences = original.match(/[^.!?]+[.!?]+/g) || [];
    const humSentences = humanized.match(/[^.!?]+[.!?]+/g) || [];

    const origLengths = origSentences.map(s => s.split(/\s+/).length);
    const humLengths = humSentences.map(s => s.split(/\s+/).length);

    const origVariance = calculateVariance(origLengths);
    const humVariance = calculateVariance(humLengths);

    if (humVariance > origVariance * 1.2) {
        changes.push({
            type: 'sentence_variation',
            description: 'Increased sentence length variety',
        });
    }

    // Check vocabulary changes
    const origWords = new Set(original.toLowerCase().split(/\s+/));
    const humWords = humanized.toLowerCase().split(/\s+/);
    const newWords = humWords.filter(w => !origWords.has(w));
    const newWordRatio = newWords.length / humWords.length;

    if (newWordRatio > 0.15) {
        changes.push({
            type: 'vocabulary',
            description: 'Diversified vocabulary',
        });
    }

    // Check for structure changes
    if (humSentences.length !== origSentences.length) {
        changes.push({
            type: 'structure',
            description: 'Restructured paragraphs and sentences',
        });
    }

    // Check for tone adjustments
    const hedgingWords = ['perhaps', 'possibly', 'might', 'appears', 'suggests', 'seemingly'];
    const hasHedging = hedgingWords.some(w => humanized.toLowerCase().includes(w));
    if (hasHedging) {
        changes.push({
            type: 'tone',
            description: 'Added natural hedging language',
        });
    }

    if (changes.length === 0) {
        changes.push({
            type: 'sentence_variation',
            description: 'Minor refinements applied',
        });
    }

    return changes;
}

/**
 * Calculate variance of an array of numbers
 */
function calculateVariance(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    const mean = numbers.reduce((a, b) => a + b, 0) / numbers.length;
    return numbers.reduce((sum, n) => sum + Math.pow(n - mean, 2), 0) / numbers.length;
}

/**
 * Calculate how human-like the text appears
 */
function calculateHumanScore(text: string): { score: number; risk: 'low' | 'medium' | 'high' } {
    let score = 50; // Start neutral

    const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
    const words = text.split(/\s+/);

    // Sentence length variation (higher variance = more human)
    const lengths = sentences.map(s => s.split(/\s+/).length);
    const variance = calculateVariance(lengths);
    if (variance > 30) score += 15;
    else if (variance > 15) score += 10;
    else if (variance < 5) score -= 10;

    // Short sentences mixed in (humans do this more)
    const shortSentences = lengths.filter(l => l < 8).length;
    if (shortSentences > 0 && shortSentences / sentences.length > 0.15) {
        score += 10;
    }

    // Hedging language
    const hedgingWords = ['perhaps', 'possibly', 'might', 'appears', 'suggests', 'seemingly', 'arguably'];
    const hasHedging = hedgingWords.some(w => text.toLowerCase().includes(w));
    if (hasHedging) score += 5;

    // First person (sparingly in academic writing)
    const firstPerson = (text.match(/\b(I|we|our|my)\b/gi) || []).length;
    if (firstPerson > 0 && firstPerson < words.length * 0.02) {
        score += 5;
    }

    // Transitional diversity
    const transitions = ['however', 'moreover', 'furthermore', 'nevertheless', 'consequently', 'therefore'];
    const usedTransitions = transitions.filter(t => text.toLowerCase().includes(t));
    if (usedTransitions.length >= 3) score += 5;

    // Avoid exact patterns that AI detectors look for
    const aiPatterns = [
        'In conclusion,',
        'It is important to note that',
        'This suggests that',
        'As we can see,',
    ];
    const patternMatches = aiPatterns.filter(p => text.includes(p)).length;
    score -= patternMatches * 5;

    // Clamp score
    score = Math.max(0, Math.min(100, score));

    // Determine risk level
    let risk: 'low' | 'medium' | 'high';
    if (score >= 70) risk = 'low';
    else if (score >= 40) risk = 'medium';
    else risk = 'high';

    return { score, risk };
}

/**
 * Quick analysis of AI detection risk without humanizing
 */
export function analyzeAIRisk(text: string): { score: number; risk: 'low' | 'medium' | 'high'; suggestions: string[] } {
    const { score, risk } = calculateHumanScore(text);

    const suggestions: string[] = [];

    const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
    const lengths = sentences.map(s => s.split(/\s+/).length);
    const variance = calculateVariance(lengths);

    if (variance < 15) {
        suggestions.push('Vary your sentence lengths more');
    }

    const shortSentences = lengths.filter(l => l < 8).length;
    if (shortSentences === 0) {
        suggestions.push('Add some shorter sentences for rhythm');
    }

    const aiPatterns = ['In conclusion,', 'It is important to note that'];
    if (aiPatterns.some(p => text.includes(p))) {
        suggestions.push('Replace common AI phrases with natural alternatives');
    }

    return { score, risk, suggestions };
}

/**
 * Stream humanization for real-time display
 */
export async function streamHumanize(
    text: string,
    onChunk: (chunk: string) => void,
    level: HumanizationLevel = 'moderate'
): Promise<void> {
    const levelDesc = {
        light: 'subtle variations',
        moderate: 'balanced natural variations',
        strong: 'significant humanization',
    };

    const prompt = `Rewrite this academic text to sound more naturally human-written with ${levelDesc[level]}. Preserve all facts and citations. Output only the rewritten text:

"${text}"`;

    // Use Gemini streaming
    const { streamGeminiCompletion } = await import('./gemini-api');
    await streamGeminiCompletion(prompt, { onToken: onChunk });
}

