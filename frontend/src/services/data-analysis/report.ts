/**
 * Deterministic analysis runner: turns a validated plan plus real rows into report tables,
 * APA-style statistics and plain-language findings. No language model touches the numbers.
 */

import type { ColumnInfo, FullStatistics } from '../../../api/_lib/tabular';
import { DataSourceKind, DatasetCitation, DatasetMeta, SOURCE_LABELS } from './sources/types';
import {
    pearson, linearRegression, welchTTest, oneWayAnova, chiSquareIndependence,
    mean, sd, median, formatP, pCell, fmt, fmtBounded,
} from './stats';

export interface ReportTable {
    caption: string;
    headers: string[];
    rows: string[][];
    note?: string;
}

export type ChartSpec =
    | { kind: 'scatter'; xLabel: string; yLabel: string; points: { x: number; y: number }[] }
    | { kind: 'bar'; xLabel: string; yLabel: string; categories: string[]; values: number[] };

export type PlannedAnalysis =
    | { type: 'correlation'; x: string; y: string }
    | { type: 'regression'; predictor: string; outcome: string }
    | { type: 'group_comparison'; group: string; outcome: string }
    | { type: 'association'; a: string; b: string };

export interface AnalysisResult {
    id: string;
    type: PlannedAnalysis['type'];
    title: string;
    variables: string[];
    n: number;
    statistic: string; // e.g. "r(148) = .87, p < .001"
    finding: string;   // Plain-language sentence built from the computed values
    significant: boolean;
    table: ReportTable;
    chart?: ChartSpec;
}

export interface AnalysisReport {
    id: string;
    topic: string;
    createdAt: string;
    dataset: {
        source?: DataSourceKind; // Absent on reports saved before other sources existed (Hugging Face)
        id: string;
        title: string;
        url: string;
        totalRows: number;
        citation?: DatasetCitation;
        config?: string;
        split?: string;
    };
    rationale: string;
    sampleSize: number;
    statisticsScope: 'full' | 'partial' | 'sample';
    descriptives: ReportTable[];
    results: AnalysisResult[];
    limitations: string[];
    includeInPaper: boolean;
}

const ALPHA = 0.05;
const MAX_LEVELS = 8;
const MIN_PAIRS = 10;
const MIN_GROUP_SIZE = 3;
const MAX_CHART_POINTS = 300;

/**
 * Keep only analyses whose columns exist and have the right kinds
 */
export function validatePlan(plan: unknown[], columns: ColumnInfo[], maxAnalyses = 4): PlannedAnalysis[] {
    const kind = (name: unknown) => columns.find(c => c.name === name)?.kind;
    const valid: PlannedAnalysis[] = [];
    const seen = new Set<string>();

    for (const raw of plan) {
        const item = raw as Record<string, unknown>;
        let analysis: PlannedAnalysis | null = null;
        if (item?.type === 'correlation' && kind(item.x) === 'numeric' && kind(item.y) === 'numeric' && item.x !== item.y) {
            analysis = { type: 'correlation', x: item.x as string, y: item.y as string };
        } else if (item?.type === 'regression' && kind(item.predictor) === 'numeric' && kind(item.outcome) === 'numeric' && item.predictor !== item.outcome) {
            analysis = { type: 'regression', predictor: item.predictor as string, outcome: item.outcome as string };
        } else if (item?.type === 'group_comparison' && kind(item.group) === 'categorical' && kind(item.outcome) === 'numeric') {
            analysis = { type: 'group_comparison', group: item.group as string, outcome: item.outcome as string };
        } else if (item?.type === 'association' && kind(item.a) === 'categorical' && kind(item.b) === 'categorical' && item.a !== item.b) {
            analysis = { type: 'association', a: item.a as string, b: item.b as string };
        }
        if (!analysis) continue;
        const key = JSON.stringify(analysis);
        if (seen.has(key)) continue;
        seen.add(key);
        valid.push(analysis);
        if (valid.length >= maxAnalyses) break;
    }
    return valid;
}

function toNumber(v: unknown): number | null {
    if (typeof v === 'number') return Number.isFinite(v) ? v : null;
    if (typeof v === 'boolean') return v ? 1 : 0;
    if (typeof v === 'string' && v.trim() !== '') {
        const n = Number(v);
        return Number.isFinite(n) ? n : null;
    }
    return null;
}

