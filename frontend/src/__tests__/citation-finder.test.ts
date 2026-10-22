import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../services/llm', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../services/llm')>()),
  completeLLM: vi.fn(),
}));
vi.mock('../services/references-api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../services/references-api')>()),
  searchReferences: vi.fn(),
}));

import { completeLLM } from '../services/llm';
import { searchReferences, Reference } from '../services/references-api';
import { findSourcesForClaim, findUncitedClaims, hasCitation, insertCitation, splitSentences, CitablePaper } from '../services/citation-finder';
import { PaperSection } from '../services/paper-generator';

const section = (id: string, title: string, content: string): PaperSection => ({ id, title, content, isGenerating: false, isComplete: true, wordCount: 0 });
const he: Reference = { id: 'he', title: 'Deep residual learning', year: 2016, venue: 'CVPR', abstract: 'Residual nets ease training of very deep networks.', authors: [{ name: 'Kaiming He' }, { name: 'Xiangyu Zhang' }, { name: 'Shaoqing Ren' }] };
const ioffe: Reference = { id: 'ioffe', title: 'Batch normalization', year: 2015, venue: 'ICML', authors: [{ name: 'Sergey Ioffe' }] };

const claim = 'Very deep convolutional networks became trainable once residual connections were added to each block.';

describe('sentence and citation detection', () => {
  it('splits sentences without breaking on abbreviations', () => {
    expect(splitSentences('Smith et al. found gains. Results held, e.g. on CIFAR. Done!')).toEqual(['Smith et al. found gains.', 'Results held, e.g. on CIFAR.', 'Done!']);
  });

  it('recognizes APA, MLA, Harvard and IEEE citations', () => {
    expect(hasCitation('Depth helps (He et al., 2016).')).toBe(true);
    expect(hasCitation('He and Zhang (2016) showed it.')).toBe(true);
    expect(hasCitation('Depth helps [3].')).toBe(true);
    expect(hasCitation('Depth helps (He and Zhang).')).toBe(true);
    expect(hasCitation('Depth helps a great deal in practice.')).toBe(false);
  });

  it('lists only uncited claims in body sections', () => {
    const claims = findUncitedClaims([
      section('abstract', 'Abstract', 'Abstracts summarize the paper and normally carry no citations at all in student work.'),
      section('introduction', 'Introduction', `${claim} Normalization layers also sped up training considerably (Ioffe, 2015).\n\nIn this paper we compare both techniques across several image classification benchmarks.`),
      section('references', 'References', 'Ioffe, S. (2015). Batch normalization. *ICML*.'),
    ]);
    expect(claims).toEqual([{ sectionId: 'introduction', sectionTitle: 'Introduction', paragraph: 0, sentence: claim }]);
  });
});

describe('findSourcesForClaim', () => {
  beforeEach(() => vi.mocked(completeLLM).mockReset());

  it('searches with a generated query and ranks sources by how well their abstract supports the claim', async () => {
    vi.mocked(completeLLM)
      .mockResolvedValueOnce('{"query": "residual connections deep network training"}')
      .mockResolvedValueOnce('[{"index": 0, "verdict": "related", "reason": "Same area"}, {"index": 1, "verdict": "supports", "reason": "Shows residual blocks ease training"}]');
    vi.mocked(searchReferences).mockResolvedValueOnce({ references: [{ ...ioffe, abstract: 'Normalizing layer inputs speeds training.' }, he], total: 2, offset: 0 });

    const results = await findSourcesForClaim(claim, { fieldId: '17' });
    expect(searchReferences).toHaveBeenCalledWith(expect.objectContaining({ query: 'residual connections deep network training', fieldId: '17' }));
    expect(results.map(r => [r.reference.id, r.verdict])).toEqual([['he', 'supports'], ['ioffe', 'related']]);
  });

  it('marks sources without an abstract as unchecked instead of guessing', async () => {
    vi.mocked(completeLLM).mockResolvedValueOnce('{"query": "q"}');
    vi.mocked(searchReferences).mockResolvedValueOnce({ references: [ioffe], total: 1, offset: 0 });
    const [result] = await findSourcesForClaim(claim);
    expect(result.verdict).toBe('unchecked');
    expect(result.reason).toContain('No abstract');
    expect(completeLLM).toHaveBeenCalledTimes(1); // no judging call without abstracts
  });
});

describe('insertCitation', () => {
  const loc = { sectionId: 'introduction', sectionTitle: 'Introduction', paragraph: 0, sentence: claim };
  const base = (overrides: Partial<CitablePaper>): CitablePaper => ({
    sections: [section('introduction', 'Introduction', `${claim} Next sentence.`), section('references', 'References', 'Ioffe, S. (2015). Batch normalization. *ICML*.')],
    sources: [ioffe], datasets: [], citationStyle: 'apa', origin: 'generated', ...overrides,
  });

  it('inserts an APA citation before the period and rebuilds the reference list', () => {
    const { sections, sources } = insertCitation(base({}), loc, he);
    expect(sections[0].content).toBe(`${claim.slice(0, -1)} (He et al., 2016). Next sentence.`);
    expect(sources.map(s => s.id)).toEqual(['ioffe', 'he']);
    expect(sections[1].content.split('\n\n').map(e => e.slice(0, 6))).toEqual(['He, K.', 'Ioffe,']);
  });

  it('renumbers IEEE citations by first appearance', () => {
    const paper = base({
      citationStyle: 'ieee',
      sections: [section('introduction', 'Introduction', `${claim} Normalization helps [1].`), section('references', 'References', '[1] S. Ioffe, "Batch normalization," *ICML*, 2015.')],
    });
    const { sections, sources } = insertCitation(paper, loc, he);
    expect(sections[0].content).toBe(`${claim.slice(0, -1)} [1]. Normalization helps [2].`);
    expect(sources.map(s => s.id)).toEqual(['he', 'ioffe']);
    expect(sections[1].content.startsWith('[1] K. He')).toBe(true);
  });

  it('keeps an imported draft\'s own reference list and adds the new entry', () => {
    const paper = base({
      origin: 'imported', sources: [],
      sections: [section('introduction', 'Introduction', `${claim} Next.`), section('references', 'Works Cited', 'Zhou, Li. "My own source." *Nature*, 2019.')],
      citationStyle: 'mla',
    });
    const { sections } = insertCitation(paper, loc, he);
    expect(sections[0].content).toContain('(He et al.).');
    expect(sections[1].content.split('\n\n')).toEqual([
      'He, Kaiming, et al. "Deep residual learning." *CVPR*, 2016.',
      'Zhou, Li. "My own source." *Nature*, 2019.',
    ]);
  });
});
