import { PDFDocument, StandardFonts, rgb, PDFFont, PDFPage } from 'pdf-lib';
import { PaperSection } from './paper-generator';
import { Reference } from './references-api';
import { formatAPAReference } from './citation-formatter';

export interface ExportOptions {
    format: 'pdf' | 'docx';
    title: string;
    author?: string;
    includeTableOfContents?: boolean;
    includeCoverPage?: boolean;
    includeReferences?: boolean;
    references?: Reference[];
    fontSize?: number;
    lineSpacing?: number;
}

/**
 * Export paper to PDF format
 */
export async function exportToPDF(
    sections: PaperSection[],
    options: ExportOptions
): Promise<Blob> {
    const {
        title,
        author = 'Anonymous',
        includeCoverPage = true,
        includeTableOfContents = true,
        includeReferences = true,
        references = [],
        fontSize = 12,
        lineSpacing = 1.5,
    } = options;

    const pdfDoc = await PDFDocument.create();
    const timesRoman = await pdfDoc.embedFont(StandardFonts.TimesRoman);
    const timesRomanBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
    const timesRomanItalic = await pdfDoc.embedFont(StandardFonts.TimesRomanItalic);

    const pageWidth = 612; // US Letter
    const pageHeight = 792;
    const margin = 72; // 1 inch margins
    const contentWidth = pageWidth - 2 * margin;

    // Helper to add a new page
    const addPage = () => {
        const page = pdfDoc.addPage([pageWidth, pageHeight]);
        return page;
    };

    // Helper to draw multiline text
    const drawMultilineText = (
        page: PDFPage,
        text: string,
        x: number,
        y: number,
        font: PDFFont,
        size: number,
        maxWidth: number
    ): number => {
        const words = text.split(' ');
        let line = '';
        let currentY = y;
        const lineHeight = size * lineSpacing;

        for (const word of words) {
            const testLine = line + (line ? ' ' : '') + word;
            const testWidth = font.widthOfTextAtSize(testLine, size);

            if (testWidth > maxWidth && line) {
                page.drawText(line, { x, y: currentY, font, size, color: rgb(0, 0, 0) });
                currentY -= lineHeight;
                line = word;

                // Check if we need a new page
                if (currentY < margin + 50) {
                    return currentY; // Return current position, caller should handle page break
                }
            } else {
                line = testLine;
            }
        }

        if (line) {
            page.drawText(line, { x, y: currentY, font, size, color: rgb(0, 0, 0) });
            currentY -= lineHeight;
        }

        return currentY;
    };

    let currentPage = addPage();
    let yPosition = pageHeight - margin;

    // Cover Page
    if (includeCoverPage) {
        // Title
        const titleSize = 24;
        const titleLines = wrapText(title, timesRomanBold, titleSize, contentWidth);
        let titleY = pageHeight / 2 + (titleLines.length * titleSize) / 2;

        for (const line of titleLines) {
            const lineWidth = timesRomanBold.widthOfTextAtSize(line, titleSize);
            currentPage.drawText(line, {
                x: (pageWidth - lineWidth) / 2,
                y: titleY,
                font: timesRomanBold,
                size: titleSize,
                color: rgb(0, 0, 0),
            });
            titleY -= titleSize * 1.5;
        }

        // Author
        const authorWidth = timesRomanItalic.widthOfTextAtSize(author, 14);
        currentPage.drawText(author, {
            x: (pageWidth - authorWidth) / 2,
            y: titleY - 40,
            font: timesRomanItalic,
            size: 14,
            color: rgb(0.3, 0.3, 0.3),
        });

        // Date
        const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
        const dateWidth = timesRoman.widthOfTextAtSize(dateStr, 12);
        currentPage.drawText(dateStr, {
            x: (pageWidth - dateWidth) / 2,
            y: titleY - 70,
            font: timesRoman,
            size: 12,
            color: rgb(0.4, 0.4, 0.4),
        });

        currentPage = addPage();
        yPosition = pageHeight - margin;
    }

    // Table of Contents
    if (includeTableOfContents) {
        currentPage.drawText('Table of Contents', {
            x: margin,
            y: yPosition,
            font: timesRomanBold,
            size: 18,
            color: rgb(0, 0, 0),
        });
        yPosition -= 40;

        let tocNumber = 1;
        for (const section of sections) {
            currentPage.drawText(`${tocNumber}. ${section.title}`, {
                x: margin + 20,
                y: yPosition,
                font: timesRoman,
                size: 12,
                color: rgb(0, 0, 0),
            });
            yPosition -= 20;
            tocNumber++;
        }

        currentPage = addPage();
        yPosition = pageHeight - margin;
    }

    // Content sections
    for (const section of sections) {
        // Section title
        currentPage.drawText(section.title, {
            x: margin,
            y: yPosition,
            font: timesRomanBold,
            size: 16,
            color: rgb(0, 0, 0),
        });
        yPosition -= 30;

        // Section content - split into paragraphs
        const paragraphs = section.content.split('\n\n').filter(p => p.trim());

        for (const paragraph of paragraphs) {
            const newY = drawMultilineText(
                currentPage,
                paragraph.trim(),
                margin,
                yPosition,
                timesRoman,
                fontSize,
                contentWidth
            );

            if (newY < margin + 100) {
                currentPage = addPage();
                yPosition = pageHeight - margin;
            } else {
                yPosition = newY - 15; // Add paragraph spacing
            }
        }

        yPosition -= 20; // Section spacing

        if (yPosition < margin + 150) {
            currentPage = addPage();
            yPosition = pageHeight - margin;
        }
    }

    // References
    if (includeReferences && references.length > 0) {
        if (yPosition < pageHeight - margin - 100) {
            currentPage = addPage();
            yPosition = pageHeight - margin;
        }

        currentPage.drawText('References', {
            x: margin,
            y: yPosition,
            font: timesRomanBold,
            size: 16,
            color: rgb(0, 0, 0),
        });
        yPosition -= 30;

        for (const ref of references) {
            const citation = formatAPAReference(ref);
            const newY = drawMultilineText(
                currentPage,
                citation,
                margin + 36, // Hanging indent
                yPosition,
                timesRoman,
                11,
                contentWidth - 36
            );

            if (newY < margin + 50) {
                currentPage = addPage();
                yPosition = pageHeight - margin;
            } else {
                yPosition = newY - 10;
            }
        }
    }

    const pdfBytes = await pdfDoc.save();
    return new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
}