function toCategory(v: unknown): string | null {
    if (v === null || v === undefined || v === '') return null;
    return String(v);
}

function numericPairs(rows: Record<string, unknown>[], a: string, b: string): { x: number[]; y: number[] } {
    const x: number[] = [], y: number[] = [];
    for (const row of rows) {
        const xv = toNumber(row[a]), yv = toNumber(row[b]);
        if (xv !== null && yv !== null) { x.push(xv); y.push(yv); }
    }
    return { x, y };
}

function samplePoints(x: number[], y: number[]): { x: number; y: number }[] {
    const step = Math.max(1, Math.ceil(x.length / MAX_CHART_POINTS));
    const points: { x: number; y: number }[] = [];
    for (let i = 0; i < x.length; i += step) points.push({ x: x[i], y: y[i] });
    return points;
}

function strength(r: number): string {
    const a = Math.abs(r);
    if (a < 0.1) return 'negligible';
    if (a < 0.3) return 'weak';
    if (a < 0.5) return 'moderate';
    return 'strong';
}

function runCorrelation(id: string, rows: Record<string, unknown>[], x: string, y: string): AnalysisResult | null {
    const pairs = numericPairs(rows, x, y);
    if (pairs.x.length < MIN_PAIRS) return null;
    const res = pearson(pairs.x, pairs.y);
    const significant = res.p < ALPHA;
    const statistic = `r(${res.df}) = ${fmtBounded(res.r)}, ${formatP(res.p)}`;
    return {
        id, type: 'correlation', title: `Correlation between ${x} and ${y}`, variables: [x, y], n: res.n, statistic, significant,
        finding: significant
            ? `${x} and ${y} showed a ${strength(res.r)} ${res.r > 0 ? 'positive' : 'negative'} correlation, ${statistic}, N = ${res.n}.`
            : `No statistically significant correlation was found between ${x} and ${y}, ${statistic}, N = ${res.n}.`,
        table: {
            caption: `Pearson correlation between ${x} and ${y}`,
            headers: ['Variables', 'N', 'r', 'p'],
            rows: [[`${x} × ${y}`, String(res.n), fmtBounded(res.r), pCell(res.p)]],
        },
        chart: { kind: 'scatter', xLabel: x, yLabel: y, points: samplePoints(pairs.x, pairs.y) },
    };
}

function runRegression(id: string, rows: Record<string, unknown>[], predictor: string, outcome: string): AnalysisResult | null {
    const pairs = numericPairs(rows, predictor, outcome);
    if (pairs.x.length < MIN_PAIRS) return null;
    const res = linearRegression(pairs.x, pairs.y);
    const significant = res.p < ALPHA;
    const statistic = `b = ${fmt(res.slope, 3)}, t(${res.df}) = ${fmt(res.t)}, ${formatP(res.p)}, R² = ${fmtBounded(res.r2)}`;
    return {
        id, type: 'regression', title: `Linear regression of ${outcome} on ${predictor}`, variables: [predictor, outcome], n: res.n, statistic, significant,
        finding: significant
            ? `Each one-unit increase in ${predictor} was associated with a ${fmt(Math.abs(res.slope), 3)} ${res.slope > 0 ? 'increase' : 'decrease'} in ${outcome} (${statistic}, N = ${res.n}); ${predictor} explained ${(res.r2 * 100).toFixed(1)}% of the variance.`
            : `${predictor} did not significantly predict ${outcome} (${statistic}, N = ${res.n}).`,
        table: {
            caption: `Simple linear regression predicting ${outcome}`,
            headers: ['Term', 'Estimate', 'SE', 't', 'p'],
            rows: [
                ['Intercept', fmt(res.intercept, 3), '', '', ''],
                [predictor, fmt(res.slope, 3), fmt(res.slopeSE, 3), fmt(res.t), pCell(res.p)],
            ],
            note: `N = ${res.n}, R² = ${fmtBounded(res.r2)}.`,
        },
        chart: { kind: 'scatter', xLabel: predictor, yLabel: outcome, points: samplePoints(pairs.x, pairs.y) },
    };
}

