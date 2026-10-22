/**
 * Deterministic style cleanup: rewrites stock phrases with fixed, grammar-safe replacements
 * and normalizes em-dashes. Content that must stay exact (direct quotes, citations, numbers,
 * equations, code, URLs) is masked before editing and restored afterwards.
 */

export type DashStyle = 'keep' | 'replace';

export interface CleanupChange {
    from: string;
    to: string;
}

export interface CleanupResult {
    text: string;
    changes: CleanupChange[];
}

interface Rewrite {
    pattern: RegExp;
    replace: string | ((match: string, ...groups: string[]) => string);
}

// Ordered: longer phrases first so "delves into" wins over a shorter overlapping rule
const REWRITES: Rewrite[] = [
    { pattern: /\bit is (?:important|crucial|essential|worth) (?:to note|noting|mentioning|highlighting) that\s+/gi, replace: '' },
    { pattern: /\bneedless to say,?\s+/gi, replace: '' },
    { pattern: /\bin today's (?:fast-paced |rapidly evolving |ever-changing |modern |digital )?(?:world|landscape|era|society),?\s*/gi, replace: 'Today, ' },
    { pattern: /\bdelves (?:deeper )?into\b/gi, replace: 'examines' },
    { pattern: /\bdelved (?:deeper )?into\b/gi, replace: 'examined' },
    { pattern: /\bdelving (?:deeper )?into\b/gi, replace: 'examining' },
    { pattern: /\bdelve (?:deeper )?into\b/gi, replace: 'examine' },
    { pattern: /\bplays an? (?:crucial|pivotal|vital|key|critical|significant|central) role in\b/gi, replace: 'is central to' },
    { pattern: /\bplay an? (?:crucial|pivotal|vital|key|critical|significant|central) role in\b/gi, replace: 'are central to' },
    { pattern: /\bplayed an? (?:crucial|pivotal|vital|key|critical|significant|central) role in\b/gi, replace: 'was central to' },
    { pattern: /\bsheds (?:new )?light on\b/gi, replace: 'clarifies' },
    { pattern: /\bshedding (?:new )?light on\b/gi, replace: 'clarifying' },
    { pattern: /\bshed (?:new )?light on\b/gi, replace: 'clarify' },
    { pattern: /\bpaves the way for\b/gi, replace: 'enables' },
    { pattern: /\bpaved the way for\b/gi, replace: 'enabled' },
    { pattern: /\bpaving the way for\b/gi, replace: 'enabling' },
    { pattern: /\bpave the way for\b/gi, replace: 'enable' },
    { pattern: /\bunderscores the (importance|need|significance) of\b/gi, replace: (_m, what: string) => `shows the ${what.toLowerCase()} of` },
    { pattern: /\bunderscore the (importance|need|significance) of\b/gi, replace: (_m, what: string) => `show the ${what.toLowerCase()} of` },
    { pattern: /\bharnessing the (?:power|potential) of\b/gi, replace: 'using' },
    { pattern: /\bharness the (?:power|potential) of\b/gi, replace: 'use' },
    { pattern: /\bnavigat(?:e|ing) the (?:complexities|intricacies) of\b/gi, replace: (m) => (/ing\b/i.test(m.split(' ')[0]) ? 'addressing' : 'address') },
    { pattern: /\bin the realm of\b/gi, replace: 'in' },
    { pattern: /\ba (?:myriad|plethora) of\b/gi, replace: 'many' },
    { pattern: /\ba testament to\b/gi, replace: 'evidence of' },
    { pattern: /\bintricate (?:interplay|relationship)\b/gi, replace: 'interaction' },
    { pattern: /\bparadigm shift\b/gi, replace: 'major shift' },
    { pattern: /\bholistic (approach|understanding|view)\b/gi, replace: (_m, noun: string) => `comprehensive ${noun.toLowerCase()}` },
    { pattern: /\bmultifaceted\b/gi, replace: 'complex' },
    { pattern: /\bcutting[- ]edge\b/gi, replace: 'advanced' },
    { pattern: /\bgame[- ]changer\b/gi, replace: 'major advance' },
    { pattern: /\bnuanced understanding\b/gi, replace: 'detailed understanding' },
];

// --- Locking content that must not change --------------------------------------

const LOCKS: RegExp[] = [
    /"[^"\n]{1,400}"|“[^”\n]{1,400}”/g,                       // direct quotations
    /`[^`\n]+`/g,                                              // inline code
    /\$[^$\n]+\$/g,                                            // inline math
    /https?:\/\/\S+|\bdoi:\s*\S+/gi,                           // URLs and DOIs
    /\([^()]*\b(?:1[5-9]|20)\d{2}[a-z]?\b[^()]*\)/g,         // (Author, 2020)
    /\[\d+(?:\s*[-–,]\s*\d+)*\]/g,                             // [3], [1, 4]
    /[A-Za-z]*\(\d+(?:,\s*\d+)?\)\s*=\s*[-−]?\.?\d[\d.,]*/g,   // test statistics like r(148) = .96
    /\b\d[\d.,]*%?/g,                                          // numbers
];

const MARK_OPEN = '';
const MARK_CLOSE = '';

function lock(text: string): { masked: string; held: string[] } {
    const held: string[] = [];
    let masked = text;
    for (const re of LOCKS) {
        masked = masked.replace(re, (m) => {
            // Already-masked spans contain the marker characters; leave them alone
            if (m.includes(MARK_OPEN)) return m;
            held.push(m);
            return `${MARK_OPEN}${held.length - 1}${MARK_CLOSE}`;
        });
    }
    return { masked, held };
}

function unlock(text: string, held: string[]): string {
    const re = new RegExp(`${MARK_OPEN}(\\d+)${MARK_CLOSE}`, 'g');
    // Locked spans can nest (a number inside a quote), so restore until none are left
    let out = text;
    for (let i = 0; i < 5 && re.test(out); i++) {
        out = out.replace(re, (_, n: string) => held[Number(n)]);
    }
    return out;
}

// --- Rewriting -------------------------------------------------------------------

function matchCase(original: string, replacement: string): string {
    if (!replacement) return replacement;
    return /^[A-Z]/.test(original) ? replacement.charAt(0).toUpperCase() + replacement.slice(1) : replacement;
}

/** Capitalize the first letter after a sentence boundary, used after deleting a lead-in phrase */
function recapitalize(text: string): string {
    return text
        .replace(/^(\s*)([a-z])/, (_, s: string, c: string) => s + c.toUpperCase())
        .replace(/([.!?]\s+)([a-z])/g, (_, p: string, c: string) => p + c.toUpperCase());
}

function rewritePhrases(text: string, changes: CleanupChange[]): string {
    let out = text;
    for (const { pattern, replace } of REWRITES) {
        out = out.replace(pattern, (match: string, ...rest: unknown[]) => {
            const groups = rest.slice(0, -2) as string[];
            const raw = typeof replace === 'function' ? replace(match, ...groups) : replace;
            const to = matchCase(match, raw);
            changes.push({ from: match.trim(), to: to.trim() || '(removed)' });
            return to;
        });
    }
    return recapitalize(out);
}

/**
 * Em-dashes: a paired aside ("X—an aside—Y") becomes parentheses; a single dash becomes a comma.
 * En-dashes in ranges (2010–2020, pp. 4–9) are left alone.
 */
function replaceDashes(text: string, changes: CleanupChange[]): string {
    let out = text.replace(/\s*(?:—|--(?!-))\s*([^—\n]{1,120}?)\s*(?:—|--(?!-))\s*/g, (match, aside: string) => {
        changes.push({ from: match.trim(), to: `(${aside})` });
        return ` (${aside}) `;
    });
    out = out.replace(/\s*(?:—|--(?!-))\s*/g, (match) => {
        changes.push({ from: match.trim() || '—', to: ',' });
        return ', ';
    });
    // Tidy spacing and punctuation the replacements can leave behind
    return out.replace(/ {2,}/g, ' ').replace(/\s+([,.;:)])/g, '$1').replace(/,\s*,/g, ',').replace(/\(\s+/g, '(');
}

export function cleanupText(text: string, options: { dashes?: DashStyle } = {}): CleanupResult {
    const changes: CleanupChange[] = [];
    const { masked, held } = lock(text);
    let out = rewritePhrases(masked, changes);
    if (options.dashes !== 'keep') out = replaceDashes(out, changes);
    return { text: unlock(out, held), changes };
}

// --- Section-aware application ---------------------------------------------------

export interface CleanupSection {
    id: string;
    title: string;
    content: string;
}

export interface SectionCleanup {
    sectionId: string;
    title: string;
    before: string;
    after: string;
    changes: CleanupChange[];
}

/**
 * Run cleanup on the chosen sections only. Reference lists are never edited, and tables
 * are separate data, so they are untouched by construction.
 */
export function cleanupSections(
    sections: CleanupSection[],
    sectionIds: string[],
    options: { dashes?: DashStyle } = {}
): SectionCleanup[] {
    return sections
        .filter(s => sectionIds.includes(s.id) && s.id !== 'references')
        .map(s => {
            const paragraphs = s.content.split(/\n\s*\n/);
            const results = paragraphs.map(p => cleanupText(p, options));
            return {
                sectionId: s.id,
                title: s.title,
                before: s.content,
                after: results.map(r => r.text).join('\n\n'),
                changes: results.flatMap(r => r.changes),
            };
        })
        .filter(r => r.changes.length > 0);
}
