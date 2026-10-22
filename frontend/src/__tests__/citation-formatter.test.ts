import { describe, it, expect } from 'vitest';
import {
  formatAPAReference,
  formatAPAInTextCitation,
  formatAPANarrativeCitation,
  generateReferenceList,
  validateAPACitation,
} from '../services/citation-formatter';
import { Reference } from '../services/references-api';

const ref = (overrides: Partial<Reference> = {}): Reference => ({
  id: '1',
  title: 'Attention is all you need',
  authors: [{ name: 'Ashish Vaswani' }],
  year: 2017,
  ...overrides,
});

describe('formatAPAReference', () => {
  it('formats a single author with venue and DOI', () => {
    expect(formatAPAReference(ref({ venue: 'NeurIPS', doi: '10.1000/xyz' })))
      .toBe('Vaswani, A. (2017). Attention is all you need. *NeurIPS*. https://doi.org/10.1000/xyz');
  });

  it('joins two authors with an ampersand', () => {
    const out = formatAPAReference(ref({ authors: [{ name: 'Jane Doe' }, { name: 'John Smith' }] }));
    expect(out.startsWith('Doe, J., & Smith, J. (2017).')).toBe(true);
  });

  it('lists up to 20 authors with an ampersand before the last', () => {
    const out = formatAPAReference(ref({ authors: [{ name: 'A B' }, { name: 'C D' }, { name: 'E F' }] }));
    expect(out.startsWith('B, A., D, C., & F, E. (2017).')).toBe(true);
  });

  it('uses an ellipsis after 19 authors when there are more than 20', () => {
    const authors = Array.from({ length: 25 }, (_, i) => ({ name: `First Last${i}` }));
    const out = formatAPAReference(ref({ authors }));
    expect(out).toContain('Last18, F., ... Last24, F.');
    expect(out).not.toContain('Last19');
  });

  it('falls back to n.d. without a year', () => {
    expect(formatAPAReference(ref({ year: 0 }))).toContain('(n.d.)');
  });
});

describe('in-text citations', () => {
  it('handles one, two and three-plus authors', () => {
    expect(formatAPAInTextCitation(ref())).toBe('(Vaswani, 2017)');
    expect(formatAPAInTextCitation(ref({ authors: [{ name: 'Jane Doe' }, { name: 'John Smith' }] })))
      .toBe('(Doe & Smith, 2017)');
    expect(formatAPAInTextCitation(ref({ authors: [{ name: 'A B' }, { name: 'C D' }, { name: 'E F' }] })))
      .toBe('(B et al., 2017)');
  });

  it('adds a page number when given', () => {
    expect(formatAPAInTextCitation(ref(), '12')).toBe('(Vaswani, 2017, p. 12)');
  });

  it('uses a shortened title when there are no authors', () => {
    expect(formatAPAInTextCitation(ref({ authors: [], title: 'A very long title that keeps going on' })))
      .toBe('("A very long title that keeps g...", 2017)');
  });

  it('formats narrative citations', () => {
    expect(formatAPANarrativeCitation(ref({ authors: [{ name: 'Jane Doe' }, { name: 'John Smith' }] })))
      .toBe('Doe and Smith (2017)');
  });
});

describe('generateReferenceList', () => {
  it('sorts by first author last name', () => {
    const list = generateReferenceList([
      ref({ id: 'z', authors: [{ name: 'Zed Zulu' }] }),
      ref({ id: 'a', authors: [{ name: 'Amy Alpha' }] }),
    ]);
    expect(list.indexOf('Alpha')).toBeLessThan(list.indexOf('Zulu'));
    expect(list.split('\n\n')).toHaveLength(2);
  });
});

describe('validateAPACitation', () => {
  it('accepts a formatted reference', () => {
    expect(validateAPACitation(formatAPAReference(ref())).valid).toBe(true);
  });

  it('reports a missing year', () => {
    expect(validateAPACitation('Vaswani, A. Attention.').issues).toContain('Missing or improperly formatted year');
  });
});

describe('missing metadata', () => {
  it('cites a work with no year as n.d. and no authors by title', () => {
    expect(formatAPAInTextCitation(ref({ year: 0, authors: [], title: 'Short title' }))).toBe('("Short title", n.d.)');
  });
});
