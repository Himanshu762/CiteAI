import { PaperSections } from '../types/paper';

// Utility functions (moved from the old file)
export function extractSection(content: string, sectionTitle: string, allSections: string[]): string {
  try {
    const pattern = new RegExp(`(?:^|\\n)(${sectionTitle}[:.\\s]*?)(?:\\n|$)`, 'i');
    const match = content.match(pattern);
    
    if (!match || typeof match.index === 'undefined') {
      return "";
    }
        
    const startIdx = match.index + match[0].length;
    
    // Find the start of the next section to determine the end of the current one
    let endIdx = content.length;
    const currentSectionIndex = allSections.indexOf(sectionTitle);

    for (let i = currentSectionIndex + 1; i < allSections.length; i++) {
        const nextSection = allSections[i];
        const nextPattern = new RegExp(`(?:^|\\n)(${nextSection}[:.\\s]*?)(?:\\n|$)`, 'i');
        const nextMatch = content.substring(startIdx).match(nextPattern);
        if (nextMatch && typeof nextMatch.index !== 'undefined') {
            endIdx = startIdx + nextMatch.index;
            break; 
        }
    }
    
    return content.substring(startIdx, endIdx).trim();
  } catch (error) {
    console.error(`Error extracting section ${sectionTitle}:`, error);
    return "";
  }
}

export function calculateReadability(text: string): number {
  if (!text) return 0;
  const words = text.split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  if (wordCount < 10) return 0;
  const sentenceCount = (text.match(/[.!?]+/g) || []).length || 1;
  const avgSentenceLength = wordCount / sentenceCount;
  const readability = 100 - Math.abs(avgSentenceLength - 17.5) * 2.5;
  return Math.max(0, Math.min(100, readability));
}


// Main API call function
interface GeneratePaperParams {
  topic: string;
  wordLimit: number;
  sections: string[];
}

interface GeneratePaperResponse {
  status: 'success' | 'error';
  sections: PaperSections;
  word_count: number;
  readability_score: number;
  plagiarism_score: number;
  message?: string;
}

export async function generatePaper(params: GeneratePaperParams): Promise<GeneratePaperResponse> {
  const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;

  if (!apiKey) {
    return {
      status: 'error',
      message: 'OpenRouter API key is not configured in the frontend .env file.',
      sections: {}, word_count: 0, readability_score: 0, plagiarism_score: 0
    };
  }

  const sectionsText = params.sections.join(', ');
  const prompt = `Generate a rigorous academic paper on '${params.topic}' with approximately ${params.wordLimit} words. Structure the paper with the following clearly labeled sections: ${sectionsText}. Maintain a formal academic tone throughout. Include proper citations in APA format and reference academic sources where appropriate. Make the paper detail-oriented with factual content. Ensure each section starts with its title on a new line.`;

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': import.meta.env.VITE_API_URL || 'http://localhost:5173',
      },
      body: JSON.stringify({
        model: "deepseek/deepseek-chat-v3.1:free",
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `API Error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      throw new Error("Received an empty response from the AI model.");
    }
    
    const sections: PaperSections = {};
    for (const section of params.sections) {
      const sectionContent = extractSection(content, section, params.sections);
      if (sectionContent) {
        sections[section.toLowerCase().replace(' ', '_')] = sectionContent;
      }
    }

    const wordCount = Object.values(sections).reduce((acc, text) => acc + (text ? text.split(/\s+/).filter(Boolean).length : 0), 0);
    const readabilityScore = calculateReadability(content);
    // This is a simulation. In a real app, this would be a separate API call.
    const plagiarismScore = Math.floor(Math.random() * 15) + 1;

    return {
      status: 'success',
      sections,
      word_count: wordCount,
      readability_score: Math.round(readabilityScore),
      plagiarism_score: plagiarismScore,
    };

  } catch (error: any) {
    console.error('Error generating paper:', error);
    return {
      status: 'error',
      message: error.message || 'An unexpected error occurred',
      sections: {}, word_count: 0, readability_score: 0, plagiarism_score: 0
    };
  }
}