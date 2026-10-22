/**
 * Common shape for every data source, so uploads, Kaggle, OpenML, World Bank and
 * Our World in Data go through the same analysis, report and citation path as Hugging Face.
 */

import type { ColumnInfo, DataRow, FullStatistics } from '../../../../api/_lib/tabular';

export type DataSourceKind = 'huggingface' | 'kaggle' | 'openml' | 'worldbank' | 'owid' | 'upload';

export const SOURCE_LABELS: Record<DataSourceKind, string> = {
    huggingface: 'Hugging Face',
    kaggle: 'Kaggle',
    openml: 'OpenML',
    worldbank: 'World Bank',
    owid: 'Our World in Data',
    upload: 'Uploaded file',
};

/** What a reference-list entry needs; ownData means the author collected it (not cited) */
export interface DatasetCitation {
    creator: string;
    title: string;
    publisher?: string;
    year?: number;
    url?: string;
    ownData?: boolean;
}

export interface DatasetMeta {
    source: DataSourceKind;
    id: string;
    title: string;
    url: string;
    description?: string;
    totalRows: number;
    columns: ColumnInfo[]; // Empty until loaded for sources that only reveal columns on download (Kaggle)
    citation: DatasetCitation;
    notes?: string[]; // Source-specific caveats, reported as limitations
    config?: string;
    split?: string;
}

export interface LoadedDataset {
    meta: DatasetMeta;
    rows: DataRow[];
    fullStatistics: FullStatistics | null;
}

export interface DatasetCandidate {
    meta: DatasetMeta;
    popularity: number;
    load: (maxRows: number, signal?: AbortSignal) => Promise<LoadedDataset>;
}
