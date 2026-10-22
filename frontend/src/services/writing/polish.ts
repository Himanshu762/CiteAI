/**
 * Targeted line edit: rewrites only sentences that contain stock phrases, then verifies
 * that every citation and number survived. If anything was lost, the original is kept.
 */

import { completeLLM } from '../llm';
import { findStockPhrases, preservesTokens } from './style-guide';

export interface PolishResult {
    content: string;
    changed: boolean;
    reason?: string;
}

export async function polishSection(content: string, options: { provider?: string; maxTokens?: number } = {}): Promise<PolishResult> {
    const matches = findStockPhrases(content);
    if (matches.length === 0) return { content, changed: false };

    const prompt = `Edit the passage below. Rewrite ONLY the sentences that contain these stock phrases: ${matches.map(m => `"${m.label}"`).join(', ')}.
Replace each stock phrase with plain, specific wording that fits the sentence. Keep every other sentence exactly as written.
Keep all citations, numbers and statistics exactly as they are. Keep the same paragraphs, separated by blank lines.
Return only the full edited passage, with no commentary.

Passage:
"""
${content}
"""`;

    let revised: string;
    try {
        revised = (await completeLLM(prompt, { temperature: 0.3, provider: options.provider, maxTokens: options.maxTokens })).trim();
    } catch {
        return { content, changed: false, reason: 'edit request failed' };
    }
    revised = revised.replace(/^"""\s*|\s*"""$/g, '').trim();

    const ratio = revised.length / content.length;
    if (ratio < 0.75 || ratio > 1.25) return { content, changed: false, reason: 'edit changed the length too much' };
    if (!preservesTokens(content, revised)) return { content, changed: false, reason: 'edit dropped a citation or number' };
    if (findStockPhrases(revised).reduce((n, m) => n + m.count, 0) >= matches.reduce((n, m) => n + m.count, 0)) {
        return { content, changed: false, reason: 'edit did not remove the phrases' };
    }
    return { content: revised, changed: true };
}
