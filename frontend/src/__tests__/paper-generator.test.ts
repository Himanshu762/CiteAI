import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../services/llm', async (importOriginal) => ({
  parseJSONResponse: (await importOriginal<typeof import('../services/llm')>()).parseJSONResponse,
  completeLLM: vi.fn(),
  streamLLM: vi.fn(async () => ({ content: '## Heading\n\nModel **text**.', provider: 'groq', model: 'openai/gpt-oss-120b' })),
}));

import { completeLLM, streamLLM } from '../services/llm';
import { buildSectionPrompt, generatePaper, stripMarkdown, ResearchContext } from '../services/paper-generator';
import { Reference } from '../services/references-api';
import { AnalysisReport } from '../services/data-analysis/report';

const reference: Reference = {
  id: 'r1',
  title: 'Deep residual learning',
  authors: [{ name: 'Kaiming He' }, { name: 'Xiangyu Zhang' }, { name: 'Shaoqing Ren' }],
  year: 2016,
  venue: 'CVPR',
};

const context = (overrides: Partial<ResearchContext> = {}): ResearchContext => ({
  selectedReferences: [reference],
  selectedDatasets: [],
  datasetAnalyses: new Map(),
  researchNotes: '',
  researchGaps: [{ title: 'Low-resource settings', description: 'Little work on small datasets' }],
  researchQuestions: ['Does depth help on small data?'],
  ...overrides,
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe('generatePaper', () => {
  it('streams each section through the gateway and strips Markdown', async () => {
    const paper = await generatePaper({ topic: 'T', wordLimit: 1000, sections: ['Introduction'], provider: 'mistral' });
    expect(streamLLM).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ provider: 'mistral' }));
    expect(paper.sections[0].content).toBe('Heading\n\nModel text.');
    expect(paper.model).toBe('groq/openai/gpt-oss-120b');
  });

  it('sizes the token budget to the section length', async () => {
    await generatePaper({ topic: 'T', wordLimit: 1200, sections: ['Introduction', 'Discussion'] });
    // 600 words per section -> 600 * 1.4 + 600 = 1440 tokens
    expect(vi.mocked(streamLLM).mock.calls[0][1]).toEqual(expect.objectContaining({ maxTokens: 1440 }));
  });

  it('builds References from the selected sources without calling a model', async () => {
    const paper = await generatePaper({
      topic: 'T', wordLimit: 1000, sections: ['References'], researchContext: context(),
    });
    expect(streamLLM).not.toHaveBeenCalled();
    expect(paper.sections[0].content).toBe('He, K., Zhang, X., & Ren, S. (2016). Deep residual learning. *CVPR*.');
  });
});

describe('buildSectionPrompt', () => {
  it('passes selected gaps, questions and citable sources', () => {
    const prompt = buildSectionPrompt('Introduction', { topic: 'T', wordTarget: 200, researchContext: context() });
    expect(prompt).toContain('Low-resource settings');
    expect(prompt).toContain('Does depth help on small data?');
    expect(prompt).toContain('He et al. (2016)');
    expect(prompt).toContain('Cite only the sources listed below');
  });

  it('forbids citations when no sources were selected', () => {
    const prompt = buildSectionPrompt('Introduction', { topic: 'T', wordTarget: 200, researchContext: context({ selectedReferences: [] }) });
    expect(prompt).toContain('do not cite any papers or authors');
  });

  it('gives Results the measured dataset statistics', () => {
    const dataset = {
      id: 'd1', title: 'Iris', description: '', size: '', lastUpdated: '', downloadCount: 0,
      format: [], license: '', url: 'https://hf.co/datasets/iris', tags: [], source: 'huggingface' as const,
    };
    const analysis = {
      summary: { totalRows: 150, totalColumns: 5, missingValues: 0, duplicateRows: 0 },
      columns: [{ name: 'petal_length', type: 'numeric' as const, unique: 43, missing: 0, min: 1, max: 6.9, mean: 3.758 }],
      source: 'real' as const,
    };
    const prompt = buildSectionPrompt('Results', { topic: 'T', wordTarget: 200, researchContext: context({
      selectedDatasets: [dataset], datasetAnalyses: new Map([['d1', analysis]]),
    }) });
    expect(prompt).toContain('sample of 150 rows');
    expect(prompt).toContain('petal_length: numeric, mean 3.758');
    // Framing is for Introduction/Discussion, not Results
    expect(prompt).not.toContain('Low-resource settings');
  });
});

