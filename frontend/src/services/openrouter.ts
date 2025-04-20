import { PaperSections } from '../types/paper';
import { GEMINI_API_KEY, GEMINI_API_URL } from '../config/api';

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
  debug?: {
    rawResponse?: string;
    parsedData?: any;
    error?: any;
  };
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
 * Generate a paper on the given topic using Gemini API
 */
export async function generatePaper(params: GeneratePaperParams): Promise<GeneratePaperResponse> {
  try {
    if (!GEMINI_API_KEY) {
      throw new Error('Gemini API key not configured');
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
        // Build the URL with API key
        const url = `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`;
        
        console.log("Sending request to Gemini API...");
        
        // API Request using Gemini format
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { text: prompt }
                ]
              }
            ],
            generationConfig: {
              temperature: 0.6,          // Slightly lower temperature for more focused academic content
              topK: 32,                  // Adjusted for more precise word choice
              topP: 0.9,                 // Slightly lower for more factual responses
              maxOutputTokens: 16384,    // Increased max tokens for Gemini 2.5's higher capacity
              stopSequences: []
            },
            safetySettings: [
              {
                category: "HARM_CATEGORY_DANGEROUS_CONTENT",
                threshold: "BLOCK_NONE"
              }
            ]
          }),
          signal: controller.signal
        });
        
        // Clear the timeout since the request completed
        clearTimeout(timeoutId);
        
        // Log response status
        console.log(`Gemini API response status: ${response.status}`);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error("API Error Response:", errorText);
          
          try {
            const errorData = JSON.parse(errorText);
            throw new Error(errorData.error?.message || `API error: ${response.status}`);
          } catch (jsonError) {
            throw new Error(`API error (${response.status}): ${errorText.substring(0, 100)}...`);
          }
        }
        
        // Extract content from the response (Gemini format is different)
        const responseText = await response.text();
        console.log("Raw API response:", responseText.substring(0, 200) + "...");
        
        // Store raw response for debugging
        let debugData = {
          rawResponse: responseText,
          parsedData: null,
          error: null
        };
        
        let responseData;
        try {
          responseData = JSON.parse(responseText);
          debugData.parsedData = responseData;
        } catch (jsonError) {
          console.error("Error parsing JSON response:", jsonError);
          debugData.error = jsonError;
          throw new Error('Failed to parse API response');
        }
        
        console.log("Response data structure:", JSON.stringify(Object.keys(responseData)));
        
        // Handle different response formats between Gemini versions
        let content = '';
        
        // Try different potential response formats
        if (responseData.candidates && responseData.candidates[0]?.content?.parts) {
          console.log("Using standard Gemini format");
          const parts = responseData.candidates[0].content.parts;
          content = parts.map(part => part.text || '').join(' ');
        } 
        else if (responseData.candidates && responseData.candidates[0]?.content) {
          console.log("Using alternative Gemini format");
          content = responseData.candidates[0].content.text || 
                    responseData.candidates[0].content || '';
        }
        else if (responseData.text) {
          console.log("Using simple text format");
          content = responseData.text;
        }
        else if (responseData.result) {
          console.log("Using result format");
          content = responseData.result;
        }
        else {
          console.error("Unexpected response structure:", responseData);
          throw new Error('Invalid response format from API - could not locate content');
        }
        
        if (!content) {
          console.error("Empty content in response:", responseData);
          throw new Error('Empty response from API');
        }
        
        console.log("Content extracted, length:", content.length);
        
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
        const readabilityScore = calculateReadability(content);
        
        // Generate fake plagiarism score (in a real app, you'd use a plagiarism detection API)
        const plagiarismScore = Math.floor(Math.random() * 15) + 1;  // 1-15%
        
        return {
          status: 'success',
          sections,
          word_count: wordCount,
          readability_score: Math.round(readabilityScore),
          plagiarism_score: plagiarismScore,
          debug: debugData
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
      plagiarism_score: 0,
      debug: {
        rawResponse: '',
        parsedData: null,
        error: error
      }
    };
  }
} 