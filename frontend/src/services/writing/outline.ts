/**
 * Paper planning: a thesis and a per-section plan generated before any section is written,
 * so sections argue one point and do not repeat each other.
 */

import { completeLLM, parseJSONResponse } from '../llm';

export interface SectionPlan {
    name: string;
    purpose: string;
    points: string[];
}

export interface PaperOutline {
    thesis: string;
    sections: SectionPlan[];
}

export interface OutlineInput {
    topic: string;
    discipline?: string;
    sections: string[];
    sourceTitles: string[];
    researchGaps: string[];
    researchQuestions: string[];
    findings: string[];
    provider?: string;
}

export async function generateOutline(input: OutlineInput): Promise<PaperOutline | null> {
    const list = (title: string, items: string[]) =>
        items.length ? `\n${title}:\n${items.map((x, i) => `${i + 1}. ${x}`).join('\n')}\n` : '';

    const prompt = `Plan an academic paper on "${input.topic}"${input.discipline ? ` in ${input.discipline}` : ''}.
${list('Research questions', input.researchQuestions)}${list('Research gaps', input.researchGaps)}${list('Available sources', input.sourceTitles)}${list('Computed data findings', input.findings)}
Sections to plan, in order: ${input.sections.join(', ')}.

Write one arguable thesis sentence. For each section give its purpose (one sentence) and 2-4 specific points it must make. Points must not repeat across sections. Base points only on the sources and findings listed; do not invent results.

Respond ONLY with JSON:
{"thesis": "...", "sections": [{"name": "<section name>", "purpose": "...", "points": ["...", "..."]}]}`;

    try {
        const raw = parseJSONResponse<{ thesis?: unknown; sections?: unknown }>(
            await completeLLM(prompt, { temperature: 0.4, maxTokens: 1500, provider: input.provider })
        );
        if (typeof raw.thesis !== 'string' || !Array.isArray(raw.sections)) return null;

        const plans = raw.sections as { name?: unknown; purpose?: unknown; points?: unknown }[];
        const sections = input.sections.map(name => {
            const plan = plans.find(p => typeof p.name === 'string' && p.name.toLowerCase() === name.toLowerCase());
            return {
                name,
                purpose: typeof plan?.purpose === 'string' ? plan.purpose : '',
                points: Array.isArray(plan?.points) ? plan.points.filter((x): x is string => typeof x === 'string').slice(0, 4) : [],
            };
        });
        return { thesis: raw.thesis, sections };
    } catch (error) {
        // A missing outline makes the paper weaker, not impossible: generate without it
        console.warn('Outline generation failed:', error);
        return null;
    }
}

/** Outline context for one section's prompt */
export function outlineForSection(outline: PaperOutline, sectionName: string): string {
    const current = outline.sections.find(s => s.name === sectionName);
    const others = outline.sections.filter(s => s.name !== sectionName && s.purpose);
    let text = `\nThesis of the paper: ${outline.thesis}\n`;
    if (current?.purpose) text += `\nThis section's job: ${current.purpose}\n`;
    if (current?.points.length) text += `Points this section must make:\n${current.points.map(p => `- ${p}`).join('\n')}\n`;
    if (others.length) {
        text += `\nOther sections cover the following; do not repeat their material:\n${others.map(s => `- ${s.name}: ${s.purpose}`).join('\n')}\n`;
    }
    return text;
}
