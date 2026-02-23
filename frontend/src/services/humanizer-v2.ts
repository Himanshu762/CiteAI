/**
 * Humanizer v2 - Advanced Content Humanization Engine
 * 
 * 5 Humanization Levels:
 * 1. Minimal - Fix obvious AI patterns
 * 2. Light - Synonyms + hedging
 * 3. Moderate - Restructuring + questions
 * 4. Strong - Major rewrite + "imperfections"
 * 5. Maximum - Complete transformation
 */

import { AI_PATTERNS } from './ai-detector-v2';
import { geminiCompletion, GEMINI_MODELS } from './gemini-api';

export type HumanizationLevel = 1 | 2 | 3 | 4 | 5;

export interface HumanizationResult {
    originalText: string;
    humanizedText: string;
    level: HumanizationLevel;
    changesApplied: string[];
    estimatedReduction: number; // % reduction in AI score
}

// Synonym database (expanded)
const SYNONYMS: Record<string, string[]> = {
    'important': ['crucial', 'vital', 'significant', 'essential', 'key', 'critical'],
    'shows': ['demonstrates', 'reveals', 'indicates', 'illustrates', 'highlights'],
    'helps': ['assists', 'aids', 'supports', 'facilitates', 'enables'],
    'makes': ['creates', 'produces', 'generates', 'forms', 'builds'],
    'uses': ['employs', 'utilizes', 'applies', 'implements', 'leverages'],
    'provides': ['offers', 'supplies', 'delivers', 'presents', 'gives'],
    'allows': ['enables', 'permits', 'lets', 'facilitates', 'empowers'],
    'increases': ['enhances', 'boosts', 'raises', 'elevates', 'amplifies'],
    'decreases': ['reduces', 'lowers', 'diminishes', 'minimizes', 'lessens'],
    'achieves': ['accomplishes', 'attains', 'reaches', 'realizes', 'fulfills'],
    'affects': ['influences', 'impacts', 'shapes', 'alters', 'modifies'],
    'suggests': ['implies', 'indicates', 'hints', 'proposes', 'recommends'],
    'requires': ['needs', 'demands', 'calls for', 'necessitates', 'entails'],
    'ensure': ['guarantee', 'secure', 'confirm', 'verify', 'make certain'],
    'utilize': ['use', 'employ', 'apply', 'harness', 'leverage'],
    'implement': ['execute', 'apply', 'carry out', 'put into practice', 'deploy'],
    'demonstrate': ['show', 'prove', 'illustrate', 'exhibit', 'display'],
    'facilitate': ['enable', 'help', 'assist', 'support', 'ease'],
    'enhance': ['improve', 'boost', 'strengthen', 'augment', 'enrich'],
    'comprehensive': ['thorough', 'complete', 'extensive', 'all-encompassing', 'in-depth'],
    'significant': ['notable', 'considerable', 'substantial', 'meaningful', 'major'],
    'effectively': ['successfully', 'efficiently', 'competently', 'capably', 'well'],
    'particularly': ['especially', 'notably', 'specifically', 'distinctly', 'mainly'],
    'however': ['yet', 'but', 'still', 'nonetheless', 'though'],
    'therefore': ['thus', 'hence', 'consequently', 'so', 'as a result'],
    'additionally': ['also', 'moreover', 'besides', 'plus', 'further'],
    'furthermore': ['also', 'in addition', 'besides', 'what is more', 'moreover'],
};

// AI phrase replacements
const PHRASE_REPLACEMENTS: Record<string, string[]> = {
    'In conclusion,': ['To wrap up,', 'Ultimately,', 'Looking back,', 'All things considered,'],
    'Furthermore,': ['Also,', 'Plus,', 'Beyond that,', 'What\'s more,'],
    'Additionally,': ['Also,', 'On top of that,', 'Besides,', 'Plus,'],
    'Moreover,': ['Also,', 'On top of that,', 'Besides this,', 'What\'s more,'],
    'However,': ['But,', 'Yet,', 'Still,', 'Though,'],
    'Therefore,': ['So,', 'Thus,', 'As a result,', 'Because of this,'],
    'Consequently,': ['As a result,', 'So,', 'Thus,', 'Because of this,'],
    'In order to': ['To', 'So that', 'For', ''],
    'Due to the fact that': ['Because', 'Since', 'As', 'Given that'],
    'It is important to note that': ['Notably,', 'Keep in mind that', 'Remember that', ''],
    'It should be noted that': ['Note that', 'Remember,', 'Keep in mind,', ''],
    'It is worth mentioning': ['Worth noting,', 'Notably,', 'Interestingly,', ''],
    'plays a crucial role': ['is key', 'matters greatly', 'is central', 'is vital'],
    'In the realm of': ['In', 'Within', 'Regarding', 'When it comes to'],
    'serves as a testament': ['shows', 'proves', 'demonstrates', 'highlights'],
    'has become increasingly important': ['matters more now', 'is now vital', 'is growing in importance', 'is key today'],
};

