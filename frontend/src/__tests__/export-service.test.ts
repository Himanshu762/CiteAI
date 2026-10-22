import { describe, it, expect } from 'vitest';
import { PDFDocument, StandardFonts } from 'pdf-lib';
import JSZip from 'jszip';
import { exportToPDF, exportToDOCX, toParagraphs, toPdfSafeText } from '../services/export-service';
import { PaperSection } from '../services/paper-generator';

const section = (title: string, content: string): PaperSection => ({
  id: title.toLowerCase(), title, content, isGenerating: false, isComplete: true, wordCount: 0,
});

// jsdom's Blob has no arrayBuffer()
const readBlob = (blob: Blob) => new Promise<ArrayBuffer>((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result as ArrayBuffer);
  reader.onerror = () => reject(reader.error);
  reader.readAsArrayBuffer(blob);
});

const longParagraph = Array.from({ length: 600 }, (_, i) => `word${i}`).join(' ');

describe('toParagraphs', () => {
  it('splits on blank lines and joins wrapped lines', () => {
    expect(toParagraphs('One\nstill one\n\n  \nTwo')).toEqual(['One still one', 'Two']);
  });
});

describe('toPdfSafeText', () => {
  it('maps math symbols and drops unencodable characters', async () => {
    const font = await (await PDFDocument.create()).embedFont(StandardFonts.TimesRoman);
    expect(toPdfSafeText('p ≤ 0.05, α ≈ 0.3 → 中', font)).toBe('p <= 0.05, alpha ~ 0.3 -> ');
  });
});

describe('exportToPDF', () => {
  it('handles symbols and line breaks that model output contains', async () => {
    const blob = await exportToPDF(
      [section('Results', 'Accuracy rose ≈12% (p ≤ 0.05).\nα = 0.3 → better.\n\nSecond paragraph.')],
      { format: 'pdf', title: 'Effects of α on β' },
    );
    expect(blob.size).toBeGreaterThan(1000);
  });

  it('continues long paragraphs onto new pages instead of dropping text', async () => {
    const blob = await exportToPDF([section('Body', longParagraph)], {
      format: 'pdf', title: 'T', includeCoverPage: false, includeTableOfContents: false,
    });
    const pdf = await PDFDocument.load(await readBlob(blob));
    // ~600 words at 12pt with 1.5 spacing needs more than one page
    expect(pdf.getPageCount()).toBeGreaterThan(1);
  });
});

describe('exportToDOCX', () => {
  it('produces a real Word package containing the section text', async () => {
    const blob = await exportToDOCX([section('Introduction', 'Hello & welcome <world>')], { format: 'docx', title: 'T' });
    const zip = await JSZip.loadAsync(await readBlob(blob));
    const xml = await zip.file('word/document.xml')!.async('string');
    expect(xml).toContain('Hello &amp; welcome &lt;world&gt;');
  });
});

const tableSection = (): PaperSection => ({
  ...section('Results', 'Findings are summarized below.'),
  tables: [
    { caption: 'Contingency table of school by passed', headers: ['school \\ passed', 'yes', 'no'], rows: [['A', '12', '18'], ['B', '20', '10']],
      note: "χ²(1, N = 60) = 4.29, p = .038, Cramér's V = .27" },
    { caption: 'Score by school', headers: ['school', 'n', 'Mean', 'SD'], rows: Array.from({ length: 80 }, (_, i) => [`Group ${i}`, '3', '1.00', '0.10']),
      note: 'F(2, 147) = 119.26, p < .001, η² = .62' },
  ],
});

describe('report tables in exports', () => {
  it('draws tables in the PDF, including statistics symbols and page breaks', async () => {
    const blob = await exportToPDF([tableSection()], { format: 'pdf', title: 'T', includeCoverPage: false, includeTableOfContents: false });
    const pdf = await PDFDocument.load(await readBlob(blob));
    expect(pdf.getPageCount()).toBeGreaterThan(1); // 80-row table spills onto a second page
  });

  it('writes real Word tables with numbered captions and notes', async () => {
    const blob = await exportToDOCX([tableSection()], { format: 'docx', title: 'T', includeCoverPage: false });
    const xml = await (await JSZip.loadAsync(await readBlob(blob))).file('word/document.xml')!.async('string');
    expect((xml.match(/<w:tbl>/g) || []).length).toBe(2);
    expect(xml).toContain('Table 2');
    expect(xml).toContain('η² = .62');
  });
});

describe('style layouts in Word', () => {
  const info = { author: 'Alex Rivera', institution: 'State University', course: 'CS 410', instructor: 'Dr. Shah', dueDate: '2026-10-22' };
  const paper = [
    section('Abstract', 'Summary.'),
    section('Introduction', 'Intro text.'),
    section('References', 'He, K. (2016). Title. *CVPR*.'),
  ];

  const files = async (style: 'apa' | 'mla' | 'harvard' | 'ieee') => {
    const blob = await exportToDOCX(paper, { format: 'docx', title: 'Deep Nets', style, titlePage: info });
    const zip = await JSZip.loadAsync(await readBlob(blob));
    const read = async (name: string) => (await zip.file(name)?.async('string')) ?? '';
    const names = Object.keys(zip.files);
    const headers = await Promise.all(names.filter(n => /word\/header\d*\.xml/.test(n)).map(read));
    const footers = await Promise.all(names.filter(n => /word\/footer\d*\.xml/.test(n)).map(read));
    return { doc: await read('word/document.xml'), styles: await read('word/styles.xml'), headers: headers.join(''), footers: footers.join('') };
  };

  it('APA: page number top right, title page lines, italic reference venue, double spacing', async () => {
    const { doc, styles, headers } = await files('apa');
    expect(headers).toContain('PAGE');
    expect(headers).toContain('w:val="right"');
    expect(doc).toContain('October 22, 2026');
    expect(doc).toMatch(/<w:i\/>[\s\S]*?CVPR/);
    expect(styles).toContain('w:line="480"');
    expect(styles).toMatch(/w:styleId="Heading1"[\s\S]*?w:color w:val="000000"/);
  });

  it('MLA: running surname in the header and the MLA date format', async () => {
    const { doc, headers } = await files('mla');
    expect(headers).toContain('Rivera ');
    expect(doc).toContain('22 October 2026');
    expect(doc).not.toContain('State University');
  });

  it('Harvard: footer page numbers with an unnumbered title page', async () => {
    const { doc, footers } = await files('harvard');
    expect(footers).toContain('PAGE');
    expect(doc).toContain('<w:titlePg/>');
  });

  it('IEEE: Roman-numbered headings', async () => {
    const { doc } = await files('ieee');
    expect(doc).toContain('I. INTRODUCTION');
  });
});
