/**
 * OpenML (https://www.openml.org): curated tabular datasets, CORS-enabled and keyless.
 * OpenML has no free-text search API, so names suggested by the model are looked up and
 * only datasets that exist are used.
 */

import { computeStatistics, loadDelimited, sampleEvenly, ColumnInfo, ColumnKind } from '../../../../api/_lib/tabular';
import type { DatasetCandidate, DatasetMeta } from './types';

const API = 'https://www.openml.org/api/v1/json';
const MAX_INSTANCES = 200_000;
const MAX_FEATURES = 300;

interface OpenMLListing {
    did: number;
    name: string;
    file_id: number;
    status: string;
    quality?: { name: string; value: string }[];
}

async function getJSON<T>(url: string, signal?: AbortSignal): Promise<T | null> {
    try {
        const response = await fetch(url, { signal });
        return response.ok ? ((await response.json()) as T) : null;
    } catch {
        return null;
    }
}

const quality = (d: OpenMLListing, name: string) => Number(d.quality?.find(q => q.name === name)?.value ?? NaN);

const FEATURE_KIND: Record<string, ColumnKind> = { numeric: 'numeric', nominal: 'categorical', string: 'text' };

async function describe(listing: OpenMLListing, signal?: AbortSignal): Promise<DatasetCandidate | null> {
    const [features, details] = await Promise.all([
        getJSON<{ data_features: { feature: { name: string; data_type: string; is_ignore: string; is_row_identifier: string }[] } }>(`${API}/data/features/${listing.did}`, signal),
        getJSON<{ data_set_description: { name: string; description?: string; upload_date?: string; creator?: string | string[]; collection_date?: string; licence?: string } }>(`${API}/data/${listing.did}`, signal),
    ]);
    if (!features || !details) return null;

    const columns: ColumnInfo[] = features.data_features.feature.map(f => ({
        name: f.name,
        kind: f.is_ignore === 'true' || f.is_row_identifier === 'true' ? 'other' : FEATURE_KIND[f.data_type] ?? 'other',
    }));
    if (columns.filter(c => c.kind === 'numeric' || c.kind === 'categorical').length < 2) return null;

    const d = details.data_set_description;
    const creator = Array.isArray(d.creator) ? d.creator.join(', ') : d.creator;
    const year = Number((d.collection_date ?? d.upload_date ?? '').slice(0, 4)) || undefined;
    const url = `https://www.openml.org/d/${listing.did}`;
    const totalRows = quality(listing, 'NumberOfInstances');

    const meta: DatasetMeta = {
        source: 'openml',
        id: String(listing.did),
        title: d.name,
        url,
        description: (d.description ?? '').replace(/\s+/g, ' ').slice(0, 500),
        totalRows: Number.isFinite(totalRows) ? totalRows : 0,
        columns,
        citation: { creator: creator || 'OpenML', title: d.name, publisher: 'OpenML', year, url },
    };

    return {
        meta,
        popularity: 0,
        load: async (maxRows, signal2) => {
            const response = await fetch(`https://www.openml.org/data/v1/get_csv/${listing.file_id}`, { signal: signal2 });
            if (!response.ok) throw new Error(`OpenML download failed (HTTP ${response.status})`);
            const { records, columns: inferred } = loadDelimited(await response.text());
            // OpenML's own feature types win over inference where names match
            const known = new Map(columns.map(c => [c.name, c.kind]));
            const merged = inferred.map(c => ({ ...c, kind: known.get(c.name) ?? c.kind }));
            const loadedMeta = { ...meta, columns: merged, totalRows: records.length };
            return { meta: loadedMeta, rows: sampleEvenly(records, maxRows), fullStatistics: computeStatistics(records, merged) };
        },
    };
}

/** Look up suggested dataset names; datasets that do not exist are dropped */
export async function openmlCandidates(names: string[], signal?: AbortSignal): Promise<DatasetCandidate[]> {
    const listings = await Promise.all(names.slice(0, 5).map(name =>
        getJSON<{ data: { dataset: OpenMLListing[] } }>(`${API}/data/list/data_name/${encodeURIComponent(name)}/limit/5/status/active`, signal)));

    const seen = new Set<number>();
    const picks: OpenMLListing[] = [];
    for (const result of listings) {
        // Several versions can share a name; the most recent active one is listed last
        const versions = (result?.data.dataset ?? []).filter(d =>
            quality(d, 'NumberOfInstances') <= MAX_INSTANCES && quality(d, 'NumberOfFeatures') <= MAX_FEATURES);
        const latest = versions[versions.length - 1];
        if (latest && !seen.has(latest.did)) {
            seen.add(latest.did);
            picks.push(latest);
        }
    }
    const described = await Promise.all(picks.slice(0, 3).map(p => describe(p, signal)));
    return described.filter((c): c is DatasetCandidate => c !== null);
}
