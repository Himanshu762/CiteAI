/**
 * Import an existing draft (.docx, .md, .txt, .tex) as paper sections, so it can be
 * formatted in a citation style and exported like a generated paper.
 */

import JSZip from 'jszip';
import type { PaperSection } from '../paper-generator';
import type { ReportTable } from '../data-analysis/report';

export interface ImportedDocument {
    title: string;
    sections: PaperSection[];
    warnings: string[];
}

const REFERENCE_HEADINGS = /^(references?|works cited|reference list|bibliography|literature cited|sources)$/i;

function sectionId(title: string): string {
    const t = title.trim();
    if (REFERENCE_HEADINGS.test(t)) return 'references';
    // Drop numbering like "1.", "II." or "2.3 " before matching standard names
    const bare = t.replace(/^((\d+(\.\d+)*)|([IVXLC]+))[.)]?\s+/i, '');
    const slug = bare.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
    return slug || 'section';
}

const countWords = (text: string) => text.trim().split(/\s+/).filter(Boolean).length;

function makeSection(title: string, paragraphs: string[], tables: ReportTable[] = []): PaperSection {
    const content = paragraphs.map(p => p.trim()).filter(Boolean).join('\n\n');
    const bare = title.trim().replace(/^((\d+(\.\d+)*)|([IVXLC]+))[.)]?\s+/i, '');
    return {
        id: sectionId(title),
        title: bare.length > 0 ? bare.charAt(0).toUpperCase() + bare.slice(1) : 'Section',
        content,
        isGenerating: false,
        isComplete: true,
        wordCount: countWords(content),
        ...(tables.length ? { tables } : {}),
    };
}

/** Keep section ids unique so React keys and lookups stay stable */
function dedupeIds(sections: PaperSection[]): PaperSection[] {
    const seen = new Map<string, number>();
    return sections.map(s => {
        const n = seen.get(s.id) ?? 0;
        seen.set(s.id, n + 1);
        return n === 0 ? s : { ...s, id: `${s.id}_${n + 1}` };
    });
}

function fileTitle(filename: string): string {
    return filename.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').trim() || 'Imported paper';
}

// --- Markdown / plain text ------------------------------------------------------