function runGroupComparison(id: string, rows: Record<string, unknown>[], group: string, outcome: string): AnalysisResult | null {
    const byGroup = new Map<string, number[]>();
    for (const row of rows) {
        const g = toCategory(row[group]);
        const v = toNumber(row[outcome]);
        if (g === null || v === null) continue;
        if (!byGroup.has(g)) byGroup.set(g, []);
        byGroup.get(g)!.push(v);
    }
    const groups = [...byGroup.entries()]
        .filter(([, values]) => values.length >= MIN_GROUP_SIZE)
        .sort((a, b) => b[1].length - a[1].length)
        .slice(0, MAX_LEVELS);
    if (groups.length < 2) return null;

    const n = groups.reduce((sum, [, v]) => sum + v.length, 0);
    const table: ReportTable = {
        caption: `${outcome} by ${group}`,
        headers: [group, 'n', 'Mean', 'SD'],
        rows: groups.map(([name, v]) => [name, String(v.length), fmt(mean(v)), fmt(sd(v))]),
    };
    const excluded = byGroup.size - groups.length;
    if (excluded > 0) table.note = `${excluded} smaller group(s) excluded.`;
    const chart: ChartSpec = {
        kind: 'bar', xLabel: group, yLabel: `Mean ${outcome}`,
        categories: groups.map(([name]) => name), values: groups.map(([, v]) => mean(v)),
    };

    if (groups.length === 2) {
        const [[nameA, a], [nameB, b]] = groups;
        const res = welchTTest(a, b);
        const significant = res.p < ALPHA;
        const statistic = `t(${fmt(res.df, 1)}) = ${fmt(res.t)}, ${formatP(res.p)}, d = ${fmt(res.cohensD)}`;
        const higher = res.meanA > res.meanB ? nameA : nameB;
        const lower = higher === nameA ? nameB : nameA;
        return {
            id, type: 'group_comparison', title: `${outcome} by ${group}`, variables: [group, outcome], n, statistic, significant, table, chart,
            finding: significant
                ? `${outcome} was significantly higher for ${higher} (M = ${fmt(Math.max(res.meanA, res.meanB))}) than for ${lower} (M = ${fmt(Math.min(res.meanA, res.meanB))}), Welch's ${statistic}.`
                : `${outcome} did not differ significantly between ${nameA} (M = ${fmt(res.meanA)}) and ${nameB} (M = ${fmt(res.meanB)}), Welch's ${statistic}.`,
        };
    }

    const res = oneWayAnova(groups.map(([, v]) => v));
    const significant = res.p < ALPHA;
    const statistic = `F(${res.dfBetween}, ${res.dfWithin}) = ${fmt(res.f)}, ${formatP(res.p)}, η² = ${fmtBounded(res.etaSquared)}`;
    const ranked = [...groups].sort((a, b) => mean(b[1]) - mean(a[1]));
    return {
        id, type: 'group_comparison', title: `${outcome} by ${group}`, variables: [group, outcome], n, statistic, significant, table, chart,
        finding: significant
            ? `Mean ${outcome} differed significantly across ${groups.length} ${group} groups, one-way ANOVA ${statistic}; it was highest for ${ranked[0][0]} (M = ${fmt(mean(ranked[0][1]))}) and lowest for ${ranked.at(-1)![0]} (M = ${fmt(mean(ranked.at(-1)![1]))}).`
            : `Mean ${outcome} did not differ significantly across ${groups.length} ${group} groups, one-way ANOVA ${statistic}.`,
    };
}

