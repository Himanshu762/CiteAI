import { describe, it, expect } from 'vitest';
import { cleanupText, cleanupSections } from '../services/writing/style-cleanup';

describe('phrase rewrites', () => {
  it('replaces stock phrases with fixed, grammatical alternatives', () => {
    expect(cleanupText('This study delves into memory. Sleep plays a pivotal role in recall.').text)
      .toBe('This study examines memory. Sleep is central to recall.');
    expect(cleanupText('Prior work paved the way for transformers and a myriad of variants.').text)
      .toBe('Prior work enabled transformers and many variants.');
  });

  it('removes lead-ins and fixes capitalization', () => {
    expect(cleanupText('It is important to note that results varied.').text).toBe('Results varied.');
    expect(cleanupText('Delving into the data showed drift.').text).toBe('Examining the data showed drift.');
  });

  it('reports each change', () => {
    const { changes } = cleanupText('A multifaceted problem.');
    expect(changes).toEqual([{ from: 'multifaceted', to: 'complex' }]);
  });
});

describe('em-dashes', () => {
  it('turns a paired aside into parentheses and a single dash into a comma', () => {
    expect(cleanupText('The model—trained on 10k images—generalized well.').text).toBe('The model (trained on 10k images) generalized well.');
    expect(cleanupText('Accuracy improved — but only on clean data.').text).toBe('Accuracy improved, but only on clean data.');
  });

  it('leaves en-dash ranges and kept dashes alone', () => {
    expect(cleanupText('Data from 2010–2020 (pp. 4–9).').text).toBe('Data from 2010–2020 (pp. 4–9).');
    expect(cleanupText('A—B', { dashes: 'keep' }).text).toBe('A—B');
  });
});

describe('locked content', () => {
  it('never edits direct quotes, citations, statistics, numbers, code or URLs', () => {
    const text = 'As Lee wrote, "this result plays a pivotal role in theory" (Lee, 2019, p. 4). It plays a pivotal role in practice, r(148) = .96, at 91.5% recall; see `delve_into()` and https://example.com/delve-into.';
    const out = cleanupText(text).text;
    expect(out).toContain('"this result plays a pivotal role in theory"');
    expect(out).toContain('(Lee, 2019, p. 4)');
    expect(out).toContain('It is central to practice');
    expect(out).toContain('r(148) = .96');
    expect(out).toContain('91.5%');
    expect(out).toContain('`delve_into()`');
    expect(out).toContain('https://example.com/delve-into.');
  });

  it('keeps IEEE citations exact', () => {
    expect(cleanupText('Depth plays a key role in accuracy [3], [4]–[6].').text).toBe('Depth is central to accuracy [3], [4]–[6].');
  });
});

describe('section-aware cleanup', () => {
  const sections = [
    { id: 'abstract', title: 'Abstract', content: 'We delve into sleep.' },
    { id: 'results', title: 'Results', content: 'Sleep plays a crucial role in recall.' },
    { id: 'conclusion', title: 'Conclusion', content: 'Clean prose already.' },
    { id: 'references', title: 'References', content: 'Smith, J. (2020). A multifaceted study. *Nature*.' },
  ];

  it('edits only the chosen sections and never the reference list', () => {
    const result = cleanupSections(sections, ['abstract', 'conclusion', 'references']);
    expect(result.map(r => r.sectionId)).toEqual(['abstract']); // conclusion had nothing to change
    expect(result[0].after).toBe('We examine sleep.');
  });
});