/**
 * Export paper to DOCX format
 */
export async function exportToDOCX(
    sections: PaperSection[],
    options: ExportOptions
): Promise<Blob> {
    const {
        title,
        author = 'Anonymous',
        includeCoverPage = true,
        includeReferences = true,
        references = [],
    } = options;

    // Build DOCX content as HTML-like structure for conversion
    // This is a simplified implementation - for full DOCX support, use the 'docx' library

    let content = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n';
    content += '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">\n';
    content += '<w:body>\n';

    // Title
    if (includeCoverPage) {
        content += `<w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="48"/></w:rPr><w:t>${escapeXml(title)}</w:t></w:r></w:p>\n`;
        content += `<w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:t>${escapeXml(author)}</w:t></w:r></w:p>\n`;
        content += `<w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:t>${escapeXml(new Date().toLocaleDateString())}</w:t></w:r></w:p>\n`;
        content += '<w:p><w:r><w:br w:type="page"/></w:r></w:p>\n';
    }

    // Sections
    for (const section of sections) {
        // Section heading
        content += `<w:p><w:pPr><w:pStyle w:val="Heading1"/></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="28"/></w:rPr><w:t>${escapeXml(section.title)}</w:t></w:r></w:p>\n`;

        // Section content
        const paragraphs = section.content.split('\n\n').filter(p => p.trim());
        for (const paragraph of paragraphs) {
            content += `<w:p><w:r><w:t>${escapeXml(paragraph.trim())}</w:t></w:r></w:p>\n`;
        }
        content += '<w:p/>\n'; // Empty paragraph for spacing
    }

    // References
    if (includeReferences && references.length > 0) {
        content += '<w:p><w:r><w:br w:type="page"/></w:r></w:p>\n';
        content += '<w:p><w:pPr><w:pStyle w:val="Heading1"/></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="28"/></w:rPr><w:t>References</w:t></w:r></w:p>\n';

        for (const ref of references) {
            const citation = formatAPAReference(ref);
            content += `<w:p><w:pPr><w:ind w:left="720" w:hanging="720"/></w:pPr><w:r><w:t>${escapeXml(citation)}</w:t></w:r></w:p>\n`;
        }
    }

    content += '</w:body>\n</w:document>';

    // For a proper DOCX, we'd need to create a ZIP with the proper structure
    // For MVP, we'll return as a simple text blob that can be converted
    // In production, use the 'docx' npm library for proper DOCX generation

    return new Blob([content], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
}

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
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

/**
 * Export and download paper
 */
export async function exportAndDownload(
    sections: PaperSection[],
    options: ExportOptions
): Promise<void> {
    const blob = options.format === 'pdf'
        ? await exportToPDF(sections, options)
        : await exportToDOCX(sections, options);

    const extension = options.format === 'pdf' ? 'pdf' : 'docx';
    const filename = `${options.title.replace(/[^a-zA-Z0-9]/g, '_')}.${extension}`;

    downloadBlob(blob, filename);
}

// Helper functions
function wrapText(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
    const words = text.split(' ');
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

function escapeXml(text: string): string {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}
