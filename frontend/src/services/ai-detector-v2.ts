/**
 * AI Detector v2 - Custom Algorithmic Detection Engine
 * 
 * 10-metric detection system:
 * 1. Perplexity (15%) - Text predictability
 * 2. Burstiness (15%) - Complexity variance
 * 3. Shannon Entropy (10%) - Information density
 * 4. Type-Token Ratio (10%) - Vocabulary diversity
 * 5. Hapax Legomena (8%) - Words used once
 * 6. Lexical Sophistication (7%) - Rare word usage
 * 7. N-gram Patterns (15%) - AI phrase detection
 * 8. Structural Analysis (10%) - Uniformity
 * 9. Discourse Coherence (5%) - Logical flow
 * 10. Stylometric Fingerprint (5%) - Writing style
 */

// Detection result interface
export interface AIDetectionResult {
    overallScore: number;        // 0-100, higher = more AI-like
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';
    confidence: number;          // 0-100
    metrics: MetricResult[];
    patterns: PatternMatch[];
    suggestions: string[];
}

export interface MetricResult {
    name: string;
    score: number;              // 0-100, higher = more AI-like
    weight: number;
    description: string;
}

export interface PatternMatch {
    pattern: string;
    count: number;
    severity: 'low' | 'medium' | 'high';
    suggestion: string;
}

// Metric weights
const METRIC_WEIGHTS = {
    perplexity: 0.15,
    burstiness: 0.15,
    entropy: 0.10,
    typeTokenRatio: 0.10,
    hapaxLegomena: 0.08,
    lexicalSophistication: 0.07,
    ngramPatterns: 0.15,
    structuralAnalysis: 0.10,
    discourseCoherence: 0.05,
    stylometricFingerprint: 0.05,
};

// AI pattern database
const AI_PATTERNS = {
    highConfidence: [
        "In today's rapidly evolving",
        "It is important to note that",
        "plays a crucial role",
        "This essay will explore",
        "In the realm of",
        "It is essential to understand",
        "serves as a testament",
        "has become increasingly important",
        "In the modern era",
        "It is worth mentioning",
    ],
    transitions: [
        "Furthermore,",
        "Moreover,",
        "Additionally,",
        "However,",
        "Nevertheless,",
        "Consequently,",
        "Therefore,",
        "In contrast,",
        "On the other hand,",
        "As a result,",
    ],
    fillers: [
        "In order to",
        "Due to the fact that",
        "It should be noted that",
        "It is widely believed that",
        "There is no doubt that",
        "It goes without saying",
        "For the purpose of",
        "In terms of",
        "With regard to",
        "In light of",
    ],
    closings: [
        "In conclusion,",
        "To summarize,",
        "All in all,",
        "In summary,",
        "To conclude,",
        "Taking everything into account,",
        "Overall,",
        "Ultimately,",
    ],
    hedging: [
        "It can be argued that",
        "One might suggest that",
        "It appears that",
        "It seems that",
        "This suggests that",
        "This indicates that",
        "arguably",
        "potentially",
    ],
};

// Common English words (top 1000 for sophistication check)
const COMMON_WORDS = new Set([
    'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i',
    'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at',
    'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she',
    'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their', 'what',
    'so', 'up', 'out', 'if', 'about', 'who', 'get', 'which', 'go', 'me',
    'when', 'make', 'can', 'like', 'time', 'no', 'just', 'him', 'know', 'take',
    'people', 'into', 'year', 'your', 'good', 'some', 'could', 'them', 'see', 'other',
    'than', 'then', 'now', 'look', 'only', 'come', 'its', 'over', 'think', 'also',
    'back', 'after', 'use', 'two', 'how', 'our', 'work', 'first', 'well', 'way',
    'even', 'new', 'want', 'because', 'any', 'these', 'give', 'day', 'most', 'us',
    // ... (abbreviated for space)
]);

/**
 * Main detection function
 */
