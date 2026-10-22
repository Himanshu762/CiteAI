import { PDFDocument, StandardFonts, rgb, PDFFont, PDFPage } from 'pdf-lib';
import {
    AlignmentType, Document, Footer, Header, HeadingLevel, Packer, PageBreak, PageNumber, Paragraph, Table, TableCell, TableRow, TextRun, WidthType,
} from 'docx';
import { PaperSection } from './paper-generator';
import { Reference } from './references-api';
import { CitationStyle, CITATION_STYLES, formatReference } from './citation-formatter';
import { ReportTable } from './data-analysis/report';
import {
    LAYOUTS, StyleLayout, TitlePageInfo, headingText, isUnnumberedSection, parseRuns, stripItalics, surname, titlePageLines,
} from './export/layout';
import { DatasetSource, toBibTeX, toCSLJSON, toRIS } from './reference-files';

export type ExportFormat = 'pdf' | 'docx' | 'markdown' | 'latex';

export interface ExportOptions {
    format: ExportFormat;
    title: string;
    style?: CitationStyle;
    titlePage?: TitlePageInfo;
    /** Paper sources in reference-list order (LaTeX \cite keys; legacy reference appendix) */
    references?: Reference[];
    datasets?: DatasetSource[];
    /** false skips the title page / header block (used by tests and quick drafts) */
    includeCoverPage?: boolean;
    includeReferences?: boolean;
    // Accepted for older callers; layout now follows the citation style
    author?: string;
    includeTableOfContents?: boolean;
    fontSize?: number;
    lineSpacing?: number;
}

// Characters model output commonly contains that the standard PDF fonts (WinAnsi) cannot draw
const PDF_REPLACEMENTS: Record<string, string> = {
    '≈': '~', '≤': '<=', '≥': '>=', '≠': '!=', '→': '->', '←': '<-', '↔': '<->',
    '×': 'x', '−': '-', '‐': '-', '‑': '-', '√': 'sqrt', '∞': 'infinity', '∑': 'sum', '∆': 'delta', 'Δ': 'Delta',
    'α': 'alpha', 'β': 'beta', 'γ': 'gamma', 'δ': 'delta', 'ε': 'epsilon', 'η': 'eta', 'θ': 'theta', 'λ': 'lambda',
    'μ': 'mu', 'π': 'pi', 'ρ': 'rho', 'σ': 'sigma', 'τ': 'tau', 'φ': 'phi', 'χ': 'chi', 'ω': 'omega',
    ' ': ' ', ' ': ' ', ' ': ' ', '​': '',
};

/**
 * Make text drawable with a standard PDF font: map known symbols, drop anything else it can't encode
 */
export function toPdfSafeText(text: string, font: PDFFont): string {
    const encodable = new Set(font.getCharacterSet());
    let out = '';
    for (const ch of text.replace(/\t/g, ' ')) {
        const mapped = PDF_REPLACEMENTS[ch] ?? ch;
        for (const c of mapped) {
            if (encodable.has(c.codePointAt(0)!)) out += c;
        }
    }
    return out;
}

/**
 * Split section content into paragraphs; single newlines inside a paragraph become spaces
 */
export function toParagraphs(content: string): string[] {
    const paragraphs: string[] = [];
    let current: string[] = [];
    for (const raw of content.split('\n')) {
        const line = raw.trim();
        if (line) {
            current.push(line);
        } else if (current.length) {
            paragraphs.push(current.join(' '));
            current = [];
        }
    }
    if (current.length) paragraphs.push(current.join(' '));
    return paragraphs;
}

/** Sections in print order, with a references section appended for older callers that pass references separately */
function resolveSections(sections: PaperSection[], options: ExportOptions, style: CitationStyle): PaperSection[] {
    const hasReferences = sections.some(s => s.id === 'references');
    const refs = options.references ?? [];
    if (hasReferences || options.includeReferences === false || refs.length === 0) return sections;
    return [...sections, {
        id: 'references', title: CITATION_STYLES[style].referencesTitle, isGenerating: false, isComplete: true, wordCount: 0,
        content: refs.map((r, i) => formatReference(r, style, i + 1)).join('\n\n'),
    }];
}

// --- PDF ----------------------------------------------------------------------

// A word may span font changes ("*Journal*," is italic text plus a regular comma); it never breaks inside
interface Word {
    pieces: { text: string; font: PDFFont }[];
}

