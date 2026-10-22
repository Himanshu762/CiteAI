import { searchHFDatasets } from '../../huggingface-api';
import { describeDataset, fetchRows, getFullStatistics, isAnalyzable, DatasetTable } from '../hf-data';
import type { DatasetCandidate, DatasetMeta } from './types';

const MAX_CHECKED = 12;
const MAX_DESCRIBED = 4;

function toCandidate(info: { id: string; title: string; description: string; downloads: number }, table: DatasetTable): DatasetCandidate {
    const owner = info.id.includes('/') ? info.id.split('/')[0] : 'Hugging Face';
    const meta: DatasetMeta = {
        source: 'huggingface',
        id: info.id,
        title: info.title,
        url: `https://huggingface.co/datasets/${info.id}`,
        description: info.description,
        totalRows: table.totalRows,
        columns: table.columns,
        citation: { creator: owner, title: info.title, publisher: 'Hugging Face', url: `https://huggingface.co/datasets/${info.id}` },
        config: table.config,
        split: table.split,
    };
    return {
        meta,
        popularity: info.downloads,
        load: async (maxRows, signal) => {
            const [rows, fullStatistics] = await Promise.all([fetchRows(table, maxRows, signal), getFullStatistics(table, signal)]);
            return { meta, rows, fullStatistics };
        },
    };
}

const usable = (table: DatasetTable) =>
    table.columns.filter(c => c.kind === 'numeric' || c.kind === 'categorical').length >= 2 && table.totalRows >= 20;

/** Search Hugging Face and keep datasets the viewer can read that have testable columns */
export async function huggingFaceCandidates(queries: string[], signal?: AbortSignal): Promise<DatasetCandidate[]> {
    const seen = new Map<string, { id: string; title: string; description: string; downloads: number }>();
    for (const query of queries) {
        try {
            for (const ds of await searchHFDatasets({ query, limit: 10 })) {
                if (!seen.has(ds.id)) seen.set(ds.id, ds);
            }
        } catch (error) {
            console.warn('Hugging Face search failed for', query, error);
        }
    }

    const ranked = [...seen.values()].sort((a, b) => b.downloads - a.downloads).slice(0, MAX_CHECKED);
    const readable = (await Promise.all(ranked.map(async ds => ((await isAnalyzable(ds.id, signal)) ? ds : null))))
        .filter((ds): ds is NonNullable<typeof ds> => ds !== null)
        .slice(0, MAX_DESCRIBED);

    const described = await Promise.all(readable.map(async (ds): Promise<DatasetCandidate | null> => {
        try {
            const table = await describeDataset(ds.id, signal);
            return usable(table) ? toCandidate(ds, table) : null;
        } catch {
            return null;
        }
    }));
    return described.filter((c): c is DatasetCandidate => c !== null);
}

/** A specific Hugging Face dataset the user picked */
export async function huggingFaceCandidate(
    dataset: { id: string; title: string; description: string },
    signal?: AbortSignal
): Promise<DatasetCandidate> {
    const table = await describeDataset(dataset.id, signal);
    return toCandidate({ ...dataset, downloads: 0 }, table);
}