// Hedging phrases to add
const HEDGING_PHRASES = [
    'perhaps', 'possibly', 'maybe', 'might', 'could be',
    'it seems', 'appears to be', 'likely', 'some argue that',
    'in many cases', 'often', 'generally', 'typically',
];

// Sentence starters to vary
const SENTENCE_STARTERS = [
    'Interestingly,', 'Notably,', 'Surprisingly,', 'In practice,',
    'Looking at this,', 'Consider that', 'Think about',
    'What stands out is', 'The key point is', 'One thing to note:',
];

/**
 * Main humanization function
 */
export async function humanizeContent(
    text: string,
    level: HumanizationLevel = 3
): Promise<HumanizationResult> {
    const changesApplied: string[] = [];
    let humanizedText = text;

    // Level 1: Minimal - Fix obvious AI patterns
    if (level >= 1) {
        humanizedText = removeAIPatterns(humanizedText);
        changesApplied.push('Removed obvious AI patterns');

        humanizedText = fixTransitions(humanizedText);
        changesApplied.push('Fixed formulaic transitions');
    }

    // Level 2: Light - Synonyms + hedging
    if (level >= 2) {
        humanizedText = applySynonyms(humanizedText);
        changesApplied.push('Applied synonym substitutions');

        humanizedText = addHedging(humanizedText);
        changesApplied.push('Added hedging language');
    }

    // Level 3: Moderate - Restructuring
    if (level >= 3) {
        humanizedText = varySentenceLengths(humanizedText);
        changesApplied.push('Varied sentence lengths');

        humanizedText = diversifySentenceStarters(humanizedText);
        changesApplied.push('Diversified sentence starters');

        humanizedText = addRhetoricalQuestions(humanizedText);
        changesApplied.push('Added rhetorical questions');
    }

    // Level 4: Strong - Major restructuring
    if (level >= 4) {
        humanizedText = toggleVoice(humanizedText);
        changesApplied.push('Toggled active/passive voice');

        humanizedText = addPersonalVoice(humanizedText);
        changesApplied.push('Added personal voice elements');

        humanizedText = breakRepetitivePatterns(humanizedText);
        changesApplied.push('Broke repetitive patterns');
    }

    // Level 5: Maximum - AI-powered rewrite
    if (level >= 5) {
        humanizedText = await aiRewrite(humanizedText);
        changesApplied.push('AI-powered complete rewrite');
    }

    // Calculate estimated reduction
    const estimatedReduction = calculateEstimatedReduction(level, changesApplied.length);

    return {
        originalText: text,
        humanizedText,
        level,
        changesApplied,
        estimatedReduction,
    };
}

/**
 * Remove obvious AI patterns
 */
function removeAIPatterns(text: string): string {
    let result = text;

    // Replace high-confidence AI phrases
    for (const pattern of AI_PATTERNS.highConfidence) {
        const lowerPattern = pattern.toLowerCase();
        const regex = new RegExp(escapeRegex(pattern), 'gi');

        if (PHRASE_REPLACEMENTS[pattern]) {
            const replacement = PHRASE_REPLACEMENTS[pattern][Math.floor(Math.random() * PHRASE_REPLACEMENTS[pattern].length)];
            result = result.replace(regex, replacement);
        }
    }

    return result;
}

/**
 * Fix formulaic transitions
 */
function fixTransitions(text: string): string {
    let result = text;

    for (const pattern of AI_PATTERNS.transitions) {
        if (PHRASE_REPLACEMENTS[pattern]) {
            const regex = new RegExp(`^${escapeRegex(pattern)}`, 'gim');
            const alternatives = PHRASE_REPLACEMENTS[pattern];

            // Only replace some occurrences to avoid uniformity
            let count = 0;
            result = result.replace(regex, (match) => {
                count++;
                if (count % 2 === 0) {
                    return alternatives[Math.floor(Math.random() * alternatives.length)];
                }
                return match;
            });
        }
    }

    return result;
}

/**
 * Apply synonym substitutions
 */