/** Split runs into words, gluing pieces that were not separated by whitespace in the source */
function runsToWords(text: string, fontFor: (italic: boolean) => PDFFont): Word[] {
    const words: Word[] = [];
    let gluable = false; // true when the previous piece ended without whitespace
    for (const run of parseRuns(text)) {
        const font = fontFor(run.italic);
        const tokens = run.text.split(/(\s+)/);
        for (const token of tokens) {
            if (!token) continue;
            if (/^\s+$/.test(token)) {
                gluable = false;
                continue;
            }
            const piece = { text: toPdfSafeText(token, font), font };
            if (!piece.text) continue;
            if (gluable && words.length) words[words.length - 1].pieces.push(piece);
            else words.push({ pieces: [piece] });
            gluable = true;
        }
    }
    return words;
}

/**
 * Export paper to PDF format, laid out to the citation style's student-paper conventions
 */
export async function exportToPDF(sections: PaperSection[], options: ExportOptions): Promise<Blob> {
    const style = options.style ?? 'apa';
    const layout: StyleLayout = LAYOUTS[style];
    const withCover = options.includeCoverPage !== false;
    const ordered = resolveSections(sections, options, style);

    const pdfDoc = await PDFDocument.create();
    const regular = await pdfDoc.embedFont(StandardFonts.TimesRoman);
    const bold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
    const italic = await pdfDoc.embedFont(StandardFonts.TimesRomanItalic);
    const boldItalic = await pdfDoc.embedFont(StandardFonts.TimesRomanBoldItalic);

    const size = 12;
    const pageWidth = 612; // US Letter
    const pageHeight = 792;
    const margin = 72; // 1 inch margins
    const halfInch = 36;
    const contentWidth = pageWidth - 2 * margin;
    const lineHeightFor = (fs: number) => fs * layout.lineSpacing * 1.15;
    const lineHeight = lineHeightFor(size);

    let page: PDFPage = pdfDoc.addPage([pageWidth, pageHeight]);
    let y = pageHeight - margin;
    const newPage = () => {
        page = pdfDoc.addPage([pageWidth, pageHeight]);
        y = pageHeight - margin;
    };
    const ensureSpace = (height: number) => {
        if (y - height < margin) newPage();
    };

    // Word-wrap text with *italic* runs; first and following lines can have different indents
    const writeRuns = (
        text: string,
        opts: { font?: PDFFont; align?: 'left' | 'center'; firstIndent?: number; hanging?: number; after?: number; fontSize?: number } = {}
    ) => {
        const fs = opts.fontSize ?? size;
        const lh = lineHeightFor(fs);
        const base = opts.font ?? regular;
        const words = runsToWords(text, isItalic => (isItalic ? (base === bold ? boldItalic : italic) : base));
        const space = regular.widthOfTextAtSize(' ', fs);
        const widthOf = (w: Word) => w.pieces.reduce((sum, p) => sum + p.font.widthOfTextAtSize(p.text, fs), 0);

        let line: Word[] = [];
        let lineWidth = 0;
        let first = true;
        const indentFor = (isFirst: boolean) => (isFirst ? opts.firstIndent ?? 0 : opts.hanging ?? 0);
        const flush = () => {
            if (!line.length) return;
            ensureSpace(lh);
            let x = opts.align === 'center' ? margin + (contentWidth - lineWidth) / 2 : margin + indentFor(first);
            for (const w of line) {
                for (const p of w.pieces) {
                    page.drawText(p.text, { x, y: y - fs, font: p.font, size: fs, color: rgb(0, 0, 0) });
                    x += p.font.widthOfTextAtSize(p.text, fs);
                }
                x += space;
            }
            y -= lh;
            line = [];
            lineWidth = 0;
            first = false;
        };
        for (const w of words) {
            const width = widthOf(w);
            if (line.length && lineWidth + space + width > contentWidth - indentFor(first)) flush();
            lineWidth += line.length ? space + width : width;
            line.push(w);
        }
        flush();
        y -= opts.after ?? 0;
    };

    const writeHeading = (text: string, opts: { bold?: boolean; align?: 'left' | 'center' } = {}) => {
        // Keep a heading with at least two lines of what follows
        ensureSpace(lineHeight * 3);
        // Tightly spaced styles need visible separation above headings
        if (layout.lineSpacing < 1.5 && y < pageHeight - margin) y -= size * 0.6;
        writeRuns(text, { font: opts.bold === false ? regular : bold, align: opts.align ?? layout.headingAlign });
    };

    const writeParagraph = (text: string, noIndent = false) => {
        writeRuns(text, { firstIndent: layout.firstLineIndent && !noIndent ? halfInch : 0, after: layout.paragraphGapPt });
    };

    // APA-style table: number and caption above, rules above/below the header and at the bottom, note below
    const drawRule = () => {
        page.drawLine({ start: { x: margin, y }, end: { x: margin + contentWidth, y }, thickness: 0.6, color: rgb(0, 0, 0) });
    };
    let tableNumber = 0;
    const writeTable = (table: ReportTable) => {
        tableNumber++;
        const cellSize = 9;
        const cellLine = cellSize * 1.3;
        const pad = 4;
        // Column widths proportional to content length, so long labels get room
        const lengths = table.headers.map((h, i) =>
            Math.min(30, Math.max(4, h.length, ...table.rows.map(r => (r[i] ?? '').length))));
        const total = lengths.reduce((a, b) => a + b, 0);
        const widths = lengths.map(l => (l / total) * contentWidth);

        ensureSpace(80);
        y -= 6;
        writeRuns(`Table ${tableNumber}`, { font: bold, fontSize: 11 });
        writeRuns(table.caption, { font: italic, fontSize: 11, after: 4 });

        const drawRow = (cells: string[], font: PDFFont) => {
            const wrapped = cells.map((c, i) => wrapText(toPdfSafeText(c ?? '', font), font, cellSize, widths[i] - pad * 2));
            // Extra bottom padding keeps descenders clear of the rule below the row
            const height = Math.max(1, ...wrapped.map(w => w.length)) * cellLine + pad * 2;
            if (y - height < margin) {
                newPage();
                drawRule();
            }
            let x = margin;
            wrapped.forEach((lines, i) => {
                lines.forEach((text, j) => {
                    page.drawText(text, { x: x + pad, y: y - pad - cellSize - j * cellLine, font, size: cellSize, color: rgb(0, 0, 0) });
                });
                x += widths[i];
            });
            y -= height;
        };

        drawRule();
        drawRow(table.headers, bold);
        drawRule();
        table.rows.forEach(row => drawRow(row, regular));
        drawRule();
        y -= 6;
        if (table.note) writeRuns(`*Note.* ${table.note}`, { fontSize: 9 });
        y -= 12;
    };

    // Opening: title page, MLA header block or IEEE title block
    const infoLines = titlePageLines(options.titlePage, style);
    const hasTitlePage = withCover && layout.opening === 'title-page';
    if (withCover) {
        if (layout.opening === 'title-page') {
            y = pageHeight - margin - lineHeight * 3;
            writeRuns(options.title, { font: bold, align: 'center' });
            y -= lineHeight;
            infoLines.forEach(l => writeRuns(l, { align: 'center' }));
            newPage();
        } else if (layout.opening === 'mla-header') {
            infoLines.forEach(l => writeRuns(l));
        } else {
            writeRuns(options.title, { font: bold, align: 'center', fontSize: 18, after: 6 });
            infoLines.forEach(l => writeRuns(l, { align: 'center', fontSize: 11 }));
            y -= lineHeight / 2;
        }
    }

    let numbered = 0;
    let titleRepeated = !(withCover && layout.repeatTitleBeforeBody);
    for (const section of ordered) {
        const isAbstract = section.id === 'abstract';

        if (section.id === 'references') {
            newPage();
            writeHeading(section.title, { bold: layout.referencesHeadingBold, align: style === 'harvard' ? 'left' : 'center' });
            for (const entry of toParagraphs(section.content)) {
                writeRuns(entry, { hanging: halfInch, after: layout.paragraphGapPt });
            }
            continue;
        }

        if (isAbstract && layout.abstractOwnPage && withCover) {
            writeHeading(section.title, { align: 'center' });
            toParagraphs(section.content).forEach(p => writeParagraph(p, true));
            newPage();
            continue;
        }

        if (!titleRepeated) {
            writeRuns(options.title, { font: style === 'mla' ? regular : bold, align: 'center' });
            titleRepeated = true;
        }

        const skipHeading = layout.omitIntroductionHeading && section.id === 'introduction' && withCover;
        if (!skipHeading) {
            writeHeading(isUnnumberedSection(section.id) ? section.title : headingText(section.title, layout, numbered));
        }
        if (layout.numberedHeadings && !isUnnumberedSection(section.id)) numbered++;

        toParagraphs(section.content).forEach(p => writeParagraph(p, isAbstract));
        section.tables?.forEach(writeTable);
    }

    // Page numbers (and the MLA running surname) on every page
    const runningName = layout.runningSurname ? surname(options.titlePage?.author) : '';
    pdfDoc.getPages().forEach((p, i) => {
        // Footer-numbered styles leave the title page unnumbered
        if (i === 0 && hasTitlePage && layout.pageNumbers === 'footer-center') return;
        const label = toPdfSafeText(runningName ? `${runningName} ${i + 1}` : String(i + 1), regular);
        const width = regular.widthOfTextAtSize(label, size);
        const at = layout.pageNumbers === 'header-right'
            ? { x: pageWidth - margin - width, y: pageHeight - halfInch - size }
            : { x: (pageWidth - width) / 2, y: halfInch };
        p.drawText(label, { ...at, font: regular, size, color: rgb(0, 0, 0) });
    });

    const pdfBytes = await pdfDoc.save();
    return new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
}

