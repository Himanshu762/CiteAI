/**
 * Our World in Data (https://ourworldindata.org): curated country-level series behind its
 * charts, CORS-enabled and keyless. Charts suggested by the model are validated through
 * their metadata; values are joined with World Bank region and income group.
 */

import { computeStatistics, loadDelimited, ColumnInfo, DataRow } from '../../../../api/_lib/tabular';
import { worldBankCountries } from './worldbank';
import type { DatasetCandidate, DatasetMeta } from './types';

const GRAPHER = 'https://ourworldindata.org/grapher';
const LOOKBACK_YEARS = 15;

interface ChartInfo {
    slug: string;
    title: string;
    valueColumns: { name: string; title: string; unit?: string }[];
    sources: string;
}

async function validate(slug: string, signal?: AbortSignal): Promise<ChartInfo | null> {
    const clean = slug.trim().toLowerCase().replace(/^.*\/grapher\//, '').replace(/[^a-z0-9-]/g, '');
    if (!clean) return null;
    try {
        const response = await fetch(`${GRAPHER}/${clean}.metadata.json`, { signal });
        if (!response.ok) return null;
        const meta = await response.json() as {
            chart?: { title?: string };
            columns?: Record<string, { titleShort?: string; unit?: string; citationShort?: string; shortName?: string }>;
        };
        const columns = Object.entries(meta.columns ?? {});
        if (columns.length === 0) return null;
        return {
            slug: clean,
            title: meta.chart?.title ?? clean,
            valueColumns: columns.map(([key, c]) => ({ name: c.shortName ?? key, title: c.titleShort ?? key, unit: c.unit })),
            sources: [...new Set(columns.map(([, c]) => c.citationShort).filter(Boolean))].join('; '),
        };
    } catch {
        return null;
    }
}

/** Latest value per country (within the lookback window) for each value column of one chart */
async function latestByCountry(chart: ChartInfo, signal?: AbortSignal): Promise<{ values: Map<string, DataRow>; years: number[] }> {
    const response = await fetch(`${GRAPHER}/${chart.slug}.csv?v=1&csvType=full&useColumnShortNames=true`, { signal });
    if (!response.ok) throw new Error(`Our World in Data chart ${chart.slug} unavailable`);
    const { records } = loadDelimited(await response.text());
    const minYear = new Date().getFullYear() - LOOKBACK_YEARS;
    const valueNames = chart.valueColumns.map(c => c.name).filter(n => records[0] && n in records[0]);

    const latest = new Map<string, { year: number; row: DataRow }>();
    for (const r of records) {
        const code = String(r.code ?? '');
        const year = Number(r.year);
        // Three-letter ISO codes only; OWID_ codes are regions and income groups
        if (!/^[A-Z]{3}$/.test(code) || !Number.isFinite(year) || year < minYear) continue;
        if (!valueNames.some(n => typeof r[n] === 'number')) continue;
        const current = latest.get(code);
        if (!current || year > current.year) latest.set(code, { year, row: r });
    }
    const values = new Map<string, DataRow>();
    const years: number[] = [];
    for (const [code, { year, row }] of latest) {
        values.set(code, Object.fromEntries(valueNames.map(n => [n, row[n] ?? null])));
        years.push(year);
    }
    return { values, years };
}

export async function owidCandidate(slugs: string[], signal?: AbortSignal): Promise<DatasetCandidate | null> {
    const charts = (await Promise.all(slugs.slice(0, 4).map(s => validate(s, signal))))
        .filter((c): c is ChartInfo => c !== null)
        .filter((c, i, all) => all.findIndex(o => o.slug === c.slug) === i)
        .slice(0, 3);
    if (charts.length === 0) return null;

    // Value column names can repeat across charts; prefix later duplicates with the chart slug
    const used = new Set<string>();
    const valueColumns = charts.flatMap(chart => chart.valueColumns.map(c => {
        const name = used.has(c.name) ? `${chart.slug.replace(/-/g, '_')}_${c.name}` : c.name;
        used.add(name);
        return { chart: chart.slug, source: c.name, name, title: c.title, unit: c.unit };
    }));

    const columns: ColumnInfo[] = [
        { name: 'country', kind: 'other' },
        { name: 'region', kind: 'categorical' },
        { name: 'income_group', kind: 'categorical' },
        ...valueColumns.map(c => ({ name: c.name, kind: 'numeric' as const })),
    ];
    const title = charts.map(c => c.title).join('; ');
    const url = `${GRAPHER}/${charts[0].slug}`;
    const meta: DatasetMeta = {
        source: 'owid',
        id: charts.map(c => c.slug).join(','),
        title,
        url,
        description: `Country-level series: ${valueColumns.map(c => `${c.name} = ${c.title}${c.unit ? ` (${c.unit})` : ''}`).join('; ')}.`,
        totalRows: 200,
        columns,
        citation: { creator: 'Our World in Data', title, year: new Date().getFullYear(), url },
    };

    return {
        meta,
        popularity: 0,
        load: async (_maxRows, signal2) => {
            const [countries, ...perChart] = await Promise.all([worldBankCountries(signal2), ...charts.map(c => latestByCountry(c, signal2))]);
            const rows: DataRow[] = [];
            for (const [iso3, info] of countries) {
                const row: DataRow = { country: info.name, region: info.region, income_group: info.incomeGroup };
                let any = false;
                for (const vc of valueColumns) {
                    const k = charts.findIndex(c => c.slug === vc.chart);
                    const v = perChart[k].values.get(iso3)?.[vc.source];
                    row[vc.name] = typeof v === 'number' ? v : null;
                    if (typeof v === 'number') any = true;
                }
                if (any) rows.push(row);
            }
            const years = perChart.flatMap(p => p.years).sort((a, b) => a - b);
            const notes = [
                `Each country's most recent value between ${years[0]} and ${years[years.length - 1]} was used.`,
                'Data are country-level, so associations describe countries, not individuals.',
                ...charts.filter(c => c.sources).map(c => `Our World in Data compiles "${c.title}" from: ${c.sources}.`),
            ];
            const loadedMeta = { ...meta, totalRows: rows.length, notes };
            return { meta: loadedMeta, rows, fullStatistics: computeStatistics(rows, columns) };
        },
    };
}
