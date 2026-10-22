import { Reference, Author } from './references-api';

export type CitationStyle = 'apa' | 'mla' | 'harvard' | 'ieee';

export const CITATION_STYLES: Record<CitationStyle, { label: string; referencesTitle: string }> = {
    apa: { label: 'APA 7th', referencesTitle: 'References' },
    mla: { label: 'MLA 9th', referencesTitle: 'Works Cited' },
    harvard: { label: 'Harvard', referencesTitle: 'Reference list' },
    ieee: { label: 'IEEE', referencesTitle: 'References' },
};

/** Numbered styles cite by position in the reference list instead of author and year */
export function isNumberedStyle(style: CitationStyle): boolean {
    return style === 'ieee';
}

/**
 * Format author names for APA style
 */
function formatAPAAuthors(authors: Author[]): string {
    if (!authors.length) return '';

    if (authors.length === 1) {
        const author = authors[0];
        const parts = author.name.split(' ');
        if (parts.length >= 2) {
            const lastName = parts[parts.length - 1];
            const initials = parts.slice(0, -1).map(n => n[0] + '.').join(' ');
            return `${lastName}, ${initials}`;
        }
        return author.name;
    }

    if (authors.length === 2) {
        const formatted = authors.map(a => {
            const parts = a.name.split(' ');
            if (parts.length >= 2) {
                const lastName = parts[parts.length - 1];
                const initials = parts.slice(0, -1).map(n => n[0] + '.').join(' ');
                return `${lastName}, ${initials}`;
            }
            return a.name;
        });
        return `${formatted[0]}, & ${formatted[1]}`;
    }

    if (authors.length <= 20) {
        const formatted = authors.map((a, i) => {
            const parts = a.name.split(' ');
            const lastName = parts[parts.length - 1];
            const initials = parts.slice(0, -1).map(n => n[0] + '.').join(' ');
            const formatted = `${lastName}, ${initials}`;

            if (i === authors.length - 1) return `& ${formatted}`;
            return formatted;
        });
        return formatted.join(', ');
    }

    // More than 20 authors: first 19, ..., last
    const first19 = authors.slice(0, 19).map(a => {
        const parts = a.name.split(' ');
        const lastName = parts[parts.length - 1];
        const initials = parts.slice(0, -1).map(n => n[0] + '.').join(' ');
        return `${lastName}, ${initials}`;
    });

    const last = authors[authors.length - 1];
    const lastParts = last.name.split(' ');
    const lastFormatted = `${lastParts[lastParts.length - 1]}, ${lastParts.slice(0, -1).map(n => n[0] + '.').join(' ')}`;

    return `${first19.join(', ')}, ... ${lastFormatted}`;
}

/**
 * Format a full APA reference
 */
export function formatAPAReference(ref: Reference): string {
    const authors = formatAPAAuthors(ref.authors);
    const year = ref.year ? `(${ref.year})` : '(n.d.)';
    const title = ref.title;
    const venue = ref.venue ? `*${ref.venue}*` : '';
    const doi = ref.doi ? `https://doi.org/${ref.doi}` : '';

    let citation = `${authors} ${year}. ${title}.`;

    if (venue) {
        citation += ` ${venue}.`;
    }

    if (doi) {
        citation += ` ${doi}`;
    }

    return citation;
}

/**
 * Format an in-text citation in APA style
 */
export function formatAPAInTextCitation(ref: Reference, includePageNumber?: string): string {
    if (!ref.authors.length) {
        const shortTitle = ref.title.length > 30 ? ref.title.slice(0, 30) + '...' : ref.title;
        return includePageNumber
            ? `("${shortTitle}", ${ref.year || 'n.d.'}, p. ${includePageNumber})`
            : `("${shortTitle}", ${ref.year || 'n.d.'})`;
    }

    const year = ref.year || 'n.d.';

    if (ref.authors.length === 1) {
        const lastName = ref.authors[0].name.split(' ').pop();
        return includePageNumber
            ? `(${lastName}, ${year}, p. ${includePageNumber})`
            : `(${lastName}, ${year})`;
    }

    if (ref.authors.length === 2) {
        const lastName1 = ref.authors[0].name.split(' ').pop();
        const lastName2 = ref.authors[1].name.split(' ').pop();
        return includePageNumber
            ? `(${lastName1} & ${lastName2}, ${year}, p. ${includePageNumber})`
            : `(${lastName1} & ${lastName2}, ${year})`;
    }

    // 3+ authors: use et al.
    const lastName = ref.authors[0].name.split(' ').pop();
    return includePageNumber
        ? `(${lastName} et al., ${year}, p. ${includePageNumber})`
        : `(${lastName} et al., ${year})`;
}