function applySynonyms(text: string): string {
    let result = text;

    for (const [word, synonyms] of Object.entries(SYNONYMS)) {
        const regex = new RegExp(`\\b${word}\\b`, 'gi');
        let count = 0;

        result = result.replace(regex, (match) => {
            count++;
            // Replace every other occurrence to maintain some variety
            if (count % 2 === 0) {
                const synonym = synonyms[Math.floor(Math.random() * synonyms.length)];
                // Preserve case
                if (match[0] === match[0].toUpperCase()) {
                    return synonym.charAt(0).toUpperCase() + synonym.slice(1);
                }
                return synonym;
            }
            return match;
        });
    }

    return result;
}

/**
 * Add hedging language
 */
function addHedging(text: string): string {
    const sentences = text.split(/(?<=[.!?])\s+/);

    // Add hedging to 10-20% of sentences
    const targetCount = Math.max(1, Math.floor(sentences.length * 0.15));
    const indicesToModify = new Set<number>();

    while (indicesToModify.size < targetCount) {
        indicesToModify.add(Math.floor(Math.random() * sentences.length));
    }

    const modifiedSentences = sentences.map((sentence, index) => {
        if (indicesToModify.has(index) && !startsWithHedging(sentence)) {
            const hedging = HEDGING_PHRASES[Math.floor(Math.random() * HEDGING_PHRASES.length)];
            // Insert after first word or at beginning
            const words = sentence.split(' ');
            if (words.length > 3) {
                words.splice(1, 0, hedging + ',');
                return words.join(' ');
            }
            return `${capitalize(hedging)}, ${sentence.toLowerCase()}`;
        }
        return sentence;
    });

    return modifiedSentences.join(' ');
}

/**
 * Vary sentence lengths
 */
function varySentenceLengths(text: string): string {
    const sentences = text.split(/(?<=[.!?])\s+/);
    const result: string[] = [];

    for (let i = 0; i < sentences.length; i++) {
        const sentence = sentences[i];
        const words = sentence.split(' ');

        // Split long sentences (> 30 words)
        if (words.length > 30 && sentence.includes(',')) {
            const commaIndex = sentence.indexOf(',', Math.floor(sentence.length / 2));
            if (commaIndex > 0) {
                const firstPart = sentence.substring(0, commaIndex) + '.';
                const secondPart = capitalize(sentence.substring(commaIndex + 1).trim());
                result.push(firstPart, secondPart);
                continue;
            }
        }

        // Merge short consecutive sentences (< 8 words each)
        if (words.length < 8 && i < sentences.length - 1) {
            const nextSentence = sentences[i + 1];
            const nextWords = nextSentence?.split(' ') || [];
            if (nextWords.length < 8) {
                result.push(sentence.replace(/[.!?]$/, '') + ', and ' + nextSentence.toLowerCase());
                i++; // Skip next sentence
                continue;
            }
        }

        result.push(sentence);
    }

    return result.join(' ');
}

/**
 * Diversify sentence starters
 */
function diversifySentenceStarters(text: string): string {
    const sentences = text.split(/(?<=[.!?])\s+/);
    const starters = new Map<string, number>();

    // Count sentence starters
    for (const sentence of sentences) {
        const firstWord = sentence.split(' ')[0]?.toLowerCase() || '';
        starters.set(firstWord, (starters.get(firstWord) || 0) + 1);
    }

    // Find repeated starters
    const repeatedStarters = Array.from(starters.entries())
        .filter(([_, count]) => count > 2)
        .map(([word]) => word);

    if (repeatedStarters.length === 0) return text;

    // Replace some repeated starters
    let starterIndex = 0;
    return sentences.map(sentence => {
        const firstWord = sentence.split(' ')[0]?.toLowerCase() || '';
        if (repeatedStarters.includes(firstWord)) {
            const newStarter = SENTENCE_STARTERS[starterIndex % SENTENCE_STARTERS.length];
            starterIndex++;
            // Only replace sometimes
            if (starterIndex % 3 === 0) {
                return newStarter + ' ' + sentence.toLowerCase();
            }
        }
        return sentence;
    }).join(' ');
}

/**
 * Add rhetorical questions
 */