// --- Word ---------------------------------------------------------------------

type Alignment = (typeof AlignmentType)[keyof typeof AlignmentType];

function docxRuns(text: string): TextRun[] {
    return parseRuns(text).map(r => new TextRun({ text: r.text, italics: r.italic }));
}

function docxTable(table: ReportTable, number: number): (Paragraph | Table)[] {
    const cell = (text: string, isHeader = false) => new TableCell({
        children: [new Paragraph({ spacing: { line: 240, after: 0 }, children: [new TextRun({ text, bold: isHeader, size: 18 })] })],
    });
    return [
        new Paragraph({ spacing: { before: 240 }, keepNext: true, children: [new TextRun({ text: `Table ${number}`, bold: true })] }),
        new Paragraph({ keepNext: true, children: [new TextRun({ text: table.caption, italics: true })] }),
        new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
                new TableRow({ tableHeader: true, children: table.headers.map(h => cell(h, true)) }),
                ...table.rows.map(r => new TableRow({ children: table.headers.map((_, i) => cell(r[i] ?? '')) })),
            ],
        }),
        ...(table.note ? [new Paragraph({ children: [new TextRun({ text: 'Note. ', italics: true }), new TextRun(table.note)] })] : []),
    ];
}

/**
 * Export paper to DOCX format, laid out to the citation style's student-paper conventions
 */
