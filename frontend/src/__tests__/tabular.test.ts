import { describe, it, expect } from 'vitest';
import { parseCSV, toCell, inferColumns, computeStatistics, sampleEvenly, loadDelimited } from '../../api/_lib/tabular';

describe('parseCSV', () => {
  it('handles quotes, escaped quotes, embedded newlines, BOM and CRLF', () => {
    const { headers, rows } = parseCSV('﻿name,quote,n\r\n"Lee, A.","She said ""hi""\nthen left",3\r\nKim,,4\r\n');
    expect(headers).toEqual(['name', 'quote', 'n']);
    expect(rows).toEqual([['Lee, A.', 'She said "hi"\nthen left', '3'], ['Kim', '', '4']]);
  });

  it('detects semicolon and tab delimiters and names blank/duplicate headers', () => {
    expect(parseCSV('a;b\n1;2').rows).toEqual([['1', '2']]);
    expect(parseCSV('a\tb\n1\t2').headers).toEqual(['a', 'b']);
    expect(parseCSV(',x,x\n1,2,3').headers).toEqual(['column_1', 'x', 'x_2']);
  });
});

describe('toCell', () => {
  it('parses numbers and missing markers, keeps codes and dates as text', () => {
    expect(toCell(' 3.5 ')).toBe(3.5);
    expect(toCell('1,234.5')).toBe(1234.5);
    expect(toCell('-2e3')).toBe(-2000);
    expect(toCell('NA')).toBeNull();
    expect(toCell('..')).toBeNull();
    expect(toCell('2020-01-05')).toBe('2020-01-05');
    expect(toCell('TRUE')).toBe(true);
  });
});

describe('inferColumns and statistics', () => {
  const { records, columns } = loadDelimited([
    'id,group,score,comment',
    ...Array.from({ length: 30 }, (_, i) => `${i},${i % 2 ? 'B' : 'A'},${i % 5 === 0 ? 'NA' : 50 + i},note number ${i} with some extra words to be long`),
  ].join('\n'));

  it('types columns and treats identifiers as non-analyzable', () => {
    expect(columns).toEqual([
      { name: 'id', kind: 'other' },
      { name: 'group', kind: 'categorical' },
      { name: 'score', kind: 'numeric' },
      { name: 'comment', kind: 'text' },
    ]);
  });

  it('computes whole-dataset statistics with missing counts', () => {
    const stats = computeStatistics(records, columns);
    expect(stats.numExamples).toBe(30);
    const score = stats.columns.find(c => c.name === 'score')!;
    expect(score.nanCount).toBe(6);
    expect(score.min).toBe(51);
    expect(score.max).toBe(79);
    expect(stats.columns.find(c => c.name === 'group')!.frequencies).toEqual({ A: 15, B: 15 });
  });

  it('samples evenly', () => {
    expect(sampleEvenly([0, 1, 2, 3, 4, 5, 6, 7, 8, 9], 5)).toEqual([0, 2, 4, 6, 8]);
  });
});