export function detectAIContent(text: string): AIDetectionResult {
    if (!text || text.trim().length < 50) {
        return {
            overallScore: 0,
            riskLevel: 'LOW',
            confidence: 0,
            metrics: [],
            patterns: [],
            suggestions: ['Text too short for analysis'],
        };
    }

    const cleanText = text.trim();

    // Calculate all metrics
    const metrics: MetricResult[] = [
        {
            name: 'Perplexity',
            score: calculatePerplexity(cleanText),
            weight: METRIC_WEIGHTS.perplexity,
            description: 'Text predictability - AI text is more predictable',
        },
        {
            name: 'Burstiness',
            score: calculateBurstiness(cleanText),
            weight: METRIC_WEIGHTS.burstiness,
            description: 'Complexity variance - AI has uniform complexity',
        },
        {
            name: 'Entropy',
            score: calculateEntropy(cleanText),
            weight: METRIC_WEIGHTS.entropy,
            description: 'Information density per character',
        },
        {
            name: 'Type-Token Ratio',
            score: calculateTTR(cleanText),
            weight: METRIC_WEIGHTS.typeTokenRatio,
            description: 'Vocabulary diversity',
        },
        {
            name: 'Hapax Legomena',
            score: calculateHapaxRatio(cleanText),
            weight: METRIC_WEIGHTS.hapaxLegomena,
            description: 'Words used exactly once',
        },
        {
            name: 'Lexical Sophistication',
            score: calculateLexicalSophistication(cleanText),
            weight: METRIC_WEIGHTS.lexicalSophistication,
            description: 'Rare word usage',
        },
        {
            name: 'N-gram Patterns',
            score: calculatePatternScore(cleanText),
            weight: METRIC_WEIGHTS.ngramPatterns,
            description: 'AI-specific phrase detection',
        },
        {
            name: 'Structural Analysis',
            score: calculateStructuralScore(cleanText),
            weight: METRIC_WEIGHTS.structuralAnalysis,
            description: 'Paragraph and sentence uniformity',
        },
        {
            name: 'Discourse Coherence',
            score: calculateDiscourseScore(cleanText),
            weight: METRIC_WEIGHTS.discourseCoherence,
            description: 'Logical flow patterns',
        },
        {
            name: 'Stylometric Fingerprint',
            score: calculateStylometricScore(cleanText),
            weight: METRIC_WEIGHTS.stylometricFingerprint,
            description: 'Writing style consistency',
        },
    ];

    // Calculate weighted overall score
    const overallScore = Math.round(
        metrics.reduce((sum, m) => sum + (m.score * m.weight), 0) /
        metrics.reduce((sum, m) => sum + m.weight, 0)
    );

    // Detect specific patterns
    const patterns = detectPatterns(cleanText);

    // Determine risk level
    const riskLevel = getRiskLevel(overallScore);

    // Calculate confidence based on text length and metric agreement
    const confidence = calculateConfidence(cleanText, metrics);

    // Generate suggestions
    const suggestions = generateSuggestions(metrics, patterns);

    return {
        overallScore,
        riskLevel,
        confidence,
        metrics,
        patterns,
        suggestions,
    };
}

/**
 * 1. Perplexity - Approximated using bigram surprisal
 */
function calculatePerplexity(text: string): number {
    const words = tokenize(text);
    if (words.length < 10) return 50;

    // Build bigram frequency map
    const bigrams: Map<string, number> = new Map();
    const unigramCounts: Map<string, number> = new Map();

    for (let i = 0; i < words.length; i++) {
        const word = words[i].toLowerCase();
        unigramCounts.set(word, (unigramCounts.get(word) || 0) + 1);

        if (i > 0) {
            const bigram = `${words[i - 1].toLowerCase()}_${word}`;
            bigrams.set(bigram, (bigrams.get(bigram) || 0) + 1);
        }
    }

    // Calculate average surprisal
    let totalSurprisal = 0;
    let count = 0;

    for (let i = 1; i < words.length; i++) {
        const prevWord = words[i - 1].toLowerCase();
        const currWord = words[i].toLowerCase();
        const bigram = `${prevWord}_${currWord}`;

        const bigramCount = bigrams.get(bigram) || 1;
        const prevCount = unigramCounts.get(prevWord) || 1;

        // Surprisal = -log(P(word|prev))
        const probability = bigramCount / prevCount;
        totalSurprisal += -Math.log2(probability + 0.0001);
        count++;
    }

    const avgSurprisal = totalSurprisal / (count || 1);

    // Convert to 0-100 score (lower surprisal = more predictable = more AI-like)
    // Typical range: 2-10 bits
    const normalized = Math.min(100, Math.max(0, (10 - avgSurprisal) * 15));
    return Math.round(normalized);
}

