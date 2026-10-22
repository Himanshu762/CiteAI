import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../services/llm', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../services/llm')>()),
  completeLLM: vi.fn(),
}));
vi.mock('../services/huggingface-api', () => ({ searchHFDatasets: vi.fn() }));
vi.mock('../services/data-analysis/hf-data', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../services/data-analysis/hf-data')>()),
  isAnalyzable: vi.fn(),
  describeDataset: vi.fn(),
  fetchRows: vi.fn(),
  getFullStatistics: vi.fn(),
}));

import { completeLLM } from '../services/llm';
import { searchHFDatasets } from '../services/huggingface-api';
import { classifyFeature, describeDataset, fetchRows, getFullStatistics, isAnalyzable, ColumnInfo, DatasetTable } from '../services/data-analysis/hf-data';
import { runAnalysis, validatePlan, reportTables } from '../services/data-analysis/report';
import { autoAnalyze } from '../services/data-analysis/auto-analyze';

const columns: ColumnInfo[] = [
  { name: 'hours', kind: 'numeric' },
  { name: 'score', kind: 'numeric' },
  { name: 'school', kind: 'categorical' },
  { name: 'passed', kind: 'categorical' },
  { name: 'notes', kind: 'text' },
];

const table: DatasetTable = { datasetId: 'org/study', config: 'default', split: 'train', columns, totalRows: 5000 };

// Deterministic synthetic data: score rises with hours; school A outscores B
const rows = Array.from({ length: 60 }, (_, i) => ({
  hours: i % 20,
  score: 50 + (i % 20) * 2 + (i % 2 === 0 ? 5 : -5) + ((i * 7) % 3),
  school: i % 2 === 0 ? 'A' : 'B',
  passed: (i % 20) > 8 ? 'yes' : 'no',
  notes: 'free text',
}));

describe('classifyFeature', () => {
  it('maps Hugging Face feature types to column kinds', () => {
    expect(classifyFeature({ _type: 'Value', dtype: 'float64' }).kind).toBe('numeric');
    expect(classifyFeature({ _type: 'ClassLabel', names: ['neg', 'pos'] })).toEqual({ kind: 'categorical', labels: ['neg', 'pos'] });
    expect(classifyFeature({ _type: 'Value', dtype: 'string' }).kind).toBe('text');
    expect(classifyFeature({ _type: 'Sequence' }).kind).toBe('other');
  });
});

describe('validatePlan', () => {
  it('drops analyses with unknown columns, wrong kinds or duplicates', () => {
    const plan = validatePlan([
      { type: 'correlation', x: 'hours', y: 'score' },
      { type: 'correlation', x: 'hours', y: 'score' },
      { type: 'correlation', x: 'hours', y: 'made_up' },
      { type: 'group_comparison', group: 'notes', outcome: 'score' },
      { type: 'group_comparison', group: 'school', outcome: 'score' },
      { type: 'regression', predictor: 'hours', outcome: 'hours' },
      { type: 'delete_everything' },
    ], columns);
    expect(plan).toEqual([
      { type: 'correlation', x: 'hours', y: 'score' },
      { type: 'group_comparison', group: 'school', outcome: 'score' },
    ]);
  });
});

