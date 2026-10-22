import { completeLLM, streamLLM } from './llm';
import { Reference } from './references-api';
import { Dataset, DatasetAnalysis } from './dataset-finder';
import {
    CitationStyle, CITATION_STYLES, formatDatasetCitation, formatInTextCitation, formatNarrativeCitation, generateStyledReferenceList,
    isNumberedStyle, renumberCitations,
} from './citation-formatter';
import { AnalysisReport, ReportTable, reportTables, reportToPromptContext } from './data-analysis/report';
import { WRITING_GUIDE } from './writing/style-guide';
import { generateOutline, outlineForSection, PaperOutline } from './writing/outline';
import { polishSection } from './writing/polish';
import { cleanupText, DashStyle } from './writing/style-cleanup';

export interface PaperSection {
    id: string;
    title: string;
    content: string;
    isGenerating: boolean;
    isComplete: boolean;
    wordCount: number;
    tables?: ReportTable[];
}

export interface GenerationProgress {
    currentSection: string;
    completedSections: string[];
    totalSections: number;
    overallProgress: number;
    currentContent: string;
}

export interface ResearchContext {
    selectedReferences: Reference[];
    selectedDatasets: Dataset[];
    datasetAnalyses: Map<string, DatasetAnalysis>;
    researchNotes: string;
    researchGaps?: { title: string; description: string }[];
    researchQuestions?: string[];
    analysisReports?: AnalysisReport[];
    discipline?: string;
}

function includedReports(context?: ResearchContext): AnalysisReport[] {
    return (context?.analysisReports ?? []).filter(r => r.includeInPaper && r.results.length > 0);
}

/** Reference-list entry for an analyzed dataset */
export function formatDatasetReference(report: AnalysisReport, style: CitationStyle = 'apa'): string {
    return formatDatasetCitation(report.dataset, style);
}

/** Section that carries the analysis tables: Results if present, otherwise Discussion */
function tableSection(sections: string[]): string | undefined {
    return ['Results', 'Discussion'].find(name => sections.includes(name));
}

export interface PaperGenerationOptions {
    topic: string;
    wordLimit: number;
    sections: string[];
    provider?: string; // Preferred AI provider id; undefined lets the gateway choose
    citationStyle?: CitationStyle;
    polish?: boolean; // Rewrite sentences with stock phrases (checked edit pass); default true
    dashStyle?: DashStyle; // Em-dash handling in the deterministic cleanup; default 'replace'
    researchContext?: ResearchContext;
    onProgress?: (progress: GenerationProgress) => void;
    onSectionStart?: (sectionName: string) => void;
    onSectionComplete?: (section: PaperSection) => void;
    onToken?: (sectionId: string, token: string) => void;
    onComplete?: (sections: PaperSection[]) => void;
    onError?: (error: Error) => void;
}

export interface GeneratedPaper {
    topic: string;
    sections: PaperSection[];
    totalWordCount: number;
    generatedAt: Date;
    model: string;
    citationStyle: CitationStyle;
    thesis?: string;
    sources: Reference[];   // In reference-list order (citation order for numbered styles)
    datasets: { id: string; title: string; url: string }[];
}

export const DEFAULT_SECTIONS = [
    'Abstract',
    'Introduction',
    'Literature Review',
    'Methodology',
    'Results',
    'Discussion',
    'Conclusion',
    'References',
];

// Sections whose prompts should see the research framing / the data
const FRAMING_SECTIONS = ['Abstract', 'Introduction', 'Literature Review', 'Discussion', 'Conclusion'];
const DATA_SECTIONS = ['Abstract', 'Methodology', 'Results', 'Discussion'];

/**
 * Describe a dataset analysis in a few lines the model can quote numbers from
 */
function describeAnalysis(dataset: Dataset, analysis?: DatasetAnalysis): string {
    let text = `- ${dataset.title} (${dataset.source}, ${dataset.url})`;
    if (!analysis) return text + ': not analyzed; describe it only qualitatively.\n';

    const { totalRows, totalColumns, missingValues } = analysis.summary;
    text += `: sample of ${totalRows} rows, ${totalColumns} columns, ${missingValues} missing values.\n`;
    for (const col of analysis.columns.slice(0, 12)) {
        if (col.type === 'numeric' && col.mean !== undefined) {
            text += `    ${col.name}: numeric, mean ${col.mean.toFixed(3)}, min ${col.min}, max ${col.max}\n`;
        } else if (col.topValues?.length) {
            const top = col.topValues.slice(0, 3).map(v => `${v.value} (${v.count})`).join(', ');
            text += `    ${col.name}: ${col.type}, ${col.unique} unique, most common: ${top}\n`;
        }
    }
    return text;
}