/**
 * 2. Burstiness - Variance in sentence complexity
 */
function calculateBurstiness(text: string): number {
    const sentences = splitSentences(text);
    if (sentences.length < 3) return 50;

    // Calculate complexity for each sentence
    const complexities = sentences.map(s => {
        const words = tokenize(s);
        const avgWordLength = words.reduce((sum, w) => sum + w.length, 0) / (words.length || 1);
        const clauseCount = (s.match(/[,;:]/g) || []).length + 1;
        return avgWordLength * clauseCount * words.length * 0.1;
    });

    // Calculate variance
    const mean = complexities.reduce((a, b) => a + b, 0) / complexities.length;
    const variance = complexities.reduce((sum, c) => sum + Math.pow(c - mean, 2), 0) / complexities.length;
    const stdDev = Math.sqrt(variance);
    const coefficientOfVariation = (stdDev / (mean || 1)) * 100;

    // High variance = human (0), Low variance = AI (100)
    // Typical CV: 20-80%
    const aiScore = Math.max(0, Math.min(100, 100 - coefficientOfVariation));
    return Math.round(aiScore);
}

/**
 * 3. Shannon Entropy - Information density
 */
function calculateEntropy(text: string): number {
    const charFreq: Map<string, number> = new Map();
    const cleanText = text.toLowerCase().replace(/[^a-z\s]/g, '');

    for (const char of cleanText) {
        charFreq.set(char, (charFreq.get(char) || 0) + 1);
    }

    let entropy = 0;
    for (const count of charFreq.values()) {
        const probability = count / cleanText.length;
        entropy -= probability * Math.log2(probability);
    }

    // Typical entropy for English: 3.5-4.5 bits
    // Higher entropy = more diverse = more human
    // Lower entropy = more uniform = more AI
    const aiScore = Math.max(0, Math.min(100, (4.5 - entropy) * 40));
    return Math.round(aiScore);
}

/**
 * 4. Type-Token Ratio - Vocabulary diversity
 */
function calculateTTR(text: string): number {
    const words = tokenize(text).map(w => w.toLowerCase());
    if (words.length < 10) return 50;

    const uniqueWords = new Set(words);
    const ttr = uniqueWords.size / words.length;

    // TTR typically 0.4-0.8 for academic text
    // Lower TTR = repetitive = more AI-like
    const aiScore = Math.max(0, Math.min(100, (0.7 - ttr) * 200));
    return Math.round(aiScore);
}

/**
 * 5. Hapax Legomena - Words used exactly once
 */
function calculateHapaxRatio(text: string): number {
    const words = tokenize(text).map(w => w.toLowerCase());
    if (words.length < 20) return 50;

    const wordCounts: Map<string, number> = new Map();
    for (const word of words) {
        wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
    }

    const hapaxCount = Array.from(wordCounts.values()).filter(c => c === 1).length;
    const hapaxRatio = hapaxCount / words.length;

    // Typical hapax ratio: 0.3-0.6
    // Lower ratio = more repetition = more AI-like
    const aiScore = Math.max(0, Math.min(100, (0.5 - hapaxRatio) * 200));
    return Math.round(aiScore);
}

/**
 * 6. Lexical Sophistication - Rare word usage
 */
function calculateLexicalSophistication(text: string): number {
    const words = tokenize(text).map(w => w.toLowerCase());
    if (words.length < 20) return 50;

    const rareWords = words.filter(w => !COMMON_WORDS.has(w) && w.length > 3);
    const rareRatio = rareWords.length / words.length;

    // Typical rare word ratio: 0.2-0.5
    // Lower ratio = more common words = more AI-like
    const aiScore = Math.max(0, Math.min(100, (0.35 - rareRatio) * 200));
    return Math.round(aiScore);
}

/**
 * 7. N-gram Pattern Detection
 */