export function parseMarkdown(text: string, filename = 'document.md'): ImportedDocument {
    const lines = text.replace(/\r\n?/g, '\n').split('\n');
    let title = '';
    const sections: PaperSection[] = [];
    let current: { title: string; lines: string[] } | null = null;
    const preamble: string[] = [];

    const close = () => {
        if (!current) return;
        const paragraphs = current.lines.join('\n').split(/\n\s*\n/).map(p => p.replace(/\s*\n\s*/g, ' '));
        sections.push(makeSection(current.title, paragraphs));
    };

    for (const line of lines) {
        const heading = line.match(/^(#{1,6})\s+(.+?)\s*#*\s*$/);
        if (heading) {
            const level = heading[1].length;
            if (level === 1 && !title && sections.length === 0 && !current) {
                title = heading[2];
                continue;
            }
            close();
            current = { title: heading[2], lines: [] };
            continue;
        }
        if (current) current.lines.push(line);
        else preamble.push(line);
    }
    close();

    const warnings: string[] = [];
    const leading = preamble.join('\n').trim();
    if (sections.length === 0) {
        sections.push(makeSection('Main text', leading.split(/\n\s*\n/).map(p => p.replace(/\s*\n\s*/g, ' '))));
        warnings.push('No headings were found, so the document was imported as one section.');
    } else if (leading) {
        // Lines before the first heading (often the author block) are kept as their own section
        sections.unshift(makeSection('Front matter', leading.split(/\n\s*\n/).map(p => p.replace(/\s*\n\s*/g, ' '))));
        warnings.push('Text before the first heading was imported as "Front matter"; delete it if it is a title-page block.');
    }
    // Markdown bold and inline code have no place in the paper's plain text model
    for (const s of sections) {
        s.content = s.content.replace(/\*\*(.+?)\*\*/g, '$1').replace(/`([^`]+)`/g, '$1');
    }
    return { title: title || fileTitle(filename), sections: dedupeIds(sections), warnings };
}

// --- LaTeX ---------------------------------------------------------------------

function latexToText(tex: string, warnings: Set<string>): string {
    let s = tex;
    s = s.replace(/(^|[^\\])%.*$/gm, '$1'); // comments
    s = s.replace(/\\(emph|textit)\{([^{}]*)\}/g, '*$2*');
    s = s.replace(/\\(textbf|textsc|texttt|textrm|underline|mbox)\{([^{}]*)\}/g, '$2');
    s = s.replace(/\\(?:paren|text|auto|foot)?cite[tp]?\*?(?:\[[^\]]*\])*\{([^{}]*)\}/g, (_, keys: string) => {
        warnings.add('LaTeX \\cite keys were kept as [key] placeholders; import the .bib in a reference manager to resolve them.');
        return `[${keys.split(',').map(k => k.trim()).join(', ')}]`;
    });
    s = s.replace(/\\label\{[^{}]*\}/g, '');
    // LaTeX prints ?? for unresolved references; do the same so the gap is easy to spot
    s = s.replace(/\\(ref|eqref|pageref)\{[^{}]*\}/g, () => {
        warnings.add('Cross-references (\\ref) cannot be carried over and are shown as ??.');
        return '??';
    });
    s = s.replace(/\$([^$]+)\$/g, '$1');
    s = s.replace(/\\(%|&|\$|#|_|\{|\})/g, '$1');
    s = s.replace(/~/g, ' ').replace(/``|''/g, '"').replace(/---/g, '—').replace(/--/g, '–');
    s = s.replace(/\\[a-zA-Z]+\*?(\[[^\]]*\])?(\{([^{}]*)\})?/g, (_, __, group?: string, inner?: string) => (group ? inner ?? '' : ''));
    return s.replace(/[{}]/g, '');
}

export function parseLatex(text: string, filename = 'document.tex'): ImportedDocument {
    const warnings = new Set<string>();
    const src = text.replace(/\r\n?/g, '\n');
    const title = src.match(/\\title\{([^{}]*)\}/)?.[1]?.trim();
    const bodyMatch = src.match(/\\begin\{document\}([\s\S]*?)\\end\{document\}/);
    let body = bodyMatch ? bodyMatch[1] : src;

    if (/\\begin\{(figure|table)\*?\}/.test(body)) {
        warnings.add('Figures and LaTeX tables were left out; add them back after exporting.');
        body = body.replace(/\\begin\{(figure|table)\*?\}[\s\S]*?\\end\{\1\*?\}/g, '');
    }
    body = body.replace(/\\begin\{(equation|align|gather|multline)\*?\}[\s\S]*?\\end\{\1\*?\}/g, () => {
        warnings.add('Display equations were left out.');
        return '';
    });

    const sections: PaperSection[] = [];
    const abstract = body.match(/\\begin\{abstract\}([\s\S]*?)\\end\{abstract\}/);
    if (abstract) {
        sections.push(makeSection('Abstract', latexToText(abstract[1], warnings).split(/\n\s*\n/)));
        body = body.replace(abstract[0], '');
    }

    // thebibliography entries become the reference list
    const bibliography = body.match(/\\begin\{thebibliography\}\{[^}]*\}([\s\S]*?)\\end\{thebibliography\}/);
    let referenceEntries: string[] = [];
    if (bibliography) {
        referenceEntries = bibliography[1].split(/\\bibitem(?:\[[^\]]*\])?\{[^}]*\}/).map(e => latexToText(e, warnings).replace(/\s+/g, ' ').trim()).filter(Boolean);
        body = body.replace(bibliography[0], '');
    }
    if (/\\(printbibliography|bibliography)\b/.test(body) && !bibliography) {
        warnings.add('The bibliography is generated from a .bib file by LaTeX, so no reference list was imported.');
    }

    const parts = body.split(/\\(?:sub)*section\*?\{([^{}]*)\}/);
    // parts: [preamble, title1, content1, title2, content2, ...]
    for (let i = 1; i < parts.length; i += 2) {
        const paragraphs = latexToText(parts[i + 1] ?? '', warnings).split(/\n\s*\n/).map(p => p.replace(/\s*\n\s*/g, ' '));
        sections.push(makeSection(parts[i], paragraphs));
    }
    if (parts.length === 1) {
        sections.push(makeSection('Main text', latexToText(parts[0], warnings).split(/\n\s*\n/).map(p => p.replace(/\s*\n\s*/g, ' '))));
        warnings.add('No \\section commands were found, so the document was imported as one section.');
    }
    if (referenceEntries.length) sections.push(makeSection('References', referenceEntries));

    return {
        title: title ? latexToText(title, warnings) : fileTitle(filename),
        sections: dedupeIds(sections.filter(s => s.content || s.id === 'references')),
        warnings: [...warnings],
    };
}

// --- Word (.docx) --------------------------------------------------------------

const W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';

function paragraphText(p: Element): string {
    let out = '';
    for (const run of Array.from(p.getElementsByTagNameNS(W, 'r'))) {
        const italic = run.getElementsByTagNameNS(W, 'i').length > 0 &&
            run.getElementsByTagNameNS(W, 'i')[0].getAttributeNS(W, 'val') !== '0' &&
            run.getElementsByTagNameNS(W, 'i')[0].getAttributeNS(W, 'val') !== 'false';
        let text = '';
        for (const node of Array.from(run.childNodes)) {
            const el = node as Element;
            if (el.localName === 't') text += el.textContent ?? '';
            else if (el.localName === 'tab') text += ' ';
            else if (el.localName === 'br') text += ' ';
        }
        out += italic && text.trim() ? text.replace(/^(\s*)(.*?)(\s*)$/, '$1*$2*$3') : text;
    }
    return out.replace(/\*\*/g, '').replace(/\s+/g, ' ').trim();
}

function headingLevel(p: Element, styleNames: Map<string, string>): number | 'title' | null {
    const style = p.getElementsByTagNameNS(W, 'pStyle')[0]?.getAttributeNS(W, 'val') ?? '';
    const name = (styleNames.get(style) ?? style).toLowerCase().replace(/\s+/g, '');
    if (name === 'title') return 'title';
    const m = name.match(/^heading(\d)$/);
    if (m) return Number(m[1]);
    const outline = p.getElementsByTagNameNS(W, 'outlineLvl')[0]?.getAttributeNS(W, 'val');
    return outline !== undefined && outline !== null && outline !== '' ? Number(outline) + 1 : null;
}

function tableFromXml(tbl: Element): ReportTable | null {
    const rows = Array.from(tbl.getElementsByTagNameNS(W, 'tr')).map(tr =>
        Array.from(tr.getElementsByTagNameNS(W, 'tc')).map(tc =>
            Array.from(tc.getElementsByTagNameNS(W, 'p')).map(paragraphText).join(' ').replace(/\*/g, '')));
    if (rows.length < 2) return null;
    return { caption: 'Imported table', headers: rows[0], rows: rows.slice(1) };
}

export async function parseDocx(data: ArrayBuffer, filename = 'document.docx'): Promise<ImportedDocument> {
    const zip = await JSZip.loadAsync(data);
    const xml = await zip.file('word/document.xml')?.async('string');
    if (!xml) throw new Error('This file is not a Word document (word/document.xml is missing).');

    // Map style ids to names: localized Word versions use ids like "berschrift1"
    const styleNames = new Map<string, string>();
    const stylesXml = await zip.file('word/styles.xml')?.async('string');
    if (stylesXml) {
        const styles = new DOMParser().parseFromString(stylesXml, 'application/xml');
        for (const st of Array.from(styles.getElementsByTagNameNS(W, 'style'))) {
            const id = st.getAttributeNS(W, 'styleId');
            const name = st.getElementsByTagNameNS(W, 'name')[0]?.getAttributeNS(W, 'val');
            if (id && name) styleNames.set(id, name);
        }
    }

    const doc = new DOMParser().parseFromString(xml, 'application/xml');
    const body = doc.getElementsByTagNameNS(W, 'body')[0];
    const warnings: string[] = [];
    let title = '';
    const sections: PaperSection[] = [];
    let current: { title: string; paragraphs: string[]; tables: ReportTable[] } = { title: 'Front matter', paragraphs: [], tables: [] };
    const close = () => {
        if (current.paragraphs.some(p => p.trim()) || current.tables.length) {
            sections.push(makeSection(current.title, current.paragraphs, current.tables));
        }
    };

    let sawHeading = false;
    for (const node of Array.from(body.childNodes)) {
        const el = node as Element;
        if (el.localName === 'p') {
            const text = paragraphText(el);
            const level = headingLevel(el, styleNames);
            if (level === 'title' && !title) {
                title = text.replace(/\*/g, '');
                continue;
            }
            if (typeof level === 'number' && text) {
                sawHeading = true;
                close();
                current = { title: text.replace(/\*/g, ''), paragraphs: [], tables: [] };
                continue;
            }
            if (text) current.paragraphs.push(text);
        } else if (el.localName === 'tbl') {
            const table = tableFromXml(el);
            if (table) current.tables.push(table);
        }
    }
    close();

    if (!sawHeading) {
        warnings.push('No Word heading styles were found, so the document was imported as one section. Apply Heading 1 to section titles for better results.');
        if (sections[0]) sections[0] = { ...sections[0], title: 'Main text', id: 'main_text' };
    } else if (sections[0]?.title === 'Front matter') {
        warnings.push('Text before the first heading was imported as "Front matter"; delete it if it is a title-page block.');
    }
    if (sections.some(s => s.tables?.length)) {
        warnings.push('Word tables were imported with the caption "Imported table"; edit captions after exporting.');
    }
    if (Object.keys(zip.files).some(n => n.startsWith('word/media/'))) {
        warnings.push('Images were left out; add them back after exporting.');
    }

    return { title: title || fileTitle(filename), sections: dedupeIds(sections), warnings };
}

/**
 * Import a file chosen by the user
 */
export async function importDocument(file: File): Promise<ImportedDocument> {
    const name = file.name.toLowerCase();
    if (name.endsWith('.docx')) return parseDocx(await file.arrayBuffer(), file.name);
    if (name.endsWith('.tex')) return parseLatex(await file.text(), file.name);
    if (name.endsWith('.md') || name.endsWith('.markdown') || name.endsWith('.txt')) return parseMarkdown(await file.text(), file.name);
    throw new Error('Unsupported file type. Import a .docx, .md, .txt or .tex file.');
}
