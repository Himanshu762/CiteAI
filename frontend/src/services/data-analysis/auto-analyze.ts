/**
 * Automatic "find data, analyze it, report it" pipeline.
 * The language model only decides whether data is needed, which dataset fits and which
 * columns to test; every statistic is computed in code (see report.ts / stats.ts).
 */

import { completeLLM, parseJSONResponse } from '../llm';
import { searchHFDatasets } from '../huggingface-api';
import { describeDataset, fetchRows, getFullStatistics, isAnalyzable, DatasetTable } from './hf-data';
import { AnalysisReport, runAnalysis, validatePlan } from './report';

export type AnalysisStep = 'assess' | 'search' | 'inspect' | 'plan' | 'fetch' | 'analyze';

export type AutoAnalysisOutcome =
    | { status: 'not-needed'; reason: string }
    | { status: 'no-dataset'; reason: string; queries: string[] }
    | { status: 'done'; report: AnalysisReport };

export interface AutoAnalysisOptions {
    researchQuestions?: string[];
    discipline?: string;
    force?: boolean; // Skip the "is data needed?" check
    maxRows?: number;
    onStep?: (step: AnalysisStep, detail?: string) => void;
    signal?: AbortSignal;
}

interface Candidate {
    id: string;
    title: string;
    description: string;
    downloads: number;
    table: DatasetTable;
}

const MAX_CANDIDATES_CHECKED = 12;
const MAX_CANDIDATES_DESCRIBED = 5;
const DEFAULT_MAX_ROWS = 1000;

interface Assessment {
    needsData: boolean;
    reason: string;
    searchQueries: string[];
}

export async function assessDataNeed(topic: string, questions: string[], discipline?: string): Promise<Assessment> {
    const prompt = `You are a research methods advisor. Decide whether a paper on this topic would be strengthened by analyzing a public tabular dataset (for example measurements, survey responses, records or benchmark results).

Topic: "${topic}"
${discipline ? `Field: ${discipline}\n` : ''}${questions.length ? `Research questions:\n${questions.map((q, i) => `${i + 1}. ${q}`).join('\n')}\n` : ''}
Purely theoretical, philosophical, historical-narrative or literature-only topics do not need data.

Respond ONLY with JSON:
{"needsData": true|false, "reason": "one sentence", "searchQueries": ["2-4 short dataset search terms, 1-3 words each"]}`;

    const parsed = parseJSONResponse<Partial<Assessment>>(await completeLLM(prompt, { temperature: 0.2, maxTokens: 400 }));
    return {
        needsData: Boolean(parsed.needsData),
        reason: typeof parsed.reason === 'string' ? parsed.reason : '',
        searchQueries: Array.isArray(parsed.searchQueries)
            ? parsed.searchQueries.filter((q): q is string => typeof q === 'string' && q.trim().length > 0).slice(0, 4)
            : [],
    };
}

async function findCandidates(queries: string[], signal?: AbortSignal): Promise<Candidate[]> {
    const seen = new Map<string, { id: string; title: string; description: string; downloads: number }>();
    for (const query of queries) {
        try {
            for (const ds of await searchHFDatasets({ query, limit: 10 })) {
                if (!seen.has(ds.id)) seen.set(ds.id, ds);
            }
        } catch (error) {
            console.warn('Dataset search failed for', query, error);
        }
    }

    const ranked = [...seen.values()].sort((a, b) => b.downloads - a.downloads).slice(0, MAX_CANDIDATES_CHECKED);
    const analyzable = (await Promise.all(ranked.map(async ds => (await isAnalyzable(ds.id, signal)) ? ds : null)))
        .filter((ds): ds is NonNullable<typeof ds> => ds !== null)
        .slice(0, MAX_CANDIDATES_DESCRIBED);

    const described = await Promise.all(analyzable.map(async (ds): Promise<Candidate | null> => {
        try {
            const table = await describeDataset(ds.id, signal);
            const usable = table.columns.filter(c => c.kind === 'numeric' || c.kind === 'categorical').length;
            return usable >= 2 && table.totalRows >= 20
                ? { id: ds.id, title: ds.title, description: ds.description, downloads: ds.downloads, table }
                : null;
        } catch {
            return null;
        }
    }));
    return described.filter((c): c is Candidate => c !== null);
}

interface PlanResponse {
    datasetId: string;
    rationale: string;
    analyses: unknown[];
}

