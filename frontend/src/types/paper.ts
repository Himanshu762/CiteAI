export interface PaperSections {
  [key: string]: string;
}

export interface PaperSection {
  id: string;
  title: string;
  content: string;
  isGenerating: boolean;
  isComplete: boolean;
  wordCount: number;
}

export interface Paper {
  id: string;
  topic: string;
  sections: PaperSection[];
  totalWordCount: number;
  createdAt: Date;
  updatedAt: Date;
  model: string;
  status: 'draft' | 'generating' | 'complete' | 'error';
}

export interface Citation {
  id: string;
  text: string;
  referenceId: string;
  pageNumber?: string;
  type: 'parenthetical' | 'narrative';
}

export interface PaperMetrics {
  wordCount: number;
  readabilityScore: number;
  plagiarismScore: number;
  gradeLevel: number;
  sentenceCount: number;
  avgWordsPerSentence: number;
}

export interface Reference {
  id: string;
  title: string;
  authors: { name: string; authorId?: string }[];
  year: number;
  venue?: string;
  abstract?: string;
  doi?: string;
  url?: string;
  citationCount?: number;
  isOpenAccess?: boolean;
  pdfUrl?: string;
}

export interface ExportConfig {
  format: 'pdf' | 'docx';
  includeCoverPage: boolean;
  includeTableOfContents: boolean;
  includeReferences: boolean;
  fontSize: number;
  lineSpacing: number;
}

export interface GenerationProgress {
  currentSection: string;
  completedSections: string[];
  totalSections: number;
  overallProgress: number;
  currentContent: string;
}

export interface QualityReport {
  plagiarismScore: number;
  readabilityScore: number;
  gradeLevel: number;
  wordCount: number;
  sentenceCount: number;
  avgWordsPerSentence: number;
  avgSyllablesPerWord: number;
  recommendations: string[];
  checkedAt: Date;
}