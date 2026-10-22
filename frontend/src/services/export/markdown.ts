import { PaperSection } from '../paper-generator';
import { ReportTable } from '../data-analysis/report';
import type { ExportOptions } from '../export-service';
import { toParagraphs } from '../export-service';
import { LAYOUTS, headingText, isUnnumberedSection, titlePageLines } from './layout';

const cell = (text: string) => text.replace(/\|/g, '\\|');

function markdownTable(table: ReportTable, number: number): string {
    const lines = [
        `**Table ${number}**`,
        '',
        `*${table.caption}*`,
        '',
        `| ${table.headers.map(cell).join(' | ')} |`,
        `| ${table.headers.map(() => '---').join(' | ')} |`,
        ...table.rows.map(r => `| ${table.headers.map((_, i) => cell(r[i] ?? '')).join(' | ')} |`),
    ];
    if (table.note) lines.push('', `*Note.* ${table.note}`);
    return lines.join('\n');
}

/**
 * Markdown export: headings, paragraphs, tables and reference entries (italics kept as *text*)
 */
export function exportToMarkdown(sections: PaperSection[], options: ExportOptions): string {
    const style = options.style ?? 'apa';
    const layout = LAYOUTS[style];
    const parts: string[] = [`# ${options.title}`];
    const info = titlePageLines(options.titlePage, style);
    // Two trailing spaces force line breaks inside one Markdown paragraph
    if (info.length) parts.push(info.join('  \n'));

    let numbered = 0;
    let tableNumber = 0;
    for (const section of sections) {
        const label = isUnnumberedSection(section.id) ? section.title : headingText(section.title, layout, numbered);
        if (layout.numberedHeadings && !isUnnumberedSection(section.id)) numbered++;
        parts.push(`## ${label}`);
        parts.push(...toParagraphs(section.content));
        for (const table of section.tables ?? []) {
            tableNumber++;
            parts.push(markdownTable(table, tableNumber));
        }
    }
    return parts.join('\n\n') + '\n';
}
