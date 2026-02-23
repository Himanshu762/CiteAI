/**
 * Honest AI Detection Service
 * Uses Gemini to analyze text for AI-generated patterns
 * 
 * This service provides HONEST assessment of AI content.
 * AI-generated text IS detectable - we don't pretend otherwise.
 */

import { geminiCompletion, GEMINI_MODELS } from './gemini-api';

export interface AIDetectionResult {
    score: number; // 0-100 (100 = definitely AI-generated)
    risk: 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';
    confidence: number; // How confident the analysis is
    patterns: AIPattern[];
    suggestions: string[];
    disclaimer: string;
}

export interface AIPattern {
    type: string;
    description: string;
    severity: 'low' | 'medium' | 'high';
    examples?: string[];
}

/**
 * Analyze text for AI-generated content patterns
 * Uses Gemini to provide honest, accurate assessment
 */
export async function detectAIContent(text: string): Promise<AIDetectionResult> {
    if (!text || text.trim().length < 100) {
        return {
            score: 0,
            risk: 'LOW',
            confidence: 0,
            patterns: [],
            suggestions: ['Add more text for analysis (minimum 100 characters)'],
            disclaimer: 'Insufficient text for analysis',
        };
    }

    // Analyze using Gemini
    const prompt = `You are an expert AI content detector. Analyze this text and determine if it was likely written by AI (like ChatGPT, Claude, Gemini, etc.) or by a human.

TEXT TO ANALYZE:
"""
${text.slice(0, 3000)}
"""

Look for these AI indicators:
1. Uniform sentence structure and rhythm
2. Predictable paragraph organization (intro → body → conclusion in each section)
3. Overuse of transitional phrases ("Furthermore", "Moreover", "In conclusion")
4. Generic, non-specific examples
5. Lack of personal voice, anecdotes, or unique perspectives
6. Perfect grammar with no colloquialisms or personality
7. Hedging language that adds little ("It is important to note", "One might argue")
8. Lists and enumeration patterns
9. Repetitive topic sentence patterns
10. Absence of genuine insight or novel thinking

Respond with ONLY valid JSON:
{
    "aiScore": <number 0-100, where 100 = definitely AI>,
    "confidence": <number 0-100>,
    "patterns": [
        {"type": "pattern name", "description": "explanation", "severity": "low|medium|high"}
    ],
    "suggestions": ["how to make it more human-written"]
}`;

    try {
        const result = await geminiCompletion(prompt, GEMINI_MODELS.FLASH);
        const jsonMatch = result.match(/\{[\s\S]*\}/);

        if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            const score = Math.min(100, Math.max(0, parsed.aiScore || 75));

            return {
                score,
                risk: getRiskLevel(score),
                confidence: parsed.confidence || 70,
                patterns: (parsed.patterns || []).map((p: any) => ({
                    type: p.type || 'Unknown Pattern',
                    description: p.description || '',
                    severity: p.severity || 'medium',
                })),
                suggestions: parsed.suggestions || getDefaultSuggestions(score),
                disclaimer: getDisclaimer(score),
            };
        }
    } catch (error) {
        console.error('AI detection failed:', error);
    }

    // Fallback: Use heuristic analysis
    return heuristicAnalysis(text);
}

/**
 * Heuristic fallback analysis
 */
