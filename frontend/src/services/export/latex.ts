/**
 * LaTeX export: main.tex using biblatex plus references.bib, zipped.
 * In-text citations written in the chosen style are converted to \parencite / \textcite
 * (or \cite for IEEE) so the bibliography stays linked to the text.
 */

import JSZip from 'jszip';
import { PaperSection } from '../paper-generator';
import { ReportTable } from '../data-analysis/report';
import { CitationStyle, formatInTextCitation, formatNarrativeCitation, isNumberedStyle } from '../citation-formatter';
import { citationKeys, toBibTeX } from '../reference-files';
import type { ExportOptions } from '../export-service';
import { toParagraphs } from '../export-service';
import { LAYOUTS, stripItalics, titlePageLines } from './layout';

const BIBLATEX_STYLE: Record<CitationStyle, string> = {
    apa: 'apa',
    mla: 'mla',
    harvard: 'authoryear',
    ieee: 'ieee',
};

const SPACING: Record<number, string> = { 2: '\\doublespacing', 1.5: '\\onehalfspacing' };

export function escapeLatex(text: string): string {
    return text
        .replace(/\\/g, '')
        .replace(/([&%$#_{}])/g, '\\$1')
        .replace(/~/g, '\\textasciitilde{}')
        .replace(/\^/g, '\\textasciicircum{}')
        .replace(//g, '\\textbackslash{}');
}

// Placeholders survive escaping: private-use characters never occur in paper text and are not LaTeX-special
const placeholder = (kind: string, index: number) => `\uE000${kind}${index}\uE000`;

/**
 * Escape a paragraph and turn its citations into biblatex commands.
 * Citations the converter cannot match (for example several sources combined in one
 * parenthesis) stay as plain text.
 */
export function convertParagraph(text: string, style: CitationStyle, options: ExportOptions, keys: string[]): string {
    const sources = options.references ?? [];
    const commands: string[] = [];
    const hold = (command: string) => {
        commands.push(command);
        return placeholder('C', commands.length - 1);
    };

    let out = text;
    if (isNumberedStyle(style)) {
        out = out.replace(/\[(\d+(?:\s*[-–,]\s*\d+)*)\](?:\s*[-–]\s*\[(\d+)\])?/g, (match, inner: string, end?: string) => {
            const nums: number[] = [];
            for (const part of inner.split(',')) {
                const [a, b] = part.split(/[-–]/).map(x => Number(x.trim()));
                if (b !== undefined && !Number.isNaN(b)) for (let n = a; n <= b; n++) nums.push(n);
                else nums.push(a);
            }
            if (end) for (let n = nums[nums.length - 1] + 1; n <= Number(end); n++) nums.push(n);
            if (!nums.every(n => n >= 1 && n <= keys.length)) return match;
            return hold(`\\cite{${nums.map(n => keys[n - 1]).join(',')}}`);
        });
    } else {
        sources.forEach((ref, i) => {
            const parenthetical = stripItalics(formatInTextCitation(ref, style));
            const narrative = stripItalics(formatNarrativeCitation(ref, style));
            out = out.split(parenthetical).join(hold(`\\parencite{${keys[i]}}`));
            out = out.split(narrative).join(hold(`\\textcite{${keys[i]}}`));
        });
    }

    let escaped = escapeLatex(out).replace(/\*([^*\n]+)\*/g, '\\emph{$1}');
    escaped = escaped.replace(/C(\d+)/g, (_, n: string) => commands[Number(n)]);
    return escaped;
}

function latexTable(table: ReportTable): string {
    const cols = table.headers.map((_, i) => (i === 0 ? 'l' : 'r')).join('');
    const row = (cells: string[]) => table.headers.map((_, i) => escapeLatex(cells[i] ?? '')).join(' & ') + ' \\\\';
    return [
        '\\begin{table}[htbp]',
        '\\centering',
        `\\caption{${escapeLatex(table.caption)}}`,
        `\\begin{tabular}{${cols}}`,
        '\\toprule',
        row(table.headers),
        '\\midrule',
        ...table.rows.map(row),
        '\\bottomrule',
        '\\end{tabular}',
        ...(table.note ? ['\\par\\smallskip', `{\\footnotesize\\emph{Note.} ${escapeLatex(table.note)}}`] : []),
        '\\end{table}',
    ].join('\n');
}

export function buildLatex(sections: PaperSection[], options: ExportOptions): { tex: string; bib: string } {
    const style = options.style ?? 'apa';
    const layout = LAYOUTS[style];
    const sources = options.references ?? [];
    const datasets = options.datasets ?? [];
    const keys = citationKeys(sources, datasets);
    const info = titlePageLines(options.titlePage, style);

    const body: string[] = [];
    let referencesTitle = 'References';
    for (const section of sections) {
        if (section.id === 'references') {
            referencesTitle = section.title;
            continue; // biblatex prints the list from references.bib
        }
        const paragraphs = toParagraphs(section.content).map(p => convertParagraph(p, style, options, keys));
        if (section.id === 'abstract') {
            body.push('\\begin{abstract}', ...paragraphs, '\\end{abstract}');
            continue;
        }
        body.push(`\\section${layout.numberedHeadings ? '' : '*'}{${escapeLatex(section.title)}}`);
        body.push(paragraphs.join('\n\n'));
        section.tables?.forEach(t => body.push(latexTable(t)));
    }

    const tex = [
        '% Generated by CiteAI. Compile with LuaLaTeX and Biber, e.g. `latexmk -lualatex main.tex`',
        '% (on Overleaf: Menu > Compiler > LuaLaTeX). MLA style needs the biblatex-mla package.',
        '\\documentclass[12pt]{article}',
        '\\usepackage{fontspec}',
        '\\setmainfont{TeX Gyre Termes}',
        '\\usepackage[margin=1in]{geometry}',
        '\\usepackage{setspace}',
        '\\usepackage{booktabs}',
        '\\usepackage[hidelinks]{hyperref}',
        `\\usepackage[style=${BIBLATEX_STYLE[style]},backend=biber]{biblatex}`,
        '\\addbibresource{references.bib}',
        SPACING[layout.lineSpacing] ?? '',
        '',
        `\\title{${escapeLatex(options.title)}}`,
        `\\author{${info.map(escapeLatex).join(' \\\\ ')}}`,
        '\\date{}',
        '',
        '\\begin{document}',
        '\\maketitle',
        '',
        ...body,
        '',
        // Author-date styles list every selected source; IEEE lists only cited ones
        ...(sources.length || datasets.length
            ? [...(isNumberedStyle(style) ? [] : ['\\nocite{*}']), `\\printbibliography[title={${escapeLatex(referencesTitle)}}]`]
            : []),
        '\\end{document}',
        '',
    ].join('\n');

    return { tex, bib: toBibTeX(sources, datasets) };
}

export async function exportToLatexZip(sections: PaperSection[], options: ExportOptions): Promise<Blob> {
    const { tex, bib } = buildLatex(sections, options);
    const zip = new JSZip();
    zip.file('main.tex', tex);
    zip.file('references.bib', bib);
    return zip.generateAsync({ type: 'blob' });
}