function calculatePatternScore(text: string): number {
    const lowerText = text.toLowerCase();
    let totalMatches = 0;
    let weightedScore = 0;

    // High confidence patterns (weight: 3)
    for (const pattern of AI_PATTERNS.highConfidence) {
        const count = countOccurrences(lowerText, pattern.toLowerCase());
        totalMatches += count;
        weightedScore += count * 3;
    }

    // Transition patterns (weight: 2)
    for (const pattern of AI_PATTERNS.transitions) {
        const count = countOccurrences(lowerText, pattern.toLowerCase());
        totalMatches += count;
        weightedScore += count * 2;
    }

    // Filler patterns (weight: 2)
    for (const pattern of AI_PATTERNS.fillers) {
        const count = countOccurrences(lowerText, pattern.toLowerCase());
        totalMatches += count;
        weightedScore += count * 2;
    }

    // Closing patterns (weight: 2)
    for (const pattern of AI_PATTERNS.closings) {
        const count = countOccurrences(lowerText, pattern.toLowerCase());
        totalMatches += count;
        weightedScore += count * 2;
    }

    // Hedging patterns (weight: 1)
    for (const pattern of AI_PATTERNS.hedging) {
        const count = countOccurrences(lowerText, pattern.toLowerCase());
        totalMatches += count;
        weightedScore += count * 1;
    }

    // Normalize to word count
    const words = tokenize(text);
    const normalizedScore = (weightedScore / (words.length || 1)) * 500;

    return Math.min(100, Math.round(normalizedScore));
}

/**
 * 8. Structural Analysis - Uniformity in paragraphs/sentences
 */
function calculateStructuralScore(text: string): number {
    const sentences = splitSentences(text);
    if (sentences.length < 5) return 50;

    // Analyze sentence length uniformity
    const lengths = sentences.map(s => tokenize(s).length);
    const avgLength = lengths.reduce((a, b) => a + b, 0) / lengths.length;
    const variance = lengths.reduce((sum, l) => sum + Math.pow(l - avgLength, 2), 0) / lengths.length;
    const cv = Math.sqrt(variance) / (avgLength || 1);

    // Analyze sentence starter diversity
    const starters = sentences.map(s => {
        const words = tokenize(s);
        return words.slice(0, 2).join(' ').toLowerCase();
    });
    const uniqueStarters = new Set(starters);
    const starterDiversity = uniqueStarters.size / sentences.length;

    // Low CV + low starter diversity = AI-like
    const uniformityScore = Math.max(0, 50 - cv * 100);
    const starterScore = Math.max(0, (1 - starterDiversity) * 50);

    return Math.round((uniformityScore + starterScore) / 2);
}

/**
 * 9. Discourse Coherence - Logical flow patterns
 */
function calculateDiscourseScore(text: string): number {
    const sentences = splitSentences(text);
    if (sentences.length < 3) return 50;

    // Check for formulaic structure
    // AI tends to: intro → body → conclusion in EVERY paragraph
    let formulaicCount = 0;
    const paragraphs = text.split(/\n\s*\n/);

    for (const para of paragraphs) {
        const paraSentences = splitSentences(para);
        if (paraSentences.length >= 3) {
            // Check if last sentence is a conclusion
            const lastSentence = paraSentences[paraSentences.length - 1].toLowerCase();
            if (/therefore|thus|hence|consequently|in summary|overall/.test(lastSentence)) {
                formulaicCount++;
            }
        }
    }

    const formulaicRatio = formulaicCount / (paragraphs.length || 1);
    return Math.round(formulaicRatio * 100);
}

/**
 * 10. Stylometric Fingerprint - Writing style consistency
 */
function calculateStylometricScore(text: string): number {
    const sentences = splitSentences(text);
    if (sentences.length < 5) return 50;

    // Check function word distribution (consistent in AI)
    const functionWords = ['the', 'a', 'an', 'is', 'are', 'was', 'were', 'to', 'of', 'in', 'for', 'on', 'with'];

    const ratios = sentences.map(s => {
        const words = tokenize(s).map(w => w.toLowerCase());
        const funcCount = words.filter(w => functionWords.includes(w)).length;
        return funcCount / (words.length || 1);
    });

    // Calculate variance in function word usage
    const avgRatio = ratios.reduce((a, b) => a + b, 0) / ratios.length;
    const variance = ratios.reduce((sum, r) => sum + Math.pow(r - avgRatio, 2), 0) / ratios.length;

    // Low variance = consistent (AI-like)
    const varianceScore = variance * 1000;
    return Math.round(Math.max(0, Math.min(100, 80 - varianceScore)));
}

