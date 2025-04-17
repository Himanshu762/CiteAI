import { PaperSections } from '../types/paper';
import { OPENROUTER_API_KEY, OPENROUTER_URL } from '../config/api';

// Configuration
// IMPORTANT: In a production app, you should NOT expose your API key in the frontend
// You should use an environment variable and ensure this key is kept secret
// For a completely frontend solution, consider using Auth.js or Clerk.js to handle authentication
// and only allow authenticated users to access this key

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

/**
 * Extract content between current section and the next section
 */
export function extractSection(content: string, sectionTitle: string, allSections: string[]): string {
  try {
    // Create regex pattern that matches the section title at the beginning of a line
    const pattern = new RegExp(`(?:^|\\n)(${sectionTitle}[:\.\\s]*?)(?:\\n|$)`, 'i');
    const match = content.match(pattern);
    
    if (!match) {
      return "";
    }
        
    const startIdx = match.index! + match[0].length;
    
    // Find the next section
    const nextSections = allSections.filter(s => s.localeCompare(sectionTitle) > 0);
    for (const nextSection of nextSections) {
      const nextPattern = new RegExp(`(?:^|\\n)(${nextSection}[:\.\\s]*?)(?:\\n|$)`, 'i');
      const nextMatch = content.substring(startIdx).match(nextPattern);
      if (nextMatch) {
        const endIdx = startIdx + nextMatch.index!;
        return content.substring(startIdx, endIdx).trim();
      }
    }
    
    // If no next section found, return the rest of the content
    return content.substring(startIdx).trim();
  } catch (error) {
    console.error(`Error extracting section ${sectionTitle}:`, error);
    return "";
  }
}

/**
 * Calculate readability score (higher is better)
 */
export function calculateReadability(text: string): number {
  if (!text) {
    return 0;
  }
    
  const words = text.split(/\s+/);
  const wordCount = words.length;
  if (wordCount < 10) {
    return 0;
  }
    
  const sentenceCount = text.split(/[.!?]+/).length;
  const avgSentenceLength = wordCount / (sentenceCount || 1);
  
  // Simple score based on average sentence length (optimal is around 15-20 words)
  const readability = 100 - Math.abs(avgSentenceLength - 17.5) * 2.5;
  
  // Clamp between 0 and 100
  return Math.max(0, Math.min(100, readability));
}

/**
 * Retry an async function with exponential backoff
 */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  initialDelay = 1000
): Promise<T> {
  let retries = 0;
  let delay = initialDelay;
  
  while (true) {
    try {
      return await fn();
    } catch (error: any) {
      // Don't retry if we've reached max retries or if it's not a retryable error
      if (
        retries >= maxRetries || 
        error.name === 'AbortError' || 
        (error.message && error.message.includes('API key'))
      ) {
        throw error;
      }
      
      // Increase retries and delay
      retries++;
      console.log(`Retrying API call (${retries}/${maxRetries}) after ${delay}ms...`);
      
      // Wait for the delay
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Exponential backoff
      delay *= 2;
    }
  }
}

/**
 * Generate a paper on the given topic using OpenRouter API
 */
export async function generatePaper(params: GeneratePaperParams): Promise<GeneratePaperResponse> {
  try {
    if (!OPENROUTER_API_KEY) {
      throw new Error('OpenRouter API key not configured');
    }
    
    // Construct academic prompt with section structure
    const sectionsText = params.sections.join(', ');
    const prompt = `Generate a rigorous academic paper on '${params.topic}' with approximately ${params.wordLimit} words. 
      Structure the paper with the following clearly labeled sections: ${sectionsText}. 
      Maintain a formal academic tone throughout. Include proper citations in APA format 
      and reference academic sources where appropriate. Make the paper detail-oriented with factual 
      content. Ensure each section starts with its title on a new line.`;
    
    // Use the retry mechanism for the API call
    return await retryWithBackoff(async () => {
      // Setup a timeout to abort the fetch if it takes too long
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 minute timeout
      
      try {
        // API Request
        const response = await fetch(OPENROUTER_URL, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
            'HTTP-Referer': window.location.origin,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'deepseek/deepseek-r1-zero:free',  // Using free tier deepseek model
            messages: [{ role: 'user', content: prompt }]
          }),
          signal: controller.signal
        });
        
        // Clear the timeout since the request completed
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: { message: 'Failed to parse error response' }}));
          throw new Error(errorData.error?.message || `API error: ${response.status}`);
        }
        
        // Extract content from the response
        const responseData = await response.json().catch(() => {
          throw new Error('Failed to parse API response');
        });
        
        if (!responseData.choices || !responseData.choices[0]?.message?.content) {
          throw new Error('Invalid response format from API');
        }
        
        const content = responseData.choices[0].message.content;
        
        // Extract sections from the response
        const sections: PaperSections = {};
        for (const section of params.sections) {
          const sectionContent = extractSection(content, section, params.sections);
          if (sectionContent) {
            sections[section.toLowerCase()] = sectionContent;
          }
        }
        
        // Calculate word count
        const wordCount = Object.values(sections).reduce(
          (acc, text) => acc + (text ? text.split(/\s+/).length : 0), 
          0
        );
        
        // Calculate readability
        const allText = Object.values(sections).join(' ');
        const readabilityScore = calculateReadability(allText);
        
        // Generate fake plagiarism score (in a real app, you'd use a plagiarism detection API)
        const plagiarismScore = Math.floor(Math.random() * 15) + 1;  // 1-15%
        
        return {
          status: 'success',
          sections,
          word_count: wordCount,
          readability_score: Math.round(readabilityScore),
          plagiarism_score: plagiarismScore
        };
      } catch (fetchError: any) {
        // Handle specific abort errors
        if (fetchError.name === 'AbortError') {
          throw new Error('The request took too long and was aborted. Try a shorter word limit.');
        }
        
        // Handle message channel closed errors
        if (fetchError.message && fetchError.message.includes('message channel closed')) {
          throw new Error('Connection was interrupted. Please try again.');
        }
        
        throw fetchError; // re-throw other errors
      }
    });
  } catch (error: any) {
    console.error('Error generating paper:', error);
    return {
      status: 'error',
      message: error.message || 'An unexpected error occurred',
      sections: {},
      word_count: 0,
      readability_score: 0,
      plagiarism_score: 0
    };
  }
} 