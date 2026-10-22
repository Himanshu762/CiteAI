/**
 * World Bank World Development Indicators (https://data.worldbank.org): country-level
 * indicators, CORS-enabled and keyless. Builds one row per country with its most recent
 * value for each indicator, plus region and income group for group comparisons.
 */

import { computeStatistics, ColumnInfo, DataRow } from '../../../../api/_lib/tabular';
import type { DatasetCandidate, DatasetMeta } from './types';

const API = 'https://api.worldbank.org/v2';
const LOOKBACK_YEARS = 10;

export interface CountryInfo {
    name: string;
    region: string;
    incomeGroup: string;
}

let countriesCache: Promise<Map<string, CountryInfo>> | null = null;

/** Real countries keyed by ISO3, without aggregates such as "World" or "High income" */
export function worldBankCountries(signal?: AbortSignal): Promise<Map<string, CountryInfo>> {
    countriesCache ??= (async () => {
        const response = await fetch(`${API}/country?format=json&per_page=400`, { signal });
        if (!response.ok) throw new Error('World Bank country list unavailable');
        const [, list] = (await response.json()) as [unknown, { id: string; name: string; region: { value: string }; incomeLevel: { value: string } }[]];
        const map = new Map<string, CountryInfo>();
        for (const c of list ?? []) {
            if (c.region.value.trim() === 'Aggregates') continue;
            map.set(c.id, { name: c.name, region: c.region.value.trim(), incomeGroup: c.incomeLevel.value.trim() });
        }
        return map;
    })().catch(error => {
        countriesCache = null;
        throw error;
    });
    return countriesCache;
}

export function columnName(label: string): string {
    return label.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 40) || 'indicator';
}

interface Indicator {
    code: string;
    column: string;
    name: string;
}

async function validate(code: string, label: string, signal?: AbortSignal): Promise<Indicator | null> {
    try {
        const response = await fetch(`${API}/indicator/${encodeURIComponent(code)}?format=json`, { signal });
        if (!response.ok) return null;
        const body = await response.json();
        // Unknown codes come back as [{ message: [...] }]
        const info = Array.isArray(body) && Array.isArray(body[1]) ? body[1][0] : null;
        return info?.id ? { code: info.id, column: columnName(label || info.name), name: info.name } : null;
    } catch {
        return null;
    }
}

/** Most recent non-empty value per country within the lookback window */
async function latestValues(code: string, signal?: AbortSignal): Promise<Map<string, { value: number; year: number }>> {
    const end = new Date().getFullYear();
    const response = await fetch(`${API}/country/all/indicator/${encodeURIComponent(code)}?format=json&date=${end - LOOKBACK_YEARS}:${end}&per_page=20000`, { signal });
    if (!response.ok) throw new Error(`World Bank indicator ${code} unavailable`);
    const [, entries] = (await response.json()) as [unknown, { countryiso3code: string; date: string; value: number | null }[] | null];
    const latest = new Map<string, { value: number; year: number }>();
    for (const e of entries ?? []) {
        if (e.value === null || !e.countryiso3code) continue;
        const year = Number(e.date);
        const current = latest.get(e.countryiso3code);
        if (!current || year > current.year) latest.set(e.countryiso3code, { value: e.value, year });
    }
    return latest;
}

/**
 * One candidate combining the valid suggested indicators (needs at least one)
 */
export async function worldBankCandidate(
    suggestions: { code: string; label: string }[],
    signal?: AbortSignal
): Promise<DatasetCandidate | null> {
    const validated = (await Promise.all(suggestions.slice(0, 5).map(s => validate(s.code, s.label, signal))))
        .filter((i): i is Indicator => i !== null);
    // Column names must be unique
    const indicators = validated.filter((ind, i) => validated.findIndex(o => o.column === ind.column) === i);
    if (indicators.length === 0) return null;

    const columns: ColumnInfo[] = [
        { name: 'country', kind: 'other' },
        { name: 'region', kind: 'categorical' },
        { name: 'income_group', kind: 'categorical' },
        ...indicators.map(i => ({ name: i.column, kind: 'numeric' as const })),
    ];
    const url = `https://data.worldbank.org/indicator/${indicators[0].code}`;
    const meta: DatasetMeta = {
        source: 'worldbank',
        id: indicators.map(i => i.code).join(','),
        title: `World Development Indicators: ${indicators.map(i => i.name).join('; ')}`,
        url,
        description: `Country-level indicators: ${indicators.map(i => `${i.column} = ${i.name} (${i.code})`).join('; ')}. Region and income group from World Bank classifications.`,
        totalRows: 200,
        columns,
        citation: { creator: 'World Bank', title: 'World Development Indicators', year: new Date().getFullYear(), url: 'https://databank.worldbank.org/source/world-development-indicators' },
    };

    return {
        meta,
        popularity: 0,
        load: async (_maxRows, signal2) => {
            const [countries, ...series] = await Promise.all([worldBankCountries(signal2), ...indicators.map(i => latestValues(i.code, signal2))]);
            const years: number[] = [];
            const rows: DataRow[] = [];
            for (const [iso3, info] of countries) {
                const row: DataRow = { country: info.name, region: info.region, income_group: info.incomeGroup };
                let any = false;
                indicators.forEach((ind, k) => {
                    const v = series[k].get(iso3);
                    row[ind.column] = v ? v.value : null;
                    if (v) { any = true; years.push(v.year); }
                });
                if (any) rows.push(row);
            }
            years.sort((a, b) => a - b);
            const notes = [
                `Each country's most recent value between ${years[0]} and ${years[years.length - 1]} was used (median year ${years[Math.floor(years.length / 2)]}).`,
                'Data are country-level averages, so associations describe countries, not individuals.',
            ];
            const loadedMeta = { ...meta, totalRows: rows.length, notes };
            return { meta: loadedMeta, rows, fullStatistics: computeStatistics(rows, columns) };
        },
    };
}