function runAssociation(id: string, rows: Record<string, unknown>[], a: string, b: string): AnalysisResult | null {
    const counts = new Map<string, Map<string, number>>();
    const bTotals = new Map<string, number>();
    for (const row of rows) {
        const av = toCategory(row[a]), bv = toCategory(row[b]);
        if (av === null || bv === null) continue;
        if (!counts.has(av)) counts.set(av, new Map());
        counts.get(av)!.set(bv, (counts.get(av)!.get(bv) ?? 0) + 1);
        bTotals.set(bv, (bTotals.get(bv) ?? 0) + 1);
    }
    const total = (m: Map<string, number>) => [...m.values()].reduce((s, v) => s + v, 0);
    const aLevels = [...counts.entries()].sort((x, y) => total(y[1]) - total(x[1])).slice(0, MAX_LEVELS).map(([k]) => k);
    const bLevels = [...bTotals.entries()].sort((x, y) => y[1] - x[1]).slice(0, MAX_LEVELS).map(([k]) => k);
    if (aLevels.length < 2 || bLevels.length < 2) return null;

    const table = aLevels.map(al => bLevels.map(bl => counts.get(al)?.get(bl) ?? 0));
    const res = chiSquareIndependence(table);
    if (res.n < MIN_PAIRS) return null;
    const significant = res.p < ALPHA;
    const statistic = `χ²(${res.df}, N = ${res.n}) = ${fmt(res.chi2)}, ${formatP(res.p)}, Cramér's V = ${fmtBounded(res.cramersV)}`;

    const rowSums = table.map(r => r.reduce((s, v) => s + v, 0));
    const colSums = bLevels.map((_, j) => table.reduce((s, r) => s + r[j], 0));
    const lowExpected = table.some((r, i) => r.some((_, j) => (rowSums[i] * colSums[j]) / res.n < 5));

    return {
        id, type: 'association', title: `Association between ${a} and ${b}`, variables: [a, b], n: res.n, statistic, significant,
        finding: significant
            ? `${a} and ${b} were significantly associated, ${statistic}.`
            : `No significant association was found between ${a} and ${b}, ${statistic}.`,
        table: {
            caption: `Contingency table of ${a} by ${b}`,
            headers: [`${a} \\ ${b}`, ...bLevels],
            rows: aLevels.map((al, i) => [al, ...table[i].map(String)]),
            note: lowExpected ? 'Some expected counts are below 5; interpret the chi-square test with caution.' : undefined,
        },
    };
}

/**
 * Descriptive statistics, from Hugging Face's full-split statistics when available
 */
function buildDescriptives(
    rows: Record<string, unknown>[],
    columns: ColumnInfo[],
    used: Set<string>,
    full: FullStatistics | null
): ReportTable[] {
    const numeric = columns.filter(c => c.kind === 'numeric' && used.has(c.name));
    const categorical = columns.filter(c => c.kind === 'categorical' && used.has(c.name));
    const tables: ReportTable[] = [];

    if (numeric.length) {
        tables.push({
            caption: 'Descriptive statistics for numeric variables',
            headers: ['Variable', 'N', 'Mean', 'SD', 'Median', 'Min', 'Max'],
            rows: numeric.map(col => {
                const fs = full?.columns.find(s => s.name === col.name);
                if (fs?.mean !== undefined && full) {
                    return [col.name, String(full.numExamples - fs.nanCount), fmt(fs.mean), fmt(fs.std ?? NaN), fmt(fs.median ?? NaN), fmt(fs.min ?? NaN), fmt(fs.max ?? NaN)];
                }
                const values = rows.map(r => toNumber(r[col.name])).filter((v): v is number => v !== null);
                return values.length
                    ? [col.name, String(values.length), fmt(mean(values)), fmt(sd(values)), fmt(median(values)), fmt(Math.min(...values)), fmt(Math.max(...values))]
                    : [col.name, '0', '', '', '', '', ''];
            }),
            note: full ? `Computed over ${full.partial ? 'a large portion of' : 'all'} ${full.numExamples.toLocaleString()} rows.` : `Computed over ${rows.length} sampled rows.`,
        });
    }

    if (categorical.length) {
        const freqRows: string[][] = [];
        for (const col of categorical) {
            const fs = full?.columns.find(s => s.name === col.name)?.frequencies;
            let counts: [string, number][];
            if (fs) {
                counts = Object.entries(fs);
            } else {
                const m = new Map<string, number>();
                for (const r of rows) {
                    const v = toCategory(r[col.name]);
                    if (v !== null) m.set(v, (m.get(v) ?? 0) + 1);
                }
                counts = [...m.entries()];
            }
            const total = counts.reduce((s, [, c]) => s + c, 0);
            counts.sort((a, b) => b[1] - a[1]).slice(0, 5).forEach(([value, count]) => {
                freqRows.push([col.name, value, count.toLocaleString(), `${((count / total) * 100).toFixed(1)}%`]);
            });
        }
        tables.push({
            caption: 'Frequencies for categorical variables (top 5 categories)',
            headers: ['Variable', 'Category', 'Count', '%'],
            rows: freqRows,
        });
    }

    return tables;
}

export interface RunInput {
    topic: string;
    dataset: DatasetMeta;
    rationale: string;
    plan: PlannedAnalysis[];
    rows: Record<string, unknown>[];
    fullStatistics: FullStatistics | null;
}

