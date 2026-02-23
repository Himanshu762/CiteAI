import { Reference, Author } from './references-api';

export type CitationStyle = 'apa' | 'mla' | 'chicago' | 'harvard';

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