export async function planAnalysis(topic: string, questions: string[], candidates: Candidate[]): Promise<PlanResponse> {
    const listing = candidates.map(c => {
        const cols = c.table.columns
            .filter(col => col.kind === 'numeric' || col.kind === 'categorical')
            .map(col => `${col.name} (${col.kind}${col.labels ? `: ${col.labels.slice(0, 6).join('/')}` : ''})`)
            .join(', ');
        return `- id: ${c.id}\n  rows: ${c.table.totalRows}\n  description: ${c.description.slice(0, 300).replace(/\s+/g, ' ')}\n  columns: ${cols}`;
    }).join('\n');

    const prompt = `You are a quantitative researcher. Choose the ONE dataset below that best supports a paper on "${topic}", then plan up to 4 statistical analyses on its columns.
${questions.length ? `\nResearch questions:\n${questions.map((q, i) => `${i + 1}. ${q}`).join('\n')}\n` : ''}
Datasets:
${listing}

Allowed analysis types (use exact column names; respect the column kinds):
- {"type": "correlation", "x": numeric, "y": numeric}
- {"type": "regression", "predictor": numeric, "outcome": numeric}
- {"type": "group_comparison", "group": categorical, "outcome": numeric}
- {"type": "association", "a": categorical, "b": categorical}

Avoid ID, index and row-number columns. Prefer analyses that answer the research questions.

Respond ONLY with JSON:
{"datasetId": "...", "rationale": "one sentence on why this dataset fits", "analyses": [ ... ]}`;

    const parsed = parseJSONResponse<Partial<PlanResponse>>(await completeLLM(prompt, { temperature: 0.2, maxTokens: 800 }));
    return {
        datasetId: typeof parsed.datasetId === 'string' ? parsed.datasetId : candidates[0].id,
        rationale: typeof parsed.rationale === 'string' ? parsed.rationale : '',
        analyses: Array.isArray(parsed.analyses) ? parsed.analyses : [],
    };
}

async function analyzeCandidate(
    topic: string,
    questions: string[],
    candidates: Candidate[],
    options: AutoAnalysisOptions
): Promise<AnalysisReport | null> {
    const { onStep, signal, maxRows = DEFAULT_MAX_ROWS } = options;

    onStep?.('plan', `Choosing among ${candidates.length} dataset(s)`);
    const plan = await planAnalysis(topic, questions, candidates);
    const chosen = candidates.find(c => c.id === plan.datasetId) ?? candidates[0];
    const analyses = validatePlan(plan.analyses, chosen.table.columns);
    if (analyses.length === 0) return null;

    onStep?.('fetch', `Loading ${chosen.id}`);
    const [rows, fullStatistics] = await Promise.all([
        fetchRows(chosen.table, maxRows, signal),
        getFullStatistics(chosen.table, signal),
    ]);
    if (rows.length === 0) return null;

    onStep?.('analyze', `Running ${analyses.length} test(s) on ${rows.length} rows`);
    return runAnalysis({
        topic,
        table: chosen.table,
        datasetTitle: chosen.title,
        rationale: plan.rationale,
        plan: analyses,
        rows,
        fullStatistics,
    });
}

/**
 * Decide whether the topic needs data; if so, find a dataset, analyze it and build a report
 */
export async function autoAnalyze(topic: string, options: AutoAnalysisOptions = {}): Promise<AutoAnalysisOutcome> {
    const { researchQuestions = [], discipline, force = false, onStep, signal } = options;

    onStep?.('assess');
    const assessment = await assessDataNeed(topic, researchQuestions, discipline);
    if (!assessment.needsData && !force) {
        return { status: 'not-needed', reason: assessment.reason || 'This topic does not call for quantitative data.' };
    }

    const queries = assessment.searchQueries.length ? assessment.searchQueries : [topic];
    onStep?.('search', queries.join(', '));
    onStep?.('inspect');
    const candidates = await findCandidates(queries, signal);
    if (candidates.length === 0) {
        return { status: 'no-dataset', reason: 'No public dataset with readable tabular data matched this topic.', queries };
    }

    const report = await analyzeCandidate(topic, researchQuestions, candidates, options);
    return report
        ? { status: 'done', report }
        : { status: 'no-dataset', reason: 'The matching datasets did not have columns suitable for statistical tests.', queries };
}

/**
 * Analyze one dataset the user picked
 */
export async function analyzeSpecificDataset(
    topic: string,
    dataset: { id: string; title: string; description: string },
    options: AutoAnalysisOptions = {}
): Promise<AnalysisReport | null> {
    options.onStep?.('inspect', dataset.id);
    const table = await describeDataset(dataset.id, options.signal);
    return analyzeCandidate(topic, options.researchQuestions ?? [], [{ ...dataset, downloads: 0, table }], options);
}
