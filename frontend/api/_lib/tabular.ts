/**
 * Tabular data helpers shared by the browser (uploads, OpenML, World Bank, OWID) and the
 * Kaggle server function: CSV parsing, column typing, whole-dataset statistics, sampling.
 * No imports, so it runs unchanged in Node and in the browser.
 */

export type ColumnKind = 'numeric' | 'categorical' | 'text' | 'other';

export interface ColumnInfo {
    name: string;
    kind: ColumnKind;
    labels?: string[]; // Hugging Face ClassLabel names: row values are indexes into this list
}

/** Column statistics over the whole dataset (not a sample) */
export interface ColumnStatistics {
    name: string;
    columnType: string;
    nanCount: number;
    min?: number;
    max?: number;
    mean?: number;
    median?: number;
    std?: number;
    frequencies?: Record<string, number>;
}

export interface FullStatistics {
    numExamples: number;
    partial: boolean;
    columns: ColumnStatistics[];
}

export type Cell = string | number | boolean | null;
export type DataRow = Record<string, Cell>;

// --- CSV --------------------------------------------------------------------------

function detectDelimiter(sample: string): string {
    const firstLine = sample.split(/\r?\n/, 1)[0] ?? '';
    const counts = [',', ';', '\t', '|'].map(d => ({ d, n: firstLine.split(d).length - 1 }));
    counts.sort((a, b) => b.n - a.n);
    return counts[0].n > 0 ? counts[0].d : ',';
}

/**
 * RFC 4180 CSV parser: quoted fields, escaped quotes, newlines inside quotes, BOM.
 * The delimiter is detected from the header line unless given.
 */
export function parseCSV(text: string, delimiter?: string): { headers: string[]; rows: string[][] } {
    const src = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
    const d = delimiter ?? detectDelimiter(src.slice(0, 2000));
    const rows: string[][] = [];
    let row: string[] = [];
    let field = '';
    let quoted = false;

    for (let i = 0; i < src.length; i++) {
        const c = src[i];
        if (quoted) {
            if (c === '"') {
                if (src[i + 1] === '"') { field += '"'; i++; } else quoted = false;
            } else field += c;
            continue;
        }
        if (c === '"' && field === '') quoted = true;
        else if (c === d) { row.push(field); field = ''; }
        else if (c === '\n' || c === '\r') {
            if (c === '\r' && src[i + 1] === '\n') i++;
            row.push(field); field = '';
            if (row.some(f => f !== '')) rows.push(row);
            row = [];
        } else field += c;
    }
    row.push(field);
    if (row.some(f => f !== '')) rows.push(row);

    const [header = [], ...body] = rows;
    // Unnamed or duplicate headers get unique names so every column can be addressed
    const seen = new Map<string, number>();
    const headers = header.map((h, i) => {
        const base = h.trim() || `column_${i + 1}`;
        const n = seen.get(base) ?? 0;
        seen.set(base, n + 1);
        return n === 0 ? base : `${base}_${n + 1}`;
    });
    return { headers, rows: body };
}

const MISSING = new Set(['', 'na', 'n/a', 'nan', 'null', 'none', '-', '..', '?']);

export function toCell(raw: string): Cell {
    const v = raw.trim();
    if (MISSING.has(v.toLowerCase())) return null;
    // Plain numbers only; "1,234" style thousands separators are accepted, dates and codes are not
    const numeric = v.replace(/^(-?\d{1,3}(?:,\d{3})+)(\.\d+)?$/, (_, int: string, dec = '') => int.replace(/,/g, '') + dec);
    if (/^-?(\d+\.?\d*|\.\d+)(e[-+]?\d+)?$/i.test(numeric)) return Number(numeric);
    if (/^(true|false)$/i.test(v)) return v.toLowerCase() === 'true';
    return v;
}

export function toRecords(headers: string[], rows: (string | Cell)[][]): DataRow[] {
    return rows.map(r => {
        const rec: DataRow = {};
        headers.forEach((h, i) => {
            const v = r[i];
            rec[h] = typeof v === 'string' ? toCell(v) : v ?? null;
        });
        return rec;
    });
}

