/**
 * Writing rules for generated prose, and a check for stock phrases that make
 * generated text read as generic filler.
 */

export const WRITING_GUIDE = `Writing style:
- Open each paragraph with its main claim, then support it with a specific source, number or example.
- Use concrete nouns and active verbs; say who did what. Prefer "Smith et al. found" over "it has been found".
- Vary sentence length. Do not default to lists of three.
- No throat-clearing openers ("In today's world...") and no paragraph-ending summaries that restate the paragraph.
- Hedge only where the evidence is genuinely uncertain, and say why.
- Use the field's precise terms instead of vague intensifiers ("very", "highly", "significantly" outside statistics).
- Do not use these stock phrases: "delve", "in today's rapidly evolving world", "plays a crucial role", "it is important to note", "a testament to", "tapestry", "navigate the complexities", "multifaceted", "shed light on", "pave the way", "underscores the importance", "in the realm of", "the landscape of", "harness the power", "cutting-edge", "at the forefront", "intricate interplay", "a myriad of", "plethora".`;

// Each pattern is matched case-insensitively against the text
const STOCK_PHRASES: { label: string; pattern: RegExp }[] = [
    { label: 'delve', pattern: /\bdelv(e|es|ed|ing)\b/gi },
    { label: "in today's ... world", pattern: /\bin today'?s (fast-paced |rapidly evolving |ever-changing |modern |digital )?(world|landscape|era|society)\b/gi },
    { label: 'rapidly/ever-evolving landscape', pattern: /\b(rapidly|ever)[- ]evolving (landscape|field|world|domain)\b/gi },
    { label: 'plays a crucial role', pattern: /\bplay(s|ed|ing)? an? (crucial|pivotal|vital|key|critical|significant|central) role\b/gi },
    { label: 'it is important to note', pattern: /\bit is (important|crucial|essential|worth) (to note|noting|mentioning|highlighting)( that)?\b/gi },
    { label: 'a testament to', pattern: /\ba testament to\b/gi },
    { label: 'tapestry', pattern: /\btapestr(y|ies)\b/gi },
    { label: 'navigate the complexities', pattern: /\bnavigat(e|es|ing) the (complexities|complex|intricacies|landscape)\b/gi },
    { label: 'multifaceted', pattern: /\bmultifaceted\b/gi },
    { label: 'shed light on', pattern: /\bshed(s|ding)? (new )?light on\b/gi },
    { label: 'pave the way', pattern: /\bpav(e|es|ed|ing) the way\b/gi },
    { label: 'underscores the importance', pattern: /\bunderscor(e|es|ed|ing) the (importance|need|significance|critical)\b/gi },
    { label: 'in the realm of', pattern: /\bin the realm of\b/gi },
    { label: 'the landscape of', pattern: /\bthe (evolving |complex )?landscape of\b/gi },
    { label: 'harness the power', pattern: /\bharness(es|ed|ing)? the (power|potential)\b/gi },
    { label: 'unlock the potential', pattern: /\bunlock(s|ed|ing)? (the|its|their) (full )?(potential|power)\b/gi },
    { label: 'cutting-edge', pattern: /\bcutting[- ]edge\b/gi },
    { label: 'at the forefront', pattern: /\bat the forefront of\b/gi },
    { label: 'intricate interplay', pattern: /\bintricate (interplay|relationship|web)\b/gi },
    { label: 'a myriad of', pattern: /\ba myriad of\b/gi },
    { label: 'plethora', pattern: /\bplethora\b/gi },
    { label: 'paradigm shift', pattern: /\bparadigm shift\b/gi },
    { label: 'game changer', pattern: /\bgame[- ]chang(er|ing)\b/gi },
    { label: 'holistic approach', pattern: /\bholistic (approach|understanding|view)\b/gi },
    { label: 'nuanced understanding', pattern: /\bnuanced understanding\b/gi },
    { label: 'serves as a powerful', pattern: /\bserv(e|es|ed|ing) as an? (crucial|vital|powerful|cornerstone|stark)\b/gi },
    { label: 'needless to say', pattern: /\bneedless to say\b/gi },
];

export interface StockPhraseMatch {
    label: string;
    count: number;
}

export function findStockPhrases(text: string): StockPhraseMatch[] {
    return STOCK_PHRASES
        .map(({ label, pattern }) => ({ label, count: text.match(pattern)?.length ?? 0 }))
        .filter(m => m.count > 0);
}

/**
 * Citations and numbers that an edit must not drop or change.
 * Parenthetical citations are anything in parentheses with a year or "et al."; numbers include decimals.
 */
export function protectedTokens(text: string): string[] {
    const citations = text.match(/\([^()]*(\b(1[89]|20)\d{2}\b|et al\.|n\.d\.|no date)[^()]*\)/g) ?? [];
    const numbers = text.match(/(?<![\w.])-?\d+(?:[.,]\d+)*%?/g) ?? [];
    return [...citations, ...numbers];
}

/** True when every protected token in `original` still appears at least as often in `revised` */
export function preservesTokens(original: string, revised: string): boolean {
    const count = (tokens: string[]) => tokens.reduce((m, t) => m.set(t, (m.get(t) ?? 0) + 1), new Map<string, number>());
    const before = count(protectedTokens(original));
    const after = count(protectedTokens(revised));
    for (const [token, n] of before) {
        if ((after.get(token) ?? 0) < n) return false;
    }
    return true;
}