function heuristicAnalysis(text: string): AIDetectionResult {
    const patterns: AIPattern[] = [];
    let score = 50; // Start neutral

    // Check for common AI patterns
    const aiPhrases = [
        'It is important to note',
        'In conclusion',
        'Furthermore',
        'Moreover',
        'As we can see',
        'This suggests that',
        'It is worth mentioning',
        'One might argue',
        'It should be noted',
        'In summary',
    ];

    const foundPhrases = aiPhrases.filter(phrase =>
        text.toLowerCase().includes(phrase.toLowerCase())
    );

    if (foundPhrases.length >= 3) {
        score += 25;
        patterns.push({
            type: 'Common AI Phrases',
            description: `Found ${foundPhrases.length} phrases commonly used by AI`,
            severity: 'high',
            examples: foundPhrases.slice(0, 3),
        });
    } else if (foundPhrases.length >= 1) {
        score += 10;
        patterns.push({
            type: 'AI Transition Phrases',
            description: 'Some formulaic transitions detected',
            severity: 'medium',
        });
    }

    // Check sentence uniformity
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
    if (sentences.length > 3) {
        const lengths = sentences.map(s => s.split(/\s+/).length);
        const variance = calculateVariance(lengths);

        if (variance < 10) {
            score += 20;
            patterns.push({
                type: 'Uniform Sentence Length',
                description: 'Sentences are very similar in length (typical of AI)',
                severity: 'high',
            });
        }
    }

    // Check for perfect structure
    const paragraphs = text.split(/\n\n+/).filter(p => p.trim().length > 50);
    if (paragraphs.length > 2) {
        // AI often starts each paragraph with a topic sentence
        const topicSentencePatterns = paragraphs.filter(p =>
            /^(The|This|These|One|It|In|As|While)/i.test(p.trim())
        ).length;

        if (topicSentencePatterns / paragraphs.length > 0.8) {
            score += 15;
            patterns.push({
                type: 'Formulaic Structure',
                description: 'Paragraphs follow predictable topic-sentence patterns',
                severity: 'medium',
            });
        }
    }

    // Check for lack of personal voice
    const personalPronouns = (text.match(/\b(I|we|my|our|personally)\b/gi) || []).length;
    const wordCount = text.split(/\s+/).length;

    if (personalPronouns / wordCount < 0.005 && wordCount > 200) {
        score += 10;
        patterns.push({
            type: 'Impersonal Voice',
            description: 'Lacks personal pronouns and individual perspective',
            severity: 'medium',
        });
    }

    // AI text is often very grammatically correct with no contractions
    const contractions = (text.match(/\b(don't|won't|can't|isn't|aren't|doesn't|haven't|hasn't|wouldn't|couldn't|shouldn't)\b/gi) || []).length;
    if (contractions === 0 && wordCount > 300) {
        score += 5;
        patterns.push({
            type: 'No Contractions',
            description: 'Text avoids all contractions (natural writing typically includes some)',
            severity: 'low',
        });
    }

    score = Math.min(100, Math.max(0, score));

    return {
        score,
        risk: getRiskLevel(score),
        confidence: 60, // Lower confidence for heuristic
        patterns,
        suggestions: getDefaultSuggestions(score),
        disclaimer: getDisclaimer(score),
    };
}

function calculateVariance(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    const mean = numbers.reduce((a, b) => a + b, 0) / numbers.length;
    return numbers.reduce((sum, n) => sum + Math.pow(n - mean, 2), 0) / numbers.length;
}

function getRiskLevel(score: number): 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH' {
    if (score >= 80) return 'VERY_HIGH';
    if (score >= 60) return 'HIGH';
    if (score >= 40) return 'MEDIUM';
    return 'LOW';
}

function getDefaultSuggestions(score: number): string[] {
    if (score >= 70) {
        return [
            'Add personal experiences or anecdotes',
            'Use more specific, concrete examples',
            'Vary your sentence structure significantly',
            'Include your unique perspective or opinion',
            'Add some informal language or contractions',
            'Reduce transitional phrases like "Furthermore" and "Moreover"',
        ];
    } else if (score >= 40) {
        return [
            'Add more personal voice to the writing',
            'Include specific examples from your experience',
            'Vary paragraph openings more',
        ];
    }
    return ['Your writing appears relatively natural'];
}

function getDisclaimer(score: number): string {
    if (score >= 70) {
        return 'This text shows strong AI-generated patterns. External AI detectors will likely flag this as AI-written. Consider significant rewrites to add personal voice and unique insights.';
    } else if (score >= 40) {
        return 'This text shows some AI-like patterns. Some AI detectors may flag portions of this text.';
    }
    return 'This text appears relatively natural, though no analysis is 100% accurate.';
}

/**
 * Quick check for display purposes
 */
export function quickAICheck(text: string): { risk: string; color: string } {
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
    const aiPhrases = ['Furthermore', 'Moreover', 'In conclusion', 'It is important'];
    const foundPhrases = aiPhrases.filter(p => text.includes(p)).length;

    // Simple quick check
    let score = 40;
    if (foundPhrases >= 2) score += 30;
    if (sentences.length > 5) {
        const lengths = sentences.map(s => s.split(/\s+/).length);
        const variance = calculateVariance(lengths);
        if (variance < 15) score += 20;
    }

    if (score >= 70) return { risk: 'HIGH', color: '#ef4444' };
    if (score >= 50) return { risk: 'MEDIUM', color: '#f59e0b' };
    return { risk: 'LOW', color: '#10b981' };
}
