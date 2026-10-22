import { describe, it, expect } from 'vitest';
import { parseDocx, parseLatex, parseMarkdown } from '../services/import/parse-document';
import { exportToDOCX } from '../services/export-service';
import { PaperSection } from '../services/paper-generator';

const readBlob = (blob: Blob) => new Promise<ArrayBuffer>((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result as ArrayBuffer);
  reader.onerror = () => reject(reader.error);
  reader.readAsArrayBuffer(blob);
});

const section = (id: string, title: string, content: string, extra: Partial<PaperSection> = {}): PaperSection => ({
  id, title, content, isGenerating: false, isComplete: true, wordCount: 0, ...extra,
});

describe('Markdown import', () => {
  it('uses the H1 as title and headings as sections', () => {
    const doc = parseMarkdown('# Deep Nets\n\n## Abstract\nShort **summary**.\n\n## 1. Introduction\nLine one\nline two.\n\nSecond paragraph.\n\n## Works Cited\nHe, K. *CVPR*.');
    expect(doc.title).toBe('Deep Nets');
    expect(doc.sections.map(s => [s.id, s.title])).toEqual([['abstract', 'Abstract'], ['introduction', 'Introduction'], ['references', 'Works Cited']]);
    expect(doc.sections[0].content).toBe('Short summary.');
    expect(doc.sections[1].content).toBe('Line one line two.\n\nSecond paragraph.');
    expect(doc.sections[2].content).toBe('He, K. *CVPR*.');
    expect(doc.warnings).toEqual([]);
  });

  it('imports plain text without headings as one section and says so', () => {
    const doc = parseMarkdown('Just some text.\n\nMore text.', 'my_essay.txt');
    expect(doc.title).toBe('my essay');
    expect(doc.sections).toHaveLength(1);
    expect(doc.warnings[0]).toContain('No headings');
  });
});

describe('LaTeX import', () => {
  it('reads title, abstract, sections, citations and thebibliography', () => {
    const doc = parseLatex(String.raw`\documentclass{article}
\title{Depth \& Width}
\begin{document}
\maketitle
\begin{abstract}
We study \emph{depth}. % a comment
\end{abstract}
\section{Introduction}
Depth helps \cite{he2016,ioffe2015}, see Fig.~\ref{fig:a}.
\begin{figure}\includegraphics{x}\end{figure}
\subsection*{Background}
Costs fell 5\%.
\begin{thebibliography}{9}
\bibitem{he2016} K. He, \emph{Deep residual learning}, 2016.
\end{thebibliography}
\end{document}`);
    expect(doc.title).toBe('Depth & Width');
    expect(doc.sections.map(s => s.id)).toEqual(['abstract', 'introduction', 'background', 'references']);
    expect(doc.sections[0].content).toBe('We study *depth*.');
    expect(doc.sections[1].content).toBe('Depth helps [he2016, ioffe2015], see Fig. ??.');
    expect(doc.sections[2].content).toBe('Costs fell 5%.');
    expect(doc.sections[3].content).toBe('K. He, *Deep residual learning*, 2016.');
    expect(doc.warnings.join(' ')).toContain('\\cite keys');
    expect(doc.warnings.join(' ')).toContain('Figures');
  });
});

describe('Word import', () => {
  it('round-trips a CiteAI Word export: headings, italics and tables', async () => {
    const blob = await exportToDOCX([
      section('abstract', 'Abstract', 'A short summary.'),
      section('results', 'Results', 'Scores rose.', { tables: [{ caption: 'Scores', headers: ['Group', 'Mean'], rows: [['A', '1.00'], ['B', '2.00']] }] }),
      section('references', 'References', 'He, K. (2016). Deep residual learning. *CVPR*.'),
    ], { format: 'docx', title: 'Deep Nets', style: 'harvard', includeCoverPage: false });

    const doc = await parseDocx(await readBlob(blob), 'paper.docx');
    expect(doc.sections.map(s => s.id)).toEqual(['abstract', 'results', 'references']);
    expect(doc.sections[1].tables?.[0]).toEqual({ caption: 'Imported table', headers: ['Group', 'Mean'], rows: [['A', '1.00'], ['B', '2.00']] });
    expect(doc.sections[2].content).toBe('He, K. (2016). Deep residual learning. *CVPR*.');
  });

  it('rejects files that are not Word documents', async () => {
    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();
    zip.file('hello.txt', 'hi');
    const blob = await zip.generateAsync({ type: 'blob' });
    await expect(parseDocx(await readBlob(blob))).rejects.toThrow('not a Word document');
  });
});