/**
 * Format narrative in-text citation (author as part of sentence)
 */
export function formatAPANarrativeCitation(ref: Reference): string {
    if (!ref.authors.length) {
        return `"${ref.title}" (${ref.year || 'n.d.'})`;
    }

    const year = ref.year || 'n.d.';

    if (ref.authors.length === 1) {
        const lastName = ref.authors[0].name.split(' ').pop();
        return `${lastName} (${year})`;
    }

    if (ref.authors.length === 2) {
        const lastName1 = ref.authors[0].name.split(' ').pop();
        const lastName2 = ref.authors[1].name.split(' ').pop();
        return `${lastName1} and ${lastName2} (${year})`;
    }

    const lastName = ref.authors[0].name.split(' ').pop();
    return `${lastName} et al. (${year})`;
}

/**
 * Generate a complete reference list in APA format
 */
export function generateReferenceList(refs: Reference[]): string {
    // Sort alphabetically by first author's last name
    const sorted = [...refs].sort((a, b) => {
        const aLastName = a.authors[0]?.name.split(' ').pop()?.toLowerCase() || '';
        const bLastName = b.authors[0]?.name.split(' ').pop()?.toLowerCase() || '';
        return aLastName.localeCompare(bLastName);
    });

    return sorted.map(ref => formatAPAReference(ref)).join('\n\n');
}

/**
 * Validate citation format
 */
export function validateAPACitation(citation: string): { valid: boolean; issues: string[] } {
    const issues: string[] = [];

    // Check for year
    if (!/\(\d{4}\)|\(n\.d\.\)/.test(citation)) {
        issues.push('Missing or improperly formatted year');
    }

    // Check for proper author format
    if (!/^[A-Z][a-z]+,/.test(citation)) {
        issues.push('Author last name should come first');
    }

    // Check for period after year
    if (!/\)\.\s/.test(citation)) {
        issues.push('Period should follow the year');
    }

    return {
        valid: issues.length === 0,
        issues,
    };
}

// --- Style-aware formatting (APA 7, MLA 9, Harvard / Cite Them Right) --------
// Italics are marked with *asterisks*; exports render them and plain text strips them.

interface NameParts {
    family: string;
    given: string[];
}

function splitName(name: string): NameParts {
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return { family: parts[0], given: [] };
    return { family: parts[parts.length - 1], given: parts.slice(0, -1) };
}

const initials = (given: string[]) => given.map(g => `${g[0]}.`).join(' ');

/** "Family, I. I." (Harvard), or just the family name for single-word names */
function familyInitials(name: string): string {
    const { family, given } = splitName(name);
    return given.length ? `${family}, ${initials(given)}` : family;
}

/** End a title with a period unless it already ends with punctuation */
function closeTitle(title: string): string {
    return /[.?!]$/.test(title) ? title : `${title}.`;
}

function doiUrl(ref: Reference): string {
    return ref.doi ? `https://doi.org/${ref.doi}` : ref.url ?? '';
}

function shortTitle(title: string): string {
    const words = title.split(/\s+/);
    return words.length > 4 ? `${words.slice(0, 4).join(' ')}...` : title;
}

function mlaReference(ref: Reference): string {
    const a = ref.authors;
    let authors = '';
    if (a.length === 1) {
        const { family, given } = splitName(a[0].name);
        authors = given.length ? `${family}, ${given.join(' ')}` : family;
    } else if (a.length === 2) {
        const first = splitName(a[0].name);
        authors = `${first.given.length ? `${first.family}, ${first.given.join(' ')}` : first.family}, and ${a[1].name}`;
    } else if (a.length > 2) {
        const first = splitName(a[0].name);
        authors = `${first.given.length ? `${first.family}, ${first.given.join(' ')}` : first.family}, et al`;
    }
    const parts = [`"${closeTitle(ref.title)}"`];
    const container = [ref.venue ? `*${ref.venue}*` : '', ref.year ? String(ref.year) : '', doiUrl(ref)].filter(Boolean);
    const tail = container.length ? ` ${container.join(', ')}.` : '';
    return `${authors ? `${authors}. ` : ''}${parts.join(' ')}${tail}`;
}