// --- Column typing -------------------------------------------------------------------

const IDENTIFIER_COLUMN = /^(id|_?index|idx|row_?(id|num(ber)?)|unnamed:?\s*\d*|uuid|.*_id|column_\d+)$/i;

export function inferColumns(records: DataRow[], headers?: string[]): ColumnInfo[] {
    const names = headers ?? Object.keys(records[0] ?? {});
    const sample = records.length > 5000 ? records.filter((_, i) => i % Math.ceil(records.length / 5000) === 0) : records;
    return names.map(name => {
        if (IDENTIFIER_COLUMN.test(name)) return { name, kind: 'other' as const };
        const values = sample.map(r => r[name]).filter(v => v !== null && v !== undefined);
        if (values.length === 0) return { name, kind: 'other' as const };
        const numeric = values.filter(v => typeof v === 'number').length;
        if (numeric / values.length >= 0.9) {
            // Every value unique and integer-like over many rows: probably a code, not a measurement
            const distinct = new Set(values).size;
            const integers = values.every(v => typeof v !== 'number' || Number.isInteger(v));
            if (integers && distinct === values.length && values.length > 50 && /code|number|no$/i.test(name)) {
                return { name, kind: 'other' as const };
            }
            return { name, kind: 'numeric' as const };
        }
        const strings = values.map(String);
        const distinct = new Set(strings).size;
        const avgLength = strings.reduce((n, s) => n + s.length, 0) / strings.length;
        if (distinct <= Math.max(20, strings.length / 20) && avgLength < 40) return { name, kind: 'categorical' as const };
        return { name, kind: 'text' as const };
    });
}

// --- Whole-dataset statistics ----------------------------------------------------------

function quantileSorted(sorted: number[], q: number): number {
    const pos = (sorted.length - 1) * q;
    const lo = Math.floor(pos);
    const hi = Math.ceil(pos);
    return sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo);
}

export function computeStatistics(records: DataRow[], columns: ColumnInfo[]): FullStatistics {
    return {
        numExamples: records.length,
        partial: false,
        columns: columns.filter(c => c.kind === 'numeric' || c.kind === 'categorical').map(col => {
            const raw = records.map(r => r[col.name]);
            const nanCount = raw.filter(v => v === null || v === undefined).length;
            if (col.kind === 'numeric') {
                const values = raw.filter((v): v is number => typeof v === 'number' && Number.isFinite(v)).sort((a, b) => a - b);
                if (values.length === 0) return { name: col.name, columnType: 'float', nanCount };
                const mean = values.reduce((s, v) => s + v, 0) / values.length;
                const variance = values.length > 1 ? values.reduce((s, v) => s + (v - mean) ** 2, 0) / (values.length - 1) : 0;
                return {
                    name: col.name, columnType: 'float', nanCount: raw.length - values.length,
                    min: values[0], max: values[values.length - 1], mean, median: quantileSorted(values, 0.5), std: Math.sqrt(variance),
                };
            }
            const frequencies: Record<string, number> = {};
            for (const v of raw) if (v !== null && v !== undefined) frequencies[String(v)] = (frequencies[String(v)] ?? 0) + 1;
            // Keep the 50 most common categories so payloads stay small
            const top = Object.entries(frequencies).sort((a, b) => b[1] - a[1]).slice(0, 50);
            return { name: col.name, columnType: 'string_label', nanCount, frequencies: Object.fromEntries(top) };
        }),
    };
}

/** Up to `max` rows spread evenly across the data, so sorted files are not analyzed from one end only */
export function sampleEvenly<T>(rows: T[], max: number): T[] {
    if (rows.length <= max) return rows;
    const step = rows.length / max;
    return Array.from({ length: max }, (_, i) => rows[Math.floor(i * step)]);
}

/** Parse delimited text into typed records with inferred columns */
export function loadDelimited(text: string): { records: DataRow[]; columns: ColumnInfo[] } {
    const { headers, rows } = parseCSV(text);
    const records = toRecords(headers, rows);
    return { records, columns: inferColumns(records, headers) };
}