export interface SectionPromptContext {
    topic: string;
    wordTarget: number;
    researchContext?: ResearchContext;
    previousContent?: string;
    attachTables?: boolean;
    style?: CitationStyle;
    outline?: PaperOutline | null;
}

/**
 * Build the full prompt for a section
 */
export function buildSectionPrompt(sectionName: string, ctx: SectionPromptContext): string {
    const { topic, wordTarget, researchContext, previousContent, attachTables = false, style = 'apa', outline } = ctx;
    const refs = researchContext?.selectedReferences ?? [];
    const datasets = researchContext?.selectedDatasets ?? [];

    let contextInfo = '';

    if (researchContext?.discipline) {
        contextInfo += `\nField: ${researchContext.discipline}. Use this field's terminology, methods and conventions.\n`;
    }

    if (outline) {
        contextInfo += outlineForSection(outline, sectionName);
    }

    if (refs.length > 0) {
        contextInfo += `\n\nSources you may cite (cite ONLY these, in ${CITATION_STYLES[style].label} style, using exactly the narrative / parenthetical forms shown${isNumberedStyle(style) ? '; cite by the bracketed number' : ''}):\n`;
        refs.forEach((ref, i) => {
            const abstract = ref.abstract ? ` Abstract: ${ref.abstract.slice(0, 400)}` : '';
            const forms = `${formatNarrativeCitation(ref, style, i + 1)} / ${formatInTextCitation(ref, style, i + 1)}`.replace(/\*/g, '');
            contextInfo += `- ${forms}: "${ref.title}".${abstract}\n`;
        });
    }

    if (FRAMING_SECTIONS.includes(sectionName)) {
        const gaps = researchContext?.researchGaps ?? [];
        const questions = researchContext?.researchQuestions ?? [];
        if (gaps.length > 0) {
            contextInfo += '\nResearch gaps this paper addresses:\n';
            gaps.forEach(g => { contextInfo += `- ${g.title}: ${g.description}\n`; });
        }
        if (questions.length > 0) {
            contextInfo += '\nResearch questions:\n';
            questions.forEach((q, i) => { contextInfo += `${i + 1}. ${q}\n`; });
        }
    }

    const reports = includedReports(researchContext);
    if (DATA_SECTIONS.includes(sectionName) && reports.length > 0) {
        contextInfo += '\nOriginal data analysis performed for this paper (report these findings exactly; they are the only numbers you may state):\n';
        reports.forEach(report => { contextInfo += reportToPromptContext(report) + '\n'; });
        if (attachTables) {
            const tables = reports.flatMap(reportTables);
            contextInfo += '\nThese tables appear at the end of this section; refer to them by number:\n';
            tables.forEach((t, i) => { contextInfo += `Table ${i + 1}: ${t.caption}\n`; });
        }
    }

    if (DATA_SECTIONS.includes(sectionName) && datasets.length > 0) {
        contextInfo += '\nDatasets and their measured statistics (the only numbers you may report):\n';
        datasets.forEach(ds => {
            contextInfo += describeAnalysis(ds, researchContext?.datasetAnalyses?.get(ds.id));
        });
    }

    if (researchContext?.researchNotes) {
        contextInfo += `\nAuthor notes:\n${researchContext.researchNotes}\n`;
    }

    const integrityRules = `
Integrity rules:
- ${refs.length > 0
        ? 'Cite only the sources listed below. Never invent authors, titles, years or DOIs.'
        : 'No literature sources were provided, so do not cite any papers or authors.'}
- Never invent statistics, sample sizes, p-values or results. Only report numbers given in the data analysis or dataset statistics below${sectionName === 'Results' ? '; if none are given, describe the planned analysis and expected outcomes instead of reporting findings' : ''}.
- When reporting the data analysis, cite the dataset by name and state its limitations.
- Write plain prose paragraphs separated by blank lines. No Markdown, headings, bold or bullet symbols.
- Do NOT include the section title; start directly with the content.`;

    if (sectionName === 'Abstract') {
        return `You are an expert academic writer. Write the abstract for a research paper on: "${topic}"

Requirements:
- Write 150-250 words in one paragraph
- State the problem, approach, key findings (with their numbers, if any) and the main conclusion
${WRITING_GUIDE}
${integrityRules}
${contextInfo}`;
    }

    return `You are an expert academic researcher. Write the "${sectionName}" section for a paper on: "${topic}"

Requirements:
- Write approximately ${wordTarget} words
- Follow the plan below and connect to the previous section without restating it
${WRITING_GUIDE}
${integrityRules}
${contextInfo}
${previousContent ? `\nEnd of the previous section, for continuity:\n${previousContent.slice(-800)}` : ''}`;
}

