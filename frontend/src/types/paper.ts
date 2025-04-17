export interface PaperSections {
  [key: string]: string;
}

export interface Citation {
  id: string;
  text: string;
}

export interface PaperMetrics {
  wordCount: number;
  readabilityScore: number;
  plagiarismScore: number;
} 