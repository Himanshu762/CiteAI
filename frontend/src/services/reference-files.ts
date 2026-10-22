/**
 * Reference manager exports: BibTeX (.bib), RIS (.ris) and CSL-JSON (.json),
 * built from the real metadata of the paper's sources and datasets.
 */

import { Reference } from './references-api';

export interface DatasetSource {
    id: string;
    title: string;
    url: string;
}

function familyName(name: string): string {
    const parts = name.trim().split(/\s+/);
    return parts[parts.length - 1] ?? '';
}

function givenNames(name: string): string {
    const parts = name.trim().split(/\s+/);
    return parts.slice(0, -1).join(' ');
}

const ascii = (s: string) => s.normalize('NFKD').replace(/[^\w]/g, '').toLowerCase();

/**
 * Citation keys like "he2016deep": first author family name, year, first meaningful title word.
 * Duplicates get a, b, c suffixes. Keys are returned in input order.
 */
export function citationKeys(refs: Reference[], datasets: DatasetSource[] = []): string[] {
    const stop = new Set(['a', 'an', 'the', 'on', 'of', 'in', 'for', 'and', 'to', 'with']);
    const base = [
        ...refs.map(r => {
            const word = r.title.split(/\s+/).map(ascii).find(w => w && !stop.has(w)) ?? 'untitled';
            return `${ascii(familyName(r.authors[0]?.name ?? '')) || 'anon'}${r.year || 'nd'}${word}`;
        }),
        ...datasets.map(d => `${ascii(d.id.split('/')[0] ?? '') || 'dataset'}${ascii(d.title)}data`),
    ];
    const seen = new Map<string, number>();
    const totals = base.reduce((m, k) => m.set(k, (m.get(k) ?? 0) + 1), new Map<string, number>());
    return base.map(k => {
        if (totals.get(k) === 1) return k;
        const n = seen.get(k) ?? 0;
        seen.set(k, n + 1);
        return `${k}${String.fromCharCode(97 + n)}`;
    });
}

function bibEscape(value: string): string {
    return value.replace(/([&%$#_])/g, '\\$1').replace(/[{}]/g, '');
}

export function toBibTeX(refs: Reference[], datasets: DatasetSource[] = []): string {
    const keys = citationKeys(refs, datasets);
    const entries = refs.map((r, i) => {
        const fields: [string, string | undefined][] = [
            // Double braces keep the title's capitalization in BibTeX styles
            ['title', `{${bibEscape(r.title)}}`],
            ['author', r.authors.map(a => `${familyName(a.name)}, ${givenNames(a.name)}`.replace(/, $/, '')).join(' and ') || undefined],
            ['year', r.year ? String(r.year) : undefined],
            ['journal', r.venue ? bibEscape(r.venue) : undefined],
            ['doi', r.doi],
            ['url', r.doi ? undefined : r.url],
        ];
        const body = fields.filter(([, v]) => v).map(([k, v]) => `  ${k} = {${v}}`).join(',\n');
        return `@article{${keys[i]},\n${body}\n}`;
    });
    const dataEntries = datasets.map((d, j) => {
        const key = keys[refs.length + j];
        return `@misc{${key},\n  title = {{${bibEscape(d.title)}}},\n  author = {${bibEscape(d.id.split('/')[0] ?? 'Hugging Face')}},\n  howpublished = {Hugging Face},\n  note = {Data set},\n  url = {${d.url}}\n}`;
    });
    return [...entries, ...dataEntries].join('\n\n') + '\n';
}

export function toRIS(refs: Reference[], datasets: DatasetSource[] = []): string {
    const records = refs.map(r => [
        'TY  - JOUR',
        `TI  - ${r.title}`,
        ...r.authors.map(a => `AU  - ${familyName(a.name)}, ${givenNames(a.name)}`.replace(/, $/, '')),
        r.year ? `PY  - ${r.year}` : '',
        r.venue ? `T2  - ${r.venue}` : '',
        r.doi ? `DO  - ${r.doi}` : '',
        r.url ? `UR  - ${r.url}` : '',
        'ER  - ',
    ].filter(Boolean).join('\r\n'));
    const dataRecords = datasets.map(d => [
        'TY  - DATA',
        `TI  - ${d.title}`,
        `AU  - ${d.id.split('/')[0] ?? 'Hugging Face'}`,
        'PB  - Hugging Face',
        `UR  - ${d.url}`,
        'ER  - ',
    ].join('\r\n'));
    // RIS records are separated by blank lines and use CRLF line endings
    return [...records, ...dataRecords].join('\r\n\r\n') + '\r\n';
}

export function toCSLJSON(refs: Reference[], datasets: DatasetSource[] = []): string {
    const keys = citationKeys(refs, datasets);
    const items = [
        ...refs.map((r, i) => ({
            id: keys[i],
            type: 'article-journal',
            title: r.title,
            author: r.authors.map(a => ({ family: familyName(a.name), given: givenNames(a.name) })),
            ...(r.year ? { issued: { 'date-parts': [[r.year]] } } : {}),
            ...(r.venue ? { 'container-title': r.venue } : {}),
            ...(r.doi ? { DOI: r.doi } : {}),
            ...(r.url ? { URL: r.url } : {}),
        })),
        ...datasets.map((d, j) => ({
            id: keys[refs.length + j],
            type: 'dataset',
            title: d.title,
            author: [{ literal: d.id.split('/')[0] ?? 'Hugging Face' }],
            publisher: 'Hugging Face',
            URL: d.url,
        })),
    ];
    return JSON.stringify(items, null, 2) + '\n';
}