/**
 * Remove Markdown the model adds despite instructions; the paper is rendered and exported as plain text
 */
export function stripMarkdown(text: string): string {
    return text
        .replace(/^#{1,6}\s+/gm, '')
        .replace(/\*\*(.+?)\*\*/g, '$1')
        .replace(/__(.+?)__/g, '$1')
        .replace(/(^|[^*])\*(?!\s)([^*\n]+?)\*/g, '$1$2')
        .replace(/^[ \t]*[-*+][ \t]+/gm, '')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
}

// Enough output for the section's word target (~1.4 tokens/word) plus headroom, without
// reserving so much that one request exceeds a free tier's tokens-per-minute budget
function sectionTokenBudget(words: number): number {
    return Math.min(4096, Math.max(1024, Math.round(words * 1.4) + 600));
}

/**
 * Count words in a string
 */
function countWords(text: string): number {
    return text.trim().split(/\s+/).filter(Boolean).length;
}

/**
 * Generate an academic paper using Gemini API (FREE)
 */
export async function generatePaper(
    options: PaperGenerationOptions
): Promise<GeneratedPaper> {
    const {
        topic,
        wordLimit,
        sections = DEFAULT_SECTIONS,
        provider,
        citationStyle = 'apa',
        polish = true,
        dashStyle = 'replace',
        researchContext,
        onProgress,
        onSectionStart,
        onSectionComplete,
        onComplete,
        onError,
    } = options;

    const generatedSections: PaperSection[] = [];
    let referencesSection: PaperSection | null = null;
    let finalSources: Reference[] = researchContext?.selectedReferences ?? [];
    let previousContent = '';
    const modelsUsed = new Set<string>();
    const prose = sections.filter(name => name !== 'References');
    const reports = includedReports(researchContext);
    const tablesIn = reports.length > 0 ? tableSection(sections) : undefined;
    // The abstract has its own length; the body sections share the rest of the word limit
    const bodyCount = prose.filter(name => name !== 'Abstract').length;
    const bodyWords = Math.max(200, wordLimit - (prose.includes('Abstract') ? 250 : 0));

    try {
        onProgress?.({
            currentSection: 'Planning the paper',
            completedSections: [],
            totalSections: sections.length,
            overallProgress: 0,
            currentContent: '',
        });
        const outline = prose.length > 1
            ? await generateOutline({
                topic,
                discipline: researchContext?.discipline,
                sections: prose,
                sourceTitles: (researchContext?.selectedReferences ?? []).map(r => `${formatNarrativeCitation(r, citationStyle).replace(/\*/g, '')}: ${r.title}`),
                researchGaps: (researchContext?.researchGaps ?? []).map(g => `${g.title}: ${g.description}`),
                researchQuestions: researchContext?.researchQuestions ?? [],
                findings: reports.flatMap(r => r.results.map(x => x.finding)),
                provider,
            })
            : null;

        for (let i = 0; i < sections.length; i++) {
            const sectionName = sections[i];
            const sectionId = sectionName.toLowerCase().replace(/\s+/g, '_');

            onSectionStart?.(sectionName);

            // Update progress
            onProgress?.({
                currentSection: sectionName,
                completedSections: generatedSections.map(s => s.title),
                totalSections: sections.length,
                overallProgress: (i / sections.length) * 100,
                currentContent: '',
            });

            const section: PaperSection = {
                id: sectionId,
                title: sectionName === 'References' ? CITATION_STYLES[citationStyle].referencesTitle : sectionName,
                content: '',
                isGenerating: true,
                isComplete: false,
                wordCount: 0,
            };

            let content = '';
            if (sectionName === 'References') {
                // Filled in after every other section, so numbered styles can follow citation order
                referencesSection = section;
            } else {
                const wordTarget = sectionName === 'Abstract' ? 250 : Math.round(bodyWords / Math.max(1, bodyCount));
                const prompt = buildSectionPrompt(sectionName, {
                    topic,
                    wordTarget,
                    researchContext,
                    previousContent,
                    attachTables: sectionName === tablesIn,
                    style: citationStyle,
                    outline,
                });

                const result = await streamLLM(prompt, {
                    provider,
                    maxTokens: sectionTokenBudget(wordTarget),
                    onProvider: () => { section.content = ''; },
                    onToken: (token) => {
                        section.content += token;
                        onProgress?.({
                            currentSection: sectionName,
                            completedSections: generatedSections.map(s => s.title),
                            totalSections: sections.length,
                            overallProgress: ((i + 0.5) / sections.length) * 100,
                            currentContent: section.content,
                        });
                    },
                });
                modelsUsed.add(`${result.provider}/${result.model}`);
                content = stripMarkdown(result.content);

                if (polish) {
                    onProgress?.({
                        currentSection: `${sectionName} (editing)`,
                        completedSections: generatedSections.map(s => s.title),
                        totalSections: sections.length,
                        overallProgress: ((i + 0.8) / sections.length) * 100,
                        currentContent: content,
                    });
                    content = (await polishSection(content, { provider, maxTokens: sectionTokenBudget(wordTarget) })).content;
                    // Deterministic pass catches what the model edit missed; quotes, citations and numbers are locked
                    content = content.split(/\n\s*\n/).map(p => cleanupText(p, { dashes: dashStyle }).text).join('\n\n');
                }
                previousContent = content;
            }

            if (section === referencesSection) {
                generatedSections.push(section);
                continue;
            }

            section.content = content;
            if (sectionName === tablesIn) {
                section.tables = reports.flatMap(reportTables);
            }
            section.isGenerating = false;
            section.isComplete = true;
            section.wordCount = countWords(content);

            generatedSections.push(section);

            onSectionComplete?.(section);

            // Update final progress for this section
            onProgress?.({
                currentSection: sectionName,
                completedSections: generatedSections.map(s => s.title),
                totalSections: sections.length,
                overallProgress: ((i + 1) / sections.length) * 100,
                currentContent: section.content,
            });
        }

        if (referencesSection) {
            const section = referencesSection as PaperSection;
            let refs = researchContext?.selectedReferences ?? [];
            if (isNumberedStyle(citationStyle) && refs.length > 0) {
                const prose = generatedSections.filter(s => s !== section);
                const { texts, order } = renumberCitations(prose.map(s => s.content), refs.length);
                prose.forEach((s, j) => { s.content = texts[j]; });
                if (order.length > 0) refs = order.map(n => refs[n - 1]);
            }
            finalSources = refs;
            // Built from real metadata; letting the model write it produces fabricated sources.
            // Italics stay marked with *asterisks*; the preview and exports render them.
            const literature = refs.length > 0 ? [generateStyledReferenceList(refs, citationStyle)] : [];
            const datasets = reports.map((r, j) => {
                const entry = formatDatasetReference(r, citationStyle);
                // Numbered styles list datasets after the literature
                return isNumberedStyle(citationStyle) ? `[${refs.length + j + 1}] ${entry}` : entry;
            });
            const entries = [...literature, ...datasets];
            section.content = entries.length > 0 ? entries.join('\n\n') : 'No sources were selected for this paper.';
            section.isGenerating = false;
            section.isComplete = true;
            section.wordCount = countWords(section.content);
            onSectionComplete?.(section);
        }

        const paper: GeneratedPaper = {
            topic,
            sections: generatedSections,
            totalWordCount: generatedSections.reduce((sum, s) => sum + s.wordCount, 0),
            generatedAt: new Date(),
            model: [...modelsUsed].join(', ') || 'none',
            citationStyle,
            thesis: outline?.thesis,
            sources: finalSources,
            datasets: reports.map(r => ({ id: r.dataset.id, title: r.dataset.title, url: r.dataset.url })),
        };

        onComplete?.(generatedSections);

        return paper;

    } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        onError?.(err);
        throw err;
    }
}

/**
 * Quick generation for single section (non-streaming)
 */
export async function generateSection(
    topic: string,
    sectionName: string,
    wordTarget: number = 500
): Promise<string> {
    const prompt = `Write the "${sectionName}" section for an academic paper on "${topic}".
Requirements:
- Write approximately ${wordTarget} words
- Use formal academic language
- Include citations where appropriate
- Start directly with content, no title`;

    return completeLLM(prompt);
}