export function runAnalysis(input: RunInput): AnalysisReport {
    const { dataset, rows, plan, fullStatistics } = input;
    const results: AnalysisResult[] = [];

    plan.forEach((item, i) => {
        const id = `r${i + 1}`;
        const result =
            item.type === 'correlation' ? runCorrelation(id, rows, item.x, item.y)
                : item.type === 'regression' ? runRegression(id, rows, item.predictor, item.outcome)
                    : item.type === 'group_comparison' ? runGroupComparison(id, rows, item.group, item.outcome)
                        : runAssociation(id, rows, item.a, item.b);
        if (result) results.push(result);
    });

    const used = new Set(results.flatMap(r => r.variables));
    const limitations: string[] = [];
    if (rows.length < dataset.totalRows) {
        limitations.push(`Inferential tests used ${rows.length.toLocaleString()} rows sampled evenly from ${dataset.totalRows.toLocaleString()}.`);
    }
    limitations.push(...(dataset.notes ?? []));
    if (fullStatistics?.partial) {
        limitations.push('Descriptive statistics cover a large portion of the dataset rather than every row.');
    }
    if (results.length > 1) {
        limitations.push(`${results.length} tests were run without correction for multiple comparisons.`);
    }
    limitations.push('The data are observational, so associations do not establish causation.');
    const skipped = plan.length - results.length;
    if (skipped > 0) {
        limitations.push(`${skipped} planned analysis(es) were skipped because too few complete observations were available.`);
    }

    return {
        id: `${dataset.source}:${dataset.id}-${Date.now()}`,
        topic: input.topic,
        createdAt: new Date().toISOString(),
        dataset: {
            source: dataset.source,
            id: dataset.id,
            title: dataset.title,
            url: dataset.url,
            totalRows: dataset.totalRows,
            citation: dataset.citation,
            config: dataset.config,
            split: dataset.split,
        },
        rationale: input.rationale,
        sampleSize: rows.length,
        statisticsScope: fullStatistics ? (fullStatistics.partial ? 'partial' : 'full') : 'sample',
        descriptives: buildDescriptives(rows, dataset.columns, used, fullStatistics),
        results,
        limitations,
        includeInPaper: true,
    };
}

/**
 * Text block for paper prompts: the only numbers the model may report
 */
export function reportToPromptContext(report: AnalysisReport): string {
    const lines = [
        datasetCitationOf(report).ownData
            ? `Data: primary data collected by the author ("${report.dataset.title}", ${report.dataset.totalRows.toLocaleString()} rows; ${report.sampleSize.toLocaleString()} analyzed). Describe it as the author's own data; do not cite it as a published source.`
            : `Dataset: ${report.dataset.title} (${SOURCE_LABELS[report.dataset.source ?? 'huggingface']}: ${report.dataset.id}, ${report.dataset.totalRows.toLocaleString()} rows; ${report.sampleSize.toLocaleString()} analyzed).`,
        `Why this dataset: ${report.rationale}`,
        'Methods: ' + [...new Set(report.results.map(r => ({
            correlation: 'Pearson correlation',
            regression: 'simple linear regression',
            group_comparison: "Welch's t-test / one-way ANOVA",
            association: 'chi-square test of independence',
        })[r.type]))].join(', ') + `; alpha = ${ALPHA}.`,
        'Computed findings:',
        ...report.results.map((r, i) => `${i + 1}. ${r.finding}`),
        'Limitations: ' + report.limitations.join(' '),
    ];
    return lines.join('\n');
}

/** All tables in report order, numbered for the paper */
export function reportTables(report: AnalysisReport): ReportTable[] {
    return [...report.descriptives, ...report.results.map(r => ({ ...r.table, note: [r.table.note, r.statistic].filter(Boolean).join(' ') }))];
}

/** Citation details for a report, deriving them for reports saved before citations were stored */
export function datasetCitationOf(report: AnalysisReport): DatasetCitation {
    if (report.dataset.citation) return report.dataset.citation;
    const owner = report.dataset.id.includes('/') ? report.dataset.id.split('/')[0] : 'Hugging Face';
    return { creator: owner, title: report.dataset.title, publisher: 'Hugging Face', url: report.dataset.url };
}
