import { describe, it, expect } from 'vitest';
import { formatDueDate, headingText, LAYOUTS, parseRuns, titlePageLines } from '../services/export/layout';
import { exportToMarkdown } from '../services/export/markdown';
import { buildLatex, convertParagraph, escapeLatex } from '../services/export/latex';
import { PaperSection } from '../services/paper-generator';
import { Reference } from '../services/references-api';

const section = (id: string, title: string, content: string, extra: Partial<PaperSection> = {}): PaperSection => ({
  id, title, content, isGenerating: false, isComplete: true, wordCount: 0, ...extra,
});

const resnet: Reference = {
  id: '1', title: 'Deep residual learning', year: 2016, venue: 'CVPR',
  authors: [{ name: 'Kaiming He' }, { name: 'Xiangyu Zhang' }, { name: 'Shaoqing Ren' }],
};
const ioffe: Reference = { id: '2', title: 'Batch normalization', year: 2015, venue: 'ICML', authors: [{ name: 'Sergey Ioffe' }] };
const info = { author: 'Alex Rivera', institution: 'State University', course: 'CS 410', instructor: 'Dr. Shah', dueDate: '2026-10-22' };

describe('layout helpers', () => {
  it('parses italic runs', () => {
    expect(parseRuns('In *CVPR*, 2016.')).toEqual([
      { text: 'In ', italic: false }, { text: 'CVPR', italic: true }, { text: ', 2016.', italic: false },
    ]);
  });

  it('formats dates per style and keeps free-form dates', () => {
    expect(formatDueDate('2026-10-22', 'apa')).toBe('October 22, 2026');
    expect(formatDueDate('2026-10-22', 'mla')).toBe('22 October 2026');
    expect(formatDueDate('Fall term', 'apa')).toBe('Fall term');
  });

  it('orders title page lines per style and skips blanks', () => {
    expect(titlePageLines(info, 'apa')).toEqual(['Alex Rivera', 'State University', 'CS 410', 'Dr. Shah', 'October 22, 2026']);
    expect(titlePageLines({ ...info, institution: '' }, 'mla')).toEqual(['Alex Rivera', 'Dr. Shah', 'CS 410', '22 October 2026']);
  });

  it('numbers IEEE headings with Roman numerals', () => {
    expect(headingText('Introduction', LAYOUTS.ieee, 0)).toBe('I. INTRODUCTION');
    expect(headingText('Introduction', LAYOUTS.apa, 0)).toBe('Introduction');
  });
});

describe('Markdown export', () => {
  it('writes headings, paragraphs, tables and italic references', () => {
    const md = exportToMarkdown([
      section('results', 'Results', 'First line\nsame paragraph.\n\nSecond.', {
        tables: [{ caption: 'Scores', headers: ['Group', 'Mean'], rows: [['A|B', '1.00']], note: 'N = 10.' }],
      }),
      section('references', 'Works Cited', 'He, Kaiming, et al. "Deep residual learning." *CVPR*, 2016.'),
    ], { format: 'markdown', title: 'My Paper', style: 'mla', titlePage: info });
    expect(md).toContain('# My Paper\n\nAlex Rivera  \nDr. Shah  \nCS 410  \n22 October 2026');
    expect(md).toContain('## Results\n\nFirst line same paragraph.\n\nSecond.');
    expect(md).toContain('| A\\|B | 1.00 |');
    expect(md).toContain('*Note.* N = 10.');
    expect(md).toContain('## Works Cited\n\nHe, Kaiming, et al. "Deep residual learning." *CVPR*, 2016.');
  });
});

describe('LaTeX export', () => {
  it('escapes special characters', () => {
    expect(escapeLatex('50% of R&D_costs {x} ~ \\')).toBe('50\\% of R\\&D\\_costs \\{x\\} \\textasciitilde{} \\textbackslash{}');
  });

  it('converts author-date citations to biblatex commands', () => {
    const out = convertParagraph(
      'He et al. (2016) showed depth helps (He et al., 2016), and normalization speeds training (Ioffe, 2015). Costs rose 5%.',
      'apa', { format: 'latex', title: 'T', references: [resnet, ioffe] }, ['he2016deep', 'ioffe2015batch'],
    );
    expect(out).toBe('\\textcite{he2016deep} showed depth helps \\parencite{he2016deep}, and normalization speeds training \\parencite{ioffe2015batch}. Costs rose 5\\%.');
  });

  it('converts IEEE numbers, groups and ranges to \\cite', () => {
    const keys = ['a', 'b', 'c'];
    const opts = { format: 'latex' as const, title: 'T', references: [resnet, ioffe, resnet] };
    expect(convertParagraph('As shown [1], [2, 3] and [1]–[3]; not [9].', 'ieee', opts, keys))
      .toBe('As shown \\cite{a}, \\cite{b,c} and \\cite{a,b,c}; not [9].');
  });

  it('builds a document with the style package and bibliography', () => {
    const { tex, bib } = buildLatex([
      section('abstract', 'Abstract', 'Summary.'),
      section('introduction', 'Introduction', 'Depth helps (He et al., 2016).'),
      section('references', 'References', 'ignored, biblatex prints the list'),
    ], { format: 'latex', title: 'Deep Nets', style: 'apa', titlePage: info, references: [resnet] });
    expect(tex).toContain('\\usepackage[style=apa,backend=biber]{biblatex}');
    expect(tex).toContain('\\doublespacing');
    expect(tex).toContain('\\begin{abstract}\nSummary.\n\\end{abstract}');
    expect(tex).toContain('\\section*{Introduction}\nDepth helps \\parencite{he2016deep}.');
    expect(tex).toContain('\\printbibliography[title={References}]');
    expect(tex).not.toContain('ignored, biblatex');
    expect(bib).toContain('@article{he2016deep,');
  });
});