/**
 * Detect specific patterns for reporting
 */
function detectPatterns(text: string): PatternMatch[] {
    const patterns: PatternMatch[] = [];
    const lowerText = text.toLowerCase();

    const allPatterns = [
        { patterns: AI_PATTERNS.highConfidence, severity: 'high' as const, suggestion: 'Remove or rephrase this AI-typical phrase' },
        { patterns: AI_PATTERNS.transitions, severity: 'medium' as const, suggestion: 'Vary your transition words' },
        { patterns: AI_PATTERNS.fillers, severity: 'medium' as const, suggestion: 'Remove filler language' },
        { patterns: AI_PATTERNS.closings, severity: 'medium' as const, suggestion: 'Rephrase conclusion' },
        { patterns: AI_PATTERNS.hedging, severity: 'low' as const, suggestion: 'Consider more direct phrasing' },
    ];

    for (const group of allPatterns) {
        for (const pattern of group.patterns) {
            const count = countOccurrences(lowerText, pattern.toLowerCase());
            if (count > 0) {
                patterns.push({
                    pattern,
                    count,
                    severity: group.severity,
                    suggestion: group.suggestion,
                });
            }
        }
    }

    return patterns.sort((a, b) => {
        const severityOrder = { high: 0, medium: 1, low: 2 };
        return severityOrder[a.severity] - severityOrder[b.severity];
    });
}

/**
 * Get risk level from score
 */
function getRiskLevel(score: number): 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH' {
    if (score >= 80) return 'VERY_HIGH';
    if (score >= 60) return 'HIGH';
    if (score >= 40) return 'MEDIUM';
    return 'LOW';
}

/**
 * Calculate confidence based on text length and metric agreement
 */
function calculateConfidence(text: string, metrics: MetricResult[]): number {
    const words = tokenize(text);

    // Confidence increases with text length
    const lengthFactor = Math.min(1, words.length / 500);

    // Confidence increases when metrics agree
    const scores = metrics.map(m => m.score);
    const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    const variance = scores.reduce((sum, s) => sum + Math.pow(s - avgScore, 2), 0) / scores.length;
    const agreementFactor = Math.max(0, 1 - variance / 1000);

    return Math.round((lengthFactor * 0.4 + agreementFactor * 0.6) * 100);
}

/**
 * Generate improvement suggestions
 */
function generateSuggestions(metrics: MetricResult[], patterns: PatternMatch[]): string[] {
    const suggestions: string[] = [];

    // Add suggestions based on worst metrics
    const sortedMetrics = [...metrics].sort((a, b) => b.score - a.score);
    const worst = sortedMetrics.slice(0, 3);

    for (const metric of worst) {
        if (metric.score >= 60) {
            switch (metric.name) {
                case 'Perplexity':
                    suggestions.push('Use more unique word combinations');
                    break;
                case 'Burstiness':
                    suggestions.push('Vary sentence complexity - mix short and long sentences');
                    break;
                case 'Type-Token Ratio':
                    suggestions.push('Use more diverse vocabulary');
                    break;
                case 'N-gram Patterns':
                    suggestions.push('Remove common AI phrases like "Furthermore" and "In conclusion"');
                    break;
                case 'Structural Analysis':
                    suggestions.push('Vary paragraph structures and sentence openings');
                    break;
            }
        }
    }

    // Add pattern-specific suggestions
    const highSeverityPatterns = patterns.filter(p => p.severity === 'high');
    if (highSeverityPatterns.length > 0) {
        suggestions.push(`Remove high-risk phrases: ${highSeverityPatterns.slice(0, 3).map(p => `"${p.pattern}"`).join(', ')}`);
    }

    return suggestions.slice(0, 5);
}

// Helper functions
function tokenize(text: string): string[] {
    return text.match(/\b[a-zA-Z]+\b/g) || [];
}

function splitSentences(text: string): string[] {
    return text.split(/[.!?]+/).filter(s => s.trim().length > 0);
}

function countOccurrences(text: string, pattern: string): number {
    let count = 0;
    let pos = 0;
    while ((pos = text.indexOf(pattern, pos)) !== -1) {
        count++;
        pos += pattern.length;
    }
    return count;
}

export { AI_PATTERNS };
