import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../services/llm', () => ({
  completeLLM: vi.fn(),
  streamLLM: vi.fn(),
}));

import { completeLLM } from '../services/llm';
import { analyzeOriginality } from '../services/ai-plagiarism';

const mocked = vi.mocked(completeLLM);
const paragraph = (n: number) => `Paragraph ${n} `.padEnd(80, 'x');
const paper = (count: number) => Array.from({ length: count }, (_, i) => paragraph(i)).join('\n\n');

// Braces matter: a function returned from beforeEach is run as teardown
beforeEach(() => {
  mocked.mockReset();
});

describe('analyzeOriginality', () => {
  it('scores many paragraphs in a few batched requests', async () => {
    mocked.mockImplementation(async (prompt) => {
      const count = ((prompt as string).match(/^\[\d+\]$/gm) || []).length;
      return JSON.stringify(Array.from({ length: count }, (_, index) => ({ index, score: 80, issues: [] })));
    });
    const result = await analyzeOriginality(paper(20));
    expect(mocked).toHaveBeenCalledTimes(3);
    expect(result.passages).toHaveLength(20);
    expect(result.overallScore).toBe(80);
  });

  it('leaves failed batches out of the score instead of inventing one', async () => {
    mocked
      .mockResolvedValueOnce(JSON.stringify(Array.from({ length: 8 }, (_, index) => ({ index, score: 40, issues: [] }))))
      .mockRejectedValueOnce(new Error('429'));
    const result = await analyzeOriginality(paper(10));
    expect(result.passages).toHaveLength(8);
    expect(result.overallScore).toBe(40);
    expect(result.suggestions[0]).toContain('2 of 10 passages could not be analyzed');
  });

  it('throws when nothing could be analyzed', async () => {
    mocked.mockRejectedValue(new Error('no key'));
    await expect(analyzeOriginality(paper(3))).rejects.toThrow('Originality analysis failed');
  });
});
