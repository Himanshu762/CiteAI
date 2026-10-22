import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../services/llm', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../services/llm')>()),
  completeLLM: vi.fn(),
}));

import { completeLLM } from '../services/llm';
import { findStockPhrases, preservesTokens, protectedTokens } from '../services/writing/style-guide';
import { polishSection } from '../services/writing/polish';

const llm = vi.mocked(completeLLM);
beforeEach(() => {
  llm.mockReset();
});

describe('findStockPhrases', () => {
  it('flags stock phrases in any inflection and ignores clean text', () => {
    const found = findStockPhrases("In today's rapidly evolving world, models play a pivotal role. We delved into it.");
    expect(found.map(f => f.label)).toEqual(expect.arrayContaining(["in today's ... world", 'plays a crucial role', 'delve']));
    expect(findStockPhrases('Smith et al. (2020) measured recall on 4,000 images.')).toEqual([]);
  });
});

describe('protected tokens', () => {
  it('captures citations and numbers', () => {
    expect(protectedTokens('Accuracy rose to 91.5% (Smith et al., 2020), r(148) = .96.')).toEqual(
      expect.arrayContaining(['(Smith et al., 2020)', '91.5%', '148']),
    );
  });

  it('detects a dropped citation or changed number', () => {
    const original = 'Recall was 0.82 (Lee, 2019).';
    expect(preservesTokens(original, 'Recall reached 0.82 (Lee, 2019).')).toBe(true);
    expect(preservesTokens(original, 'Recall reached 0.83 (Lee, 2019).')).toBe(false);
    expect(preservesTokens(original, 'Recall reached 0.82.')).toBe(false);
  });
});

describe('polishSection', () => {
  const text = 'Data quality plays a crucial role in model accuracy (Lee, 2019). Recall was 0.82 on 1,200 images.';

  it('skips the model call when there is nothing to fix', async () => {
    const result = await polishSection('Recall was 0.82 (Lee, 2019).');
    expect(result.changed).toBe(false);
    expect(llm).not.toHaveBeenCalled();
  });

  it('accepts an edit that keeps every citation and number', async () => {
    llm.mockResolvedValueOnce('Data quality largely determines model accuracy (Lee, 2019). Recall was 0.82 on 1,200 images.');
    const result = await polishSection(text);
    expect(result).toEqual({ content: 'Data quality largely determines model accuracy (Lee, 2019). Recall was 0.82 on 1,200 images.', changed: true });
  });

  it('rejects an edit that alters a number', async () => {
    llm.mockResolvedValueOnce('Data quality largely determines model accuracy (Lee, 2019). Recall was 0.85 on 1,200 images.');
    const result = await polishSection(text);
    expect(result.changed).toBe(false);
    expect(result.content).toBe(text);
    expect(result.reason).toContain('citation or number');
  });

  it('rejects an edit that rewrites far more than asked', async () => {
    llm.mockResolvedValueOnce('Quality matters (Lee, 2019) 0.82 1,200');
    expect((await polishSection(text)).changed).toBe(false);
  });
});