export async function exportToDOCX(sections: PaperSection[], options: ExportOptions): Promise<Blob> {
    const style = options.style ?? 'apa';
    const layout = LAYOUTS[style];
    const withCover = options.includeCoverPage !== false;
    const ordered = resolveSections(sections, options, style);
    const infoLines = titlePageLines(options.titlePage, style);
    const indent = layout.firstLineIndent ? { firstLine: 720 } : undefined;
    const headingAlign = layout.headingAlign === 'center' ? AlignmentType.CENTER : AlignmentType.LEFT;
    const pageBreak = () => new Paragraph({ children: [new PageBreak()] });
    const empty = () => new Paragraph({ children: [] });
    const heading = (text: string, opts: { bold?: boolean; align?: Alignment } = {}) => new Paragraph({
        heading: HeadingLevel.HEADING_1,
        alignment: opts.align ?? headingAlign,
        keepNext: true,
        children: [new TextRun({ text, bold: opts.bold !== false })],
    });

    const body: (Paragraph | Table)[] = [];
    if (withCover) {
        if (layout.opening === 'title-page') {
            body.push(
                empty(), empty(), empty(),
                new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: options.title, bold: true })] }),
                empty(),
                ...infoLines.map(l => new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun(l)] })),
                pageBreak(),
            );
        } else if (layout.opening === 'mla-header') {
            body.push(...infoLines.map(l => new Paragraph({ children: [new TextRun(l)] })));
        } else {
            body.push(
                new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: options.title, bold: true, size: 36 })] }),
                ...infoLines.map(l => new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: l, size: 22 })] })),
                empty(),
            );
        }
    }

    let tableNumber = 0;
    let numbered = 0;
    let titleRepeated = !(withCover && layout.repeatTitleBeforeBody);
    for (const section of ordered) {
        if (section.id === 'references') {
            body.push(pageBreak(), heading(section.title, {
                bold: layout.referencesHeadingBold,
                align: style === 'harvard' ? AlignmentType.LEFT : AlignmentType.CENTER,
            }));
            for (const entry of toParagraphs(section.content)) {
                body.push(new Paragraph({ indent: { left: 720, hanging: 720 }, children: docxRuns(entry) }));
            }
            continue;
        }

        if (section.id === 'abstract' && layout.abstractOwnPage && withCover) {
            body.push(heading(section.title, { align: AlignmentType.CENTER }));
            toParagraphs(section.content).forEach(p => body.push(new Paragraph({ children: docxRuns(p) })));
            body.push(pageBreak());
            continue;
        }

        if (!titleRepeated) {
            body.push(new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: options.title, bold: style !== 'mla' })] }));
            titleRepeated = true;
        }

        const skipHeading = layout.omitIntroductionHeading && section.id === 'introduction' && withCover;
        if (!skipHeading) {
            body.push(heading(isUnnumberedSection(section.id) ? section.title : headingText(section.title, layout, numbered)));
        }
        if (layout.numberedHeadings && !isUnnumberedSection(section.id)) numbered++;

        for (const paragraph of toParagraphs(section.content)) {
            body.push(new Paragraph({ indent: section.id === 'abstract' ? undefined : indent, children: docxRuns(paragraph) }));
        }
        for (const table of section.tables ?? []) {
            tableNumber++;
            body.push(...docxTable(table, tableNumber));
        }
    }

    const runningName = layout.runningSurname ? surname(options.titlePage?.author) : '';
    const pageNumberParagraph = (alignment: Alignment) => new Paragraph({
        alignment,
        children: [...(runningName ? [new TextRun(`${runningName} `)] : []), new TextRun({ children: [PageNumber.CURRENT] })],
    });

    const doc = new Document({
        title: options.title,
        creator: options.titlePage?.author || options.author || 'CiteAI',
        styles: {
            default: {
                document: {
                    run: { font: 'Times New Roman', size: 24 },
                    paragraph: { spacing: { line: Math.round(240 * layout.lineSpacing), after: layout.paragraphGapPt * 20 } },
                },
            },
            // Word's built-in Heading 1 is blue Calibri; student papers want plain Times bold
            paragraphStyles: [{
                id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
                run: { font: 'Times New Roman', size: 24, bold: true, color: '000000' },
                paragraph: { spacing: { before: 0, after: layout.paragraphGapPt * 20 } },
            }],
        },
        sections: [{
            properties: {
                page: { margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } },
                // Footer-numbered styles leave the title page unnumbered
                titlePage: withCover && layout.opening === 'title-page' && layout.pageNumbers === 'footer-center',
            },
            ...(layout.pageNumbers === 'header-right'
                ? { headers: { default: new Header({ children: [pageNumberParagraph(AlignmentType.RIGHT)] }) } }
                : { footers: { default: new Footer({ children: [pageNumberParagraph(AlignmentType.CENTER)] }), first: new Footer({ children: [] }) } }),
            children: body,
        }],
    });

    return Packer.toBlob(doc);
}

