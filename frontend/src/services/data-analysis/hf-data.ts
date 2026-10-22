/**
 * Hugging Face Dataset Viewer API access (keyless, CORS-friendly, public datasets only).
 * https://huggingface.co/docs/dataset-viewer
 */

const BASE = 'https://datasets-server.huggingface.co';
const ROWS_PER_REQUEST = 100; // API maximum
const IDENTIFIER_COLUMN = /^(id|_?index|idx|row_?(id|num(ber)?)|unnamed:?\s*\d*|uuid|.*_id)$/i;

export type { ColumnKind, ColumnInfo, ColumnStatistics, FullStatistics } from '../../../api/_lib/tabular';
import type { ColumnInfo, FullStatistics } from '../../../api/_lib/tabular';

export interface DatasetTable {
    datasetId: string;
    config: string;
    split: string;
    columns: ColumnInfo[];
    totalRows: number;
}


async function getJSON<T>(path: string, params: Record<string, string | number>, signal?: AbortSignal): Promise<T> {
    const query = new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)]));
    const response = await fetch(`${BASE}/${path}?${query}`, { signal });
    if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || `Dataset viewer ${path} failed (HTTP ${response.status})`);
    }
    return response.json();
}

interface FeatureType {
    _type?: string;
    dtype?: string;
    names?: string[];
}

export function classifyFeature(type: FeatureType): Omit<ColumnInfo, 'name'> {
    if (type._type === 'ClassLabel') return { kind: 'categorical', labels: type.names };
    if (type._type !== 'Value' || !type.dtype) return { kind: 'other' };
    if (/^(u?int|float|double|half)/.test(type.dtype)) return { kind: 'numeric' };
    if (type.dtype === 'bool') return { kind: 'categorical' };
    if (type.dtype === 'string' || type.dtype === 'large_string') return { kind: 'text' };
    return { kind: 'other' };
}

/** Whether the viewer can serve rows and statistics for this dataset */
export async function isAnalyzable(datasetId: string, signal?: AbortSignal): Promise<boolean> {
    try {
        const status = await getJSON<{ viewer?: boolean; statistics?: boolean }>('is-valid', { dataset: datasetId }, signal);
        return Boolean(status.viewer && status.statistics);
    } catch {
        return false;
    }
}

/**
 * Pick a split (preferring train) and read its columns from the first rows
 */
export async function describeDataset(datasetId: string, signal?: AbortSignal): Promise<DatasetTable & { preview: Record<string, unknown>[] }> {
    const { splits } = await getJSON<{ splits: { config: string; split: string }[] }>('splits', { dataset: datasetId }, signal);
    if (!splits?.length) throw new Error('Dataset has no readable splits');
    const chosen = splits.find(s => s.split === 'train') ?? splits[0];

    const first = await getJSON<{
        features: { name: string; type: FeatureType }[];
        rows: { row: Record<string, unknown> }[];
    }>('first-rows', { dataset: datasetId, config: chosen.config, split: chosen.split }, signal);

    const columns = first.features.map(f => ({
        name: f.name,
        // Identifier columns look numeric but are meaningless to test
        ...(IDENTIFIER_COLUMN.test(f.name) ? { kind: 'other' as const } : classifyFeature(f.type)),
    }));

    // Short strings with few distinct values are categories, not free text
    for (const col of columns) {
        if (col.kind !== 'text') continue;
        const values = first.rows.map(r => r.row[col.name]).filter(v => typeof v === 'string') as string[];
        const distinct = new Set(values);
        const avgLength = values.reduce((sum, v) => sum + v.length, 0) / Math.max(values.length, 1);
        if (values.length > 0 && distinct.size <= Math.max(20, values.length / 5) && avgLength < 40) {
            col.kind = 'categorical';
        }
    }

    const size = await getJSON<{ size?: { splits?: { split: string; config: string; num_rows: number }[] } }>(
        'size', { dataset: datasetId }, signal
    ).catch(() => ({ size: undefined }));
    const splitSize = size.size?.splits?.find(s => s.split === chosen.split && s.config === chosen.config)?.num_rows;

    return {
        datasetId,
        config: chosen.config,
        split: chosen.split,
        columns,
        totalRows: splitSize ?? first.rows.length,
        preview: first.rows.slice(0, 5).map(r => r.row),
    };
}

export async function getFullStatistics(table: DatasetTable, signal?: AbortSignal): Promise<FullStatistics | null> {
    try {
        const data = await getJSON<{
            num_examples: number;
            partial: boolean;
            statistics: { column_name: string; column_type: string; column_statistics: Record<string, unknown> }[];
        }>('statistics', { dataset: table.datasetId, config: table.config, split: table.split }, signal);

        return {
            numExamples: data.num_examples,
            partial: data.partial,
            columns: data.statistics.map(s => {
                const cs = s.column_statistics as Record<string, number | Record<string, number>>;
                return {
                    name: s.column_name,
                    columnType: s.column_type,
                    nanCount: (cs.nan_count as number) ?? 0,
                    min: cs.min as number | undefined,
                    max: cs.max as number | undefined,
                    mean: cs.mean as number | undefined,
                    median: cs.median as number | undefined,
                    std: cs.std as number | undefined,
                    frequencies: cs.frequencies as Record<string, number> | undefined,
                };
            }),
        };
    } catch {
        return null;
    }
}

/**
 * Fetch up to `maxRows` rows spread evenly across the split, decoding ClassLabel indexes to names.
 * Even spacing avoids analyzing only the first block of a file sorted by some column.
 */
export async function fetchRows(
    table: DatasetTable,
    maxRows: number,
    signal?: AbortSignal
): Promise<Record<string, unknown>[]> {
    const total = Math.max(table.totalRows, 1);
    const pages = Math.max(1, Math.min(Math.ceil(maxRows / ROWS_PER_REQUEST), Math.ceil(total / ROWS_PER_REQUEST)));
    const stride = Math.max(ROWS_PER_REQUEST, Math.floor(total / pages));
    const offsets = Array.from({ length: pages }, (_, i) => i * stride).filter(o => o < total);

    const rows: Record<string, unknown>[] = [];
    const CONCURRENCY = 4;
    for (let i = 0; i < offsets.length; i += CONCURRENCY) {
        const batch = await Promise.all(offsets.slice(i, i + CONCURRENCY).map(offset =>
            getJSON<{ rows: { row: Record<string, unknown> }[] }>('rows', {
                dataset: table.datasetId, config: table.config, split: table.split, offset, length: ROWS_PER_REQUEST,
            }, signal).then(d => d.rows.map(r => r.row)).catch(() => [])
        ));
        rows.push(...batch.flat());
    }

    const labelled = table.columns.filter(c => c.labels);
    if (labelled.length) {
        for (const row of rows) {
            for (const col of labelled) {
                const v = row[col.name];
                if (typeof v === 'number' && col.labels![v] !== undefined) row[col.name] = col.labels![v];
            }
        }
    }
    return rows.slice(0, maxRows);
}