function harvardAuthors(authors: Author[]): string {
    if (authors.length === 0) return '';
    if (authors.length >= 4) return `${familyInitials(authors[0].name)} et al.`;
    const names = authors.map(x => familyInitials(x.name));
    return names.length === 1 ? names[0] : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}

function harvardReference(ref: Reference): string {
    const authors = harvardAuthors(ref.authors);
    const year = ref.year ? `(${ref.year})` : '(no date)';
    const lead = authors ? `${authors} ${year}` : `${ref.title} ${year}`;
    const title = authors ? ` '${ref.title}'` : '';
    const venue = ref.venue ? `, *${ref.venue}*` : '';
    const url = doiUrl(ref);
    return `${lead}${title}${venue}.${url ? ` Available at: ${url}` : ''}`;
}

function ieeeReference(ref: Reference, number?: number): string {
    // IEEE: initials before family name; more than six authors -> first author et al.
    const names = ref.authors.map(x => {
        const { family, given } = splitName(x.name);
        return given.length ? `${initials(given)} ${family}` : family;
    });
    const authors = names.length > 6 ? `${names[0]} et al.`
        : names.length <= 2 ? names.join(' and ')
            : `${names.slice(0, -1).join(', ')}, and ${names[names.length - 1]}`;
    const title = `"${ref.title},"`;
    const tail = [ref.venue ? `*${ref.venue}*` : '', ref.year ? String(ref.year) : ''].filter(Boolean).join(', ');
    const doi = ref.doi ? `, doi: ${ref.doi}` : ref.url ? `. [Online]. Available: ${ref.url}` : '';
    const body = `${authors ? `${authors}, ` : ''}${title} ${tail}${doi}.`.replace(/\s+\./, '.').replace(/,"\s*\./, '."');
    return number !== undefined ? `[${number}] ${body}` : body;
}

/** Full reference-list entry; `number` is the position for numbered styles */
export function formatReference(ref: Reference, style: CitationStyle, number?: number): string {
    if (style === 'ieee') return ieeeReference(ref, number);
    if (style === 'mla') return mlaReference(ref);
    if (style === 'harvard') return harvardReference(ref);
    return formatAPAReference(ref);
}

function familyNames(authors: Author[]): string[] {
    return authors.map(x => splitName(x.name).family);
}

/** Parenthetical in-text citation, e.g. (He et al., 2016), (He et al.) or [3] */
export function formatInTextCitation(ref: Reference, style: CitationStyle, number?: number): string {
    if (style === 'ieee') return `[${number ?? '?'}]`;
    if (style === 'apa') return formatAPAInTextCitation(ref);
    const names = familyNames(ref.authors);
    const year = ref.year ? String(ref.year) : style === 'harvard' ? 'no date' : '';

    if (style === 'mla') {
        if (names.length === 0) return `("${shortTitle(ref.title)}")`;
        if (names.length === 1) return `(${names[0]})`;
        if (names.length === 2) return `(${names[0]} and ${names[1]})`;
        return `(${names[0]} et al.)`;
    }

    // Harvard
    if (names.length === 0) return `(*${shortTitle(ref.title)}*, ${year})`;
    if (names.length === 1) return `(${names[0]}, ${year})`;
    if (names.length === 2) return `(${names[0]} and ${names[1]}, ${year})`;
    if (names.length === 3) return `(${names[0]}, ${names[1]} and ${names[2]}, ${year})`;
    return `(${names[0]} et al., ${year})`;
}

/** Narrative citation, e.g. He et al. (2016), He et al. or He et al. [3] */
export function formatNarrativeCitation(ref: Reference, style: CitationStyle, number?: number): string {
    if (style === 'ieee') {
        const names = familyNames(ref.authors);
        const who = names.length === 0 ? `"${ref.title}"` : names.length === 1 ? names[0]
            : names.length === 2 ? `${names[0]} and ${names[1]}` : `${names[0]} et al.`;
        return `${who} [${number ?? '?'}]`;
    }
    if (style === 'apa') return formatAPANarrativeCitation(ref);
    const names = familyNames(ref.authors);
    const year = ref.year ? String(ref.year) : 'no date';

    if (style === 'mla') {
        if (names.length === 0) return `"${ref.title}"`;
        if (names.length === 1) return names[0];
        if (names.length === 2) return `${names[0]} and ${names[1]}`;
        return `${names[0]} et al.`;
    }

    if (names.length === 0) return `*${ref.title}* (${year})`;
    if (names.length === 1) return `${names[0]} (${year})`;
    if (names.length === 2) return `${names[0]} and ${names[1]} (${year})`;
    if (names.length === 3) return `${names[0]}, ${names[1]} and ${names[2]} (${year})`;
    return `${names[0]} et al. (${year})`;
}

/**
 * Reference list in the chosen style, one entry per paragraph.
 * Author-date styles sort alphabetically; numbered styles keep the given order.
 */
export function generateStyledReferenceList(refs: Reference[], style: CitationStyle): string {
    if (isNumberedStyle(style)) return refs.map((r, i) => formatReference(r, style, i + 1)).join('\n\n');
    const sortKey = (r: Reference) => (r.authors[0] ? splitName(r.authors[0].name).family : r.title).toLowerCase();
    return [...refs]
        .sort((a, b) => sortKey(a).localeCompare(sortKey(b)))
        .map(r => formatReference(r, style))
        .join('\n\n');
}

/** Reference-list entry for a Hugging Face dataset */
export function formatDatasetCitation(
    dataset: { id: string; title: string; url: string },
    style: CitationStyle
): string {
    const owner = dataset.id.includes('/') ? dataset.id.split('/')[0] : 'Hugging Face';
    if (style === 'ieee') return `${owner}, "${dataset.title}," Hugging Face. [Online]. Available: ${dataset.url}`;
    if (style === 'mla') return `${owner}. *${dataset.title}*. Hugging Face, ${dataset.url}.`;
    if (style === 'harvard') return `${owner} (no date) *${dataset.title}* [Dataset]. Available at: ${dataset.url}`;
    return `${owner}. (n.d.). *${dataset.title}* [Data set]. Hugging Face. ${dataset.url}`;
}

/**
 * IEEE numbers references in order of first citation. The model cites with the numbers it was
 * given; this rewrites them by first appearance and returns the new order of the source list.
 * Handles [3], [2, 5], [2]-[4] and [2-4]. Uncited sources are dropped, as IEEE lists only cited works.
 */
export function renumberCitations(texts: string[], sourceCount: number): { texts: string[]; order: number[] } {
    const group = /\[(\d+(?:\s*[-–,]\s*\d+)*)\](?:\s*[-–]\s*\[(\d+)\])?/g;
    const expand = (inner: string, rangeEnd?: string): number[] => {
        const nums: number[] = [];
        for (const part of inner.split(',')) {
            const [a, b] = part.split(/[-–]/).map(x => Number(x.trim()));
            if (b !== undefined && !Number.isNaN(b)) for (let n = a; n <= b; n++) nums.push(n);
            else nums.push(a);
        }
        if (rangeEnd) for (let n = nums[nums.length - 1] + 1; n <= Number(rangeEnd); n++) nums.push(n);
        return nums;
    };
    const valid = (nums: number[]) => nums.length > 0 && nums.every(n => Number.isInteger(n) && n >= 1 && n <= sourceCount);

    const order: number[] = [];
    for (const text of texts) {
        for (const m of text.matchAll(group)) {
            const nums = expand(m[1], m[2]);
            if (!valid(nums)) continue;
            for (const n of nums) if (!order.includes(n)) order.push(n);
        }
    }
    const newNumber = new Map(order.map((old, i) => [old, i + 1]));

    const format = (nums: number[]): string => {
        const sorted = [...new Set(nums.map(n => newNumber.get(n)!))].sort((a, b) => a - b);
        const parts: string[] = [];
        for (let i = 0; i < sorted.length; i++) {
            let j = i;
            while (j + 1 < sorted.length && sorted[j + 1] === sorted[j] + 1) j++;
            parts.push(j - i >= 2 ? `[${sorted[i]}]–[${sorted[j]}]` : sorted.slice(i, j + 1).map(n => `[${n}]`).join(', '));
            i = j;
        }
        return parts.join(', ');
    };

    return {
        texts: texts.map(text => text.replace(group, (match, inner: string, end?: string) => {
            const nums = expand(inner, end);
            return valid(nums) ? format(nums) : match;
        })),
        order,
    };
}