// --- Download -----------------------------------------------------------------

/**
 * Download a blob as a file
 */
export function downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
}

export function safeFilename(title: string): string {
    return title.replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 80) || 'paper';
}

/**
 * Build the file for a paper export
 */
export async function exportPaper(sections: PaperSection[], options: ExportOptions): Promise<{ blob: Blob; filename: string }> {
    const name = safeFilename(options.title);
    switch (options.format) {
        case 'pdf':
            return { blob: await exportToPDF(sections, options), filename: `${name}.pdf` };
        case 'docx':
            return { blob: await exportToDOCX(sections, options), filename: `${name}.docx` };
        case 'markdown': {
            const { exportToMarkdown } = await import('./export/markdown');
            return { blob: new Blob([exportToMarkdown(sections, options)], { type: 'text/markdown' }), filename: `${name}.md` };
        }
        case 'latex': {
            const { exportToLatexZip } = await import('./export/latex');
            return { blob: await exportToLatexZip(sections, options), filename: `${name}_latex.zip` };
        }
    }
}

/**
 * Export and download paper
 */
export async function exportAndDownload(sections: PaperSection[], options: ExportOptions): Promise<void> {
    const { blob, filename } = await exportPaper(sections, options);
    downloadBlob(blob, filename);
}

export type ReferenceFileFormat = 'bib' | 'ris' | 'json';

/**
 * Download the paper's sources for a reference manager
 */
export function downloadReferences(format: ReferenceFileFormat, title: string, sources: Reference[], datasets: DatasetSource[] = []): void {
    const content = format === 'bib' ? toBibTeX(sources, datasets) : format === 'ris' ? toRIS(sources, datasets) : toCSLJSON(sources, datasets);
    const type = format === 'bib' ? 'application/x-bibtex' : format === 'ris' ? 'application/x-research-info-systems' : 'application/json';
    downloadBlob(new Blob([content], { type }), `${safeFilename(title)}_references.${format}`);
}

/** Plain text of a section for copying (italic markers removed) */
export const plainSectionText = (section: PaperSection) => stripItalics(section.content);

// Helper functions
function wrapText(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
    const words = text.split(' ').filter(Boolean);
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
        const testLine = currentLine + (currentLine ? ' ' : '') + word;
        const testWidth = font.widthOfTextAtSize(testLine, size);

        if (testWidth > maxWidth && currentLine) {
            lines.push(currentLine);
            currentLine = word;
        } else {
            currentLine = testLine;
        }
    }

    if (currentLine) {
        lines.push(currentLine);
    }

    return lines;
}