function addRhetoricalQuestions(text: string): string {
    const sentences = text.split(/(?<=[.!?])\s+/);

    // Add 1-2 rhetorical questions
    const targetCount = Math.min(2, Math.max(1, Math.floor(sentences.length / 10)));

    const rhetoricalQuestions = [
        'Why does this matter?',
        'What does this tell us?',
        'But is this the whole picture?',
        'How can we apply this?',
        'What are the implications?',
    ];

    const insertIndices = new Set<number>();
    while (insertIndices.size < targetCount) {
        const index = Math.floor(Math.random() * (sentences.length - 2)) + 1;
        insertIndices.add(index);
    }

    let questionIndex = 0;
    const result: string[] = [];

    sentences.forEach((sentence, index) => {
        result.push(sentence);
        if (insertIndices.has(index)) {
            result.push(rhetoricalQuestions[questionIndex % rhetoricalQuestions.length]);
            questionIndex++;
        }
    });

    return result.join(' ');
}

/**
 * Toggle active/passive voice
 */
function toggleVoice(text: string): string {
    // Simple active to passive conversions
    const patterns: [RegExp, string][] = [
        [/(\w+) shows that/gi, 'It is shown by $1 that'],
        [/(\w+) demonstrates/gi, 'It is demonstrated by $1'],
        [/(\w+) found that/gi, 'It was found by $1 that'],
        [/The study shows/gi, 'It is shown by the study'],
        [/Research indicates/gi, 'It is indicated by research'],
    ];

    let result = text;
    let count = 0;

    for (const [pattern, replacement] of patterns) {
        result = result.replace(pattern, (match, ...groups) => {
            count++;
            // Only convert some instances
            if (count % 3 === 0) {
                return replacement.replace(/\$(\d+)/g, (_, num) => groups[parseInt(num) - 1] || '');
            }
            return match;
        });
    }

    return result;
}

/**
 * Add personal voice elements
 */
function addPersonalVoice(text: string): string {
    const personalPhrases = [
        'I believe', 'In my view', 'From my perspective',
        'It seems to me', 'I would argue', 'One could say',
    ];

    const sentences = text.split(/(?<=[.!?])\s+/);

    // Add personal voice to 1-2 sentences
    const targetCount = Math.min(2, Math.max(1, Math.floor(sentences.length / 15)));
    const indicesToModify = new Set<number>();

    while (indicesToModify.size < targetCount) {
        indicesToModify.add(Math.floor(Math.random() * sentences.length));
    }

    let phraseIndex = 0;
    return sentences.map((sentence, index) => {
        if (indicesToModify.has(index)) {
            const phrase = personalPhrases[phraseIndex % personalPhrases.length];
            phraseIndex++;
            return `${phrase}, ${sentence.toLowerCase()}`;
        }
        return sentence;
    }).join(' ');
}

/**
 * Break repetitive patterns
 */
function breakRepetitivePatterns(text: string): string {
    // Add contractions
    let result = text
        .replace(/\bIt is\b/g, (_, offset) => offset % 100 < 30 ? "It's" : 'It is')
        .replace(/\bdo not\b/g, (_, offset) => offset % 100 < 30 ? "don't" : 'do not')
        .replace(/\bwill not\b/g, (_, offset) => offset % 100 < 30 ? "won't" : 'will not')
        .replace(/\bcan not\b/g, (_, offset) => offset % 100 < 30 ? "can't" : 'can not')
        .replace(/\bcannot\b/g, (_, offset) => offset % 100 < 30 ? "can't" : 'cannot');

    return result;
}

/**
 * AI-powered complete rewrite (Level 5)
 */
async function aiRewrite(text: string): Promise<string> {
    const prompt = `Rewrite this text to sound completely natural and human-written. 
Maintain the exact same meaning and information, but:
1. Use varied sentence structures
2. Add natural language quirks
3. Use contractions where appropriate
4. Vary vocabulary throughout
5. Avoid AI-typical phrases like "Furthermore", "In conclusion", "It is important to note"

Original text:
${text}

Rewritten version:`;

    try {
        const result = await geminiCompletion(prompt, GEMINI_MODELS.PRO);
        return result.trim();
    } catch (error) {
        console.error('AI rewrite failed:', error);
        return text; // Return original if AI fails
    }
}

/**
 * Calculate estimated reduction in AI score
 */
function calculateEstimatedReduction(level: HumanizationLevel, changesCount: number): number {
    const baseReduction = level * 10;
    const changesBonus = Math.min(20, changesCount * 3);
    return Math.min(70, baseReduction + changesBonus);
}

// Helper functions
function escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function startsWithHedging(sentence: string): boolean {
    const lowerSentence = sentence.toLowerCase();
    return HEDGING_PHRASES.some(phrase => lowerSentence.startsWith(phrase));
}

export { SYNONYMS, PHRASE_REPLACEMENTS };
