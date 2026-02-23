import { streamGeminiCompletion, geminiCompletion, GEMINI_MODELS } from './gemini-api';
import { streamChatCompletion } from './openrouter-stream';
import { Reference } from './references-api';
import { Dataset, DatasetAnalysis } from './dataset-finder';

// Model configurations
export const PAPER_MODELS = {
    OPENROUTER_GPT: 'openai/gpt-oss-120b:free',  // Best for long-form paper writing
    GEMINI_FLASH: 'gemini-flash',                  // Fast, good for drafts
    GEMINI_PRO: 'gemini-pro',                      // Best quality Gemini
} as const;

export interface PaperSection {
    id: string;
    title: string;
    content: string;
    isGenerating: boolean;
    isComplete: boolean;
    wordCount: number;
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
}

export interface PaperGenerationOptions {
    topic: string;
    wordLimit: number;
    sections: string[];
    model?: string;
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

/**
 * Build the full prompt for a section
 */
function buildSectionPrompt(
    sectionName: string,
    topic: string,
    wordLimit: number,
    totalSections: number,
    researchContext?: ResearchContext,
    previousContent?: string
): string {
    const sectionWordTarget = Math.round(wordLimit / totalSections);

    let contextInfo = '';

    if (researchContext) {
        if (researchContext.selectedReferences.length > 0) {
            contextInfo += '\n\nResearch References to cite:\n';
            researchContext.selectedReferences.forEach(ref => {
                const authors = ref.authors.map(a => a.name).slice(0, 2).join(', ');
                contextInfo += `- ${ref.title} (${authors}, ${ref.year})\n`;
            });
        }

        if (researchContext.selectedDatasets.length > 0) {
            contextInfo += '\n\nDatasets to reference:\n';
            researchContext.selectedDatasets.forEach(ds => {
                contextInfo += `- ${ds.title}: ${ds.description.slice(0, 100)}\n`;
            });
        }
    }

    if (sectionName === 'Abstract') {
        return `You are an expert academic writer. Write a compelling abstract for a research paper on: "${topic}"

Requirements:
- Write 150-300 words
- Summarize research problem, methodology, key findings, and conclusions
- Use formal academic language
- Do NOT include the section title, start directly with content
${contextInfo}`;
    }

    if (sectionName === 'References') {
        return `Generate a properly formatted APA 7th edition reference list for an academic paper on: "${topic}"

Requirements:
- Include 10-15 realistic academic references
- Use proper APA format with hanging indents
- Include journal articles, books, and conference papers
- Use years from 2018-2024
- Each reference should be relevant to the topic
${researchContext?.selectedReferences ? `\nInclude these actual references:\n${researchContext.selectedReferences.map(r => `${r.authors[0]?.name || 'Author'}, et al. (${r.year}). ${r.title}.`).join('\n')}` : ''}`;
    }

    return `You are an expert academic researcher. Write the "${sectionName}" section for a paper on: "${topic}"

Requirements:
- Write approximately ${sectionWordTarget} words
- Use formal academic language and scholarly tone
- Include in-text citations in APA format (Author, Year)
- Do NOT include the section title, start directly with the content
- Ensure logical flow and smooth transitions
${contextInfo}
${previousContent ? `\nPrevious content for context:\n${previousContent.slice(-800)}` : ''}`;
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
        researchContext,
        onProgress,
        onSectionStart,
        onSectionComplete,
        onComplete,
        onError,
    } = options;

    const generatedSections: PaperSection[] = [];
    let previousContent = '';

    try {
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
                title: sectionName,
                content: '',
                isGenerating: true,
                isComplete: false,
                wordCount: 0,
            };

            const prompt = buildSectionPrompt(
                sectionName,
                topic,
                wordLimit,
                sections.length,
                researchContext,
                previousContent
            );

            // Use OpenRouter GPT-OSS-120B for paper compilation (better for long-form writing)
            const result = await streamChatCompletion(
                [{ role: 'user', content: prompt }],
                {
                    model: PAPER_MODELS.OPENROUTER_GPT,
                    maxTokens: 8192,
                    temperature: 0.7,
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
                }
            );

            section.content = result.content;
            section.isGenerating = false;
            section.isComplete = true;
            section.wordCount = countWords(result.content);

            generatedSections.push(section);
            previousContent = result.content;

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

        const paper: GeneratedPaper = {
            topic,
            sections: generatedSections,
            totalWordCount: generatedSections.reduce((sum, s) => sum + s.wordCount, 0),
            generatedAt: new Date(),
            model: 'gemini-2.5-flash',
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

    return geminiCompletion(prompt, GEMINI_MODELS.FLASH);
}