describe('runAnalysis', () => {
  const report = runAnalysis({
    topic: 'Study time and exam scores', table, datasetTitle: 'study', rationale: 'Has hours and scores.',
    plan: [
      { type: 'correlation', x: 'hours', y: 'score' },
      { type: 'group_comparison', group: 'school', outcome: 'score' },
      { type: 'association', a: 'school', b: 'passed' },
      { type: 'regression', predictor: 'hours', outcome: 'score' },
    ],
    rows, fullStatistics: null,
  });

  it('computes every planned test with APA statistics', () => {
    expect(report.results.map(r => r.type)).toEqual(['correlation', 'group_comparison', 'association', 'regression']);
    const [corr, groups, assoc] = report.results;
    expect(corr.significant).toBe(true);
    expect(corr.statistic).toMatch(/^r\(58\) = \.\d\d, p < \.001$/);
    expect(groups.statistic).toMatch(/^t\(/); // two groups -> Welch's t-test
    expect(groups.finding).toContain('higher for A');
    expect(assoc.statistic).toMatch(/^χ²\(1, N = 60\)/);
  });

  it('documents sampling, multiple comparisons and causality limits', () => {
    expect(report.limitations.join(' ')).toContain('60 rows sampled evenly from 5,000');
    expect(report.limitations.join(' ')).toContain('without correction for multiple comparisons');
    expect(report.limitations.join(' ')).toContain('do not establish causation');
    expect(report.statisticsScope).toBe('sample');
  });

  it('builds descriptive and result tables', () => {
    expect(report.descriptives[0].headers).toEqual(['Variable', 'N', 'Mean', 'SD', 'Median', 'Min', 'Max']);
    expect(report.descriptives[0].rows.map(r => r[0])).toEqual(['hours', 'score']);
    expect(reportTables(report)).toHaveLength(2 + 4);
  });

  it('skips tests without enough observations and says so', () => {
    const small = runAnalysis({
      topic: 't', table, datasetTitle: 'd', rationale: '', rows: rows.slice(0, 5), fullStatistics: null,
      plan: [{ type: 'correlation', x: 'hours', y: 'score' }],
    });
    expect(small.results).toHaveLength(0);
    expect(small.limitations.join(' ')).toContain('1 planned analysis(es) were skipped');
  });
});

describe('autoAnalyze', () => {
  const llm = vi.mocked(completeLLM);

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(searchHFDatasets).mockResolvedValue([
      { id: 'org/study', title: 'study', description: 'Hours studied and exam scores', downloads: 10 },
    ] as never);
    vi.mocked(isAnalyzable).mockResolvedValue(true);
    vi.mocked(describeDataset).mockResolvedValue({ ...table, preview: [] });
    vi.mocked(fetchRows).mockResolvedValue(rows);
    vi.mocked(getFullStatistics).mockResolvedValue(null);
  });

  it('stops when the topic does not need data', async () => {
    llm.mockResolvedValueOnce('{"needsData": false, "reason": "Philosophical topic.", "searchQueries": []}');
    const outcome = await autoAnalyze('Kant on duty');
    expect(outcome).toEqual({ status: 'not-needed', reason: 'Philosophical topic.' });
    expect(searchHFDatasets).not.toHaveBeenCalled();
  });

  it('finds, plans and analyzes a dataset', async () => {
    const steps: string[] = [];
    llm
      .mockResolvedValueOnce('{"needsData": true, "reason": "Empirical.", "searchQueries": ["study hours"]}')
      .mockResolvedValueOnce('```json\n{"datasetId": "org/study", "rationale": "Direct measures.", "analyses": [{"type": "correlation", "x": "hours", "y": "score"}]}\n```');
    const outcome = await autoAnalyze('Study time and exam scores', { onStep: s => steps.push(s) });
    expect(outcome.status).toBe('done');
    if (outcome.status !== 'done') return;
    expect(outcome.report.results).toHaveLength(1);
    expect(outcome.report.rationale).toBe('Direct measures.');
    expect(steps).toEqual(['assess', 'search', 'inspect', 'plan', 'fetch', 'analyze']);
  });

  it('reports no dataset when the model plans only invalid analyses', async () => {
    llm
      .mockResolvedValueOnce('{"needsData": true, "reason": "", "searchQueries": ["x"]}')
      .mockResolvedValueOnce('{"datasetId": "org/study", "rationale": "", "analyses": [{"type": "correlation", "x": "nope", "y": "score"}]}');
    const outcome = await autoAnalyze('Topic');
    expect(outcome.status).toBe('no-dataset');
    expect(fetchRows).not.toHaveBeenCalled();
  });
});