describe('stripMarkdown', () => {
  it('removes headings, emphasis and bullets', () => {
    expect(stripMarkdown('# Title\n\n- **bold** and *italic*\n\n\n\nEnd')).toBe('Title\n\nbold and italic\n\nEnd');
  });
});

const report: AnalysisReport = {
  id: 'rep1', topic: 'T', createdAt: '2026-10-22T00:00:00.000Z',
  dataset: { id: 'scikit-learn/iris', title: 'iris', url: 'https://huggingface.co/datasets/scikit-learn/iris', config: 'default', split: 'train', totalRows: 150 },
  rationale: 'Measures petals.', sampleSize: 150, statisticsScope: 'full',
  descriptives: [{ caption: 'Descriptive statistics for numeric variables', headers: ['Variable'], rows: [['PetalLengthCm']] }],
  results: [{
    id: 'r1', type: 'correlation', title: 'Correlation', variables: ['a', 'b'], n: 150, significant: true,
    statistic: 'r(148) = .96, p < .001', finding: 'a and b showed a strong positive correlation, r(148) = .96, p < .001, N = 150.',
    table: { caption: 'Pearson correlation between a and b', headers: ['Variables'], rows: [['a × b']] },
  }],
  limitations: ['The data are observational, so associations do not establish causation.'],
  includeInPaper: true,
};

describe('data analysis reports', () => {
  it('give Results the computed findings and numbered tables', () => {
    const prompt = buildSectionPrompt('Results', { topic: 'T', wordTarget: 200, researchContext: context({ analysisReports: [report] }), attachTables: true });
    expect(prompt).toContain('r(148) = .96, p < .001');
    expect(prompt).toContain('Table 1: Descriptive statistics for numeric variables');
    expect(prompt).toContain('Table 2: Pearson correlation between a and b');
    expect(prompt).toContain('do not establish causation');
  });

  it('attach tables to Results and cite the dataset', async () => {
    const paper = await generatePaper({
      topic: 'T', wordLimit: 1000, sections: ['Methodology', 'Results', 'References'],
      researchContext: context({ analysisReports: [report] }),
    });
    const [methods, results, refs] = paper.sections;
    expect(methods.tables).toBeUndefined();
    expect(results.tables?.map(t => t.caption)).toEqual(['Descriptive statistics for numeric variables', 'Pearson correlation between a and b']);
    expect(refs.content).toContain('scikit-learn. (n.d.). *iris* [Data set]. Hugging Face. https://huggingface.co/datasets/scikit-learn/iris');
  });

  it('leave excluded reports out of the paper', () => {
    const prompt = buildSectionPrompt('Results', { topic: 'T', wordTarget: 200, researchContext: context({ analysisReports: [{ ...report, includeInPaper: false }] }), attachTables: true });
    expect(prompt).not.toContain('r(148)');
  });
});

