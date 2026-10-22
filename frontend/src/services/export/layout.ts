/**
 * Page layout rules per citation style, shared by the PDF, Word, Markdown and LaTeX exports.
 * Student-paper conventions: APA 7 (student paper), MLA 9, Harvard (Cite Them Right), IEEE.
 */

import { CitationStyle } from '../citation-formatter';

export interface TitlePageInfo {
    author: string;
    institution: string;
    course: string;
    instructor: string;
    dueDate: string;
}

export interface StyleLayout {
    opening: 'title-page' | 'mla-header' | 'title-block';
    lineSpacing: number;
    firstLineIndent: boolean;     // Indent paragraphs 0.5" instead of spacing them apart
    paragraphGapPt: number;       // Space after each paragraph when not indenting
    headingAlign: 'center' | 'left';
    numberedHeadings: boolean;    // IEEE: I. INTRODUCTION
    referencesHeadingBold: boolean;
    pageNumbers: 'header-right' | 'footer-center';
    runningSurname: boolean;      // MLA: "Surname 3" in the header
    abstractOwnPage: boolean;     // APA puts the abstract on page 2
    repeatTitleBeforeBody: boolean; // APA and MLA print the title above the first body section
    omitIntroductionHeading: boolean; // APA: the repeated title serves as the introduction's heading
}

export const LAYOUTS: Record<CitationStyle, StyleLayout> = {
    apa: {
        opening: 'title-page', lineSpacing: 2, firstLineIndent: true, paragraphGapPt: 0,
        headingAlign: 'center', numberedHeadings: false, referencesHeadingBold: true,
        pageNumbers: 'header-right', runningSurname: false, abstractOwnPage: true,
        repeatTitleBeforeBody: true, omitIntroductionHeading: true,
    },
    mla: {
        opening: 'mla-header', lineSpacing: 2, firstLineIndent: true, paragraphGapPt: 0,
        headingAlign: 'left', numberedHeadings: false, referencesHeadingBold: false,
        pageNumbers: 'header-right', runningSurname: true, abstractOwnPage: false,
        repeatTitleBeforeBody: true, omitIntroductionHeading: false,
    },
    harvard: {
        opening: 'title-page', lineSpacing: 1.5, firstLineIndent: false, paragraphGapPt: 9,
        headingAlign: 'left', numberedHeadings: false, referencesHeadingBold: true,
        pageNumbers: 'footer-center', runningSurname: false, abstractOwnPage: false,
        repeatTitleBeforeBody: false, omitIntroductionHeading: false,
    },
    ieee: {
        opening: 'title-block', lineSpacing: 1.15, firstLineIndent: true, paragraphGapPt: 0,
        headingAlign: 'center', numberedHeadings: true, referencesHeadingBold: false,
        pageNumbers: 'footer-center', runningSurname: false, abstractOwnPage: false,
        repeatTitleBeforeBody: false, omitIntroductionHeading: false,
    },
};

export interface TextRun {
    text: string;
    italic: boolean;
}

/** Split text on *italic* markers (used in reference entries) */
export function parseRuns(text: string): TextRun[] {
    const runs: TextRun[] = [];
    const re = /\*([^*\n]+)\*/g;
    let last = 0;
    for (const m of text.matchAll(re)) {
        if (m.index! > last) runs.push({ text: text.slice(last, m.index), italic: false });
        runs.push({ text: m[1], italic: true });
        last = m.index! + m[0].length;
    }
    if (last < text.length) runs.push({ text: text.slice(last), italic: false });
    return runs.filter(r => r.text);
}

export const stripItalics = (text: string) => text.replace(/\*([^*\n]+)\*/g, '$1');

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];

/** Heading text as the style prints it; `index` counts numbered body sections from 0 */
export function headingText(title: string, layout: StyleLayout, index: number): string {
    if (!layout.numberedHeadings) return title;
    return `${ROMAN[index] ?? index + 1}. ${title.toUpperCase()}`;
}

/** Sections that are never numbered in IEEE-style headings */
export const isUnnumberedSection = (id: string) => id === 'abstract' || id === 'references';

/** APA: "October 22, 2026"; MLA: "22 October 2026". Non-ISO input is printed as typed. */
export function formatDueDate(value: string, style: CitationStyle): string {
    const m = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!m) return value;
    const date = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    const month = date.toLocaleString('en-US', { month: 'long' });
    return style === 'mla' ? `${date.getDate()} ${month} ${date.getFullYear()}` : `${month} ${date.getDate()}, ${date.getFullYear()}`;
}

/** Lines of the title page or header block, in the order the style prints them */
export function titlePageLines(info: TitlePageInfo | undefined, style: CitationStyle): string[] {
    if (!info) return [];
    const date = info.dueDate ? formatDueDate(info.dueDate, style) : '';
    const lines = style === 'mla'
        ? [info.author, info.instructor, info.course, date]
        : [info.author, info.institution, info.course, info.instructor, date];
    return lines.map(l => l.trim()).filter(Boolean);
}

export function surname(author: string | undefined): string {
    const parts = (author ?? '').trim().split(/\s+/);
    return parts[parts.length - 1] ?? '';
}