describe('planning, style and editing', () => {
  it('plans an outline first and gives each section its plan and the writing rules', async () => {
    vi.mocked(completeLLM).mockResolvedValueOnce(JSON.stringify({
      thesis: 'Depth helps only with enough data.',
      sections: [
        { name: 'Introduction', purpose: 'Frame the problem', points: ['Small datasets limit depth'] },
        { name: 'Discussion', purpose: 'Interpret findings', points: ['Limits of the evidence'] },
      ],
    }));
    const paper = await generatePaper({ topic: 'T', wordLimit: 1000, sections: ['Introduction', 'Discussion'], polish: false });
    const introPrompt = vi.mocked(streamLLM).mock.calls[0][0] as string;
    expect(introPrompt).toContain('Thesis of the paper: Depth helps only with enough data.');
    expect(introPrompt).toContain('- Small datasets limit depth');
    expect(introPrompt).toContain('- Discussion: Interpret findings');
    expect(introPrompt).toContain('Open each paragraph with its main claim');
    expect(paper.thesis).toBe('Depth helps only with enough data.');
  });

  it('still generates when the outline fails', async () => {
    vi.mocked(completeLLM).mockRejectedValueOnce(new Error('rate limited'));
    const paper = await generatePaper({ topic: 'T', wordLimit: 1000, sections: ['Introduction', 'Discussion'], polish: false });
    expect(paper.sections).toHaveLength(2);
    expect(paper.thesis).toBeUndefined();
  });

  it('uses the chosen citation style for prompts and the reference list', async () => {
    const prompt = buildSectionPrompt('Introduction', { topic: 'T', wordTarget: 200, researchContext: context(), style: 'mla' });
    expect(prompt).toContain('He et al. / (He et al.)');
    expect(prompt).toContain('MLA 9th style');

    const paper = await generatePaper({ topic: 'T', wordLimit: 1000, sections: ['References'], citationStyle: 'harvard', researchContext: context() });
    expect(paper.sections[0].title).toBe('Reference list');
    expect(paper.sections[0].content).toBe("He, K., Zhang, X. and Ren, S. (2016) 'Deep residual learning', *CVPR*.");
  });

  it('runs the checked edit pass on sections with stock phrases', async () => {
    vi.mocked(streamLLM).mockResolvedValueOnce({ content: 'Depth plays a crucial role in accuracy (He et al., 2016).', provider: 'groq', model: 'm' });
    // A single section needs no outline, so the only completeLLM call is the edit pass
    vi.mocked(completeLLM).mockResolvedValueOnce('Depth largely determines accuracy (He et al., 2016).');
    const paper = await generatePaper({ topic: 'T', wordLimit: 1000, sections: ['Introduction'] });
    expect(paper.sections[0].content).toBe('Depth largely determines accuracy (He et al., 2016).');
  });
});

describe('IEEE generation', () => {
  it('renumbers citations by first appearance and orders the reference list to match', async () => {
    const second: Reference = { id: 'r2', title: 'Batch normalization', authors: [{ name: 'Sergey Ioffe' }], year: 2015, venue: 'ICML' };
    vi.mocked(streamLLM).mockResolvedValueOnce({ content: 'Normalization helps [2]. Residual links help [1].', provider: 'groq', model: 'm' });
    const paper = await generatePaper({
      topic: 'T', wordLimit: 1000, sections: ['References', 'Introduction'], citationStyle: 'ieee', polish: false,
      researchContext: context({ selectedReferences: [reference, second] }),
    });
    const [refs, intro] = paper.sections;
    expect(intro.content).toBe('Normalization helps [1]. Residual links help [2].');
    expect(refs.content.split('\n\n')).toEqual([
      '[1] S. Ioffe, "Batch normalization," *ICML*, 2015.',
      '[2] K. He, X. Zhang, and S. Ren, "Deep residual learning," *CVPR*, 2016.',
    ]);
  });

  it('numbers datasets after the literature', async () => {
    const paper = await generatePaper({
      topic: 'T', wordLimit: 1000, sections: ['References'], citationStyle: 'ieee',
      researchContext: context({ analysisReports: [report] }),
    });
    expect(paper.sections[0].content.split('\n\n')[1]).toBe('[2] scikit-learn, "iris," Hugging Face. [Online]. Available: https://huggingface.co/datasets/scikit-learn/iris');
  });
});

describe('deterministic cleanup during generation', () => {
  it('rewrites stock phrases and em-dashes but keeps citations, and respects keep', async () => {
    const draft = 'Depth—not width—plays a pivotal role in accuracy (He et al., 2016).';
    vi.mocked(streamLLM).mockResolvedValue({ content: draft, provider: 'groq', model: 'm' });
    vi.mocked(completeLLM).mockResolvedValue(draft); // model edit returns it unchanged, so it is rejected

    const cleaned = await generatePaper({ topic: 'T', wordLimit: 1000, sections: ['Introduction'] });
    expect(cleaned.sections[0].content).toBe('Depth (not width) is central to accuracy (He et al., 2016).');

    const kept = await generatePaper({ topic: 'T', wordLimit: 1000, sections: ['Introduction'], dashStyle: 'keep' });
    expect(kept.sections[0].content).toBe('Depth—not width—is central to accuracy (He et al., 2016).');
  });
});
