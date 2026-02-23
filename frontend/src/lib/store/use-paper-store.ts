import { create } from 'zustand';
import { Paper, PaperSection, GenerationProgress, QualityReport, Reference, ExportConfig } from '../../types/paper';

interface PaperState {
  // Current paper being generated/edited
  currentPaper: Paper | null;

  // Generation state
  isGenerating: boolean;
  generationProgress: GenerationProgress | null;
  generationError: string | null;

  // Section streaming
  streamingSections: Record<string, string>;

  // Selected references for the paper
  selectedReferences: Reference[];

  // Quality report
  qualityReport: QualityReport | null;
  isCheckingQuality: boolean;

  // Export configuration
  exportConfig: ExportConfig;

  // Paper history
  papers: Paper[];

  // Actions
  setCurrentPaper: (paper: Paper | null) => void;
  updateSection: (sectionId: string, content: string) => void;
  appendToSection: (sectionId: string, token: string) => void;
  setGenerating: (isGenerating: boolean) => void;
  setGenerationProgress: (progress: GenerationProgress | null) => void;
  setGenerationError: (error: string | null) => void;

  addReference: (ref: Reference) => void;
  removeReference: (refId: string) => void;
  clearReferences: () => void;

  setQualityReport: (report: QualityReport | null) => void;
  setCheckingQuality: (isChecking: boolean) => void;

  setExportConfig: (config: Partial<ExportConfig>) => void;

  addPaper: (paper: Paper) => void;
  updatePaper: (id: string, updates: Partial<Paper>) => void;
  deletePaper: (id: string) => void;

  reset: () => void;
}

const defaultExportConfig: ExportConfig = {
  format: 'pdf',
  includeCoverPage: true,
  includeTableOfContents: true,
  includeReferences: true,
  fontSize: 12,
  lineSpacing: 1.5,
};

export const usePaperStore = create<PaperState>((set, get) => ({
  currentPaper: null,
  isGenerating: false,
  generationProgress: null,
  generationError: null,
  streamingSections: {},
  selectedReferences: [],
  qualityReport: null,
  isCheckingQuality: false,
  exportConfig: defaultExportConfig,
  papers: [],

  setCurrentPaper: (paper) => set({ currentPaper: paper, generationError: null }),

  updateSection: (sectionId, content) => set((state) => {
    if (!state.currentPaper) return state;

    const sections = state.currentPaper.sections.map((s) =>
      s.id === sectionId ? { ...s, content, wordCount: content.split(/\s+/).filter(Boolean).length } : s
    );

    return {
      currentPaper: {
        ...state.currentPaper,
        sections,
        totalWordCount: sections.reduce((sum, s) => sum + s.wordCount, 0),
        updatedAt: new Date(),
      },
    };
  }),

  appendToSection: (sectionId, token) => set((state) => ({
    streamingSections: {
      ...state.streamingSections,
      [sectionId]: (state.streamingSections[sectionId] || '') + token,
    },
  })),

  setGenerating: (isGenerating) => set({
    isGenerating,
    streamingSections: isGenerating ? {} : get().streamingSections,
  }),

  setGenerationProgress: (progress) => set({ generationProgress: progress }),

  setGenerationError: (error) => set({
    generationError: error,
    isGenerating: false,
  }),

  addReference: (ref) => set((state) => {
    if (state.selectedReferences.find((r) => r.id === ref.id)) {
      return state;
    }
    return { selectedReferences: [...state.selectedReferences, ref] };
  }),

  removeReference: (refId) => set((state) => ({
    selectedReferences: state.selectedReferences.filter((r) => r.id !== refId),
  })),

  clearReferences: () => set({ selectedReferences: [] }),

  setQualityReport: (report) => set({ qualityReport: report }),

  setCheckingQuality: (isChecking) => set({ isCheckingQuality: isChecking }),

  setExportConfig: (config) => set((state) => ({
    exportConfig: { ...state.exportConfig, ...config },
  })),

  addPaper: (paper) => set((state) => ({
    papers: [...state.papers, paper],
    currentPaper: paper,
  })),

  updatePaper: (id, updates) => set((state) => ({
    papers: state.papers.map((p) => (p.id === id ? { ...p, ...updates } : p)),
    currentPaper: state.currentPaper?.id === id
      ? { ...state.currentPaper, ...updates }
      : state.currentPaper,
  })),

  deletePaper: (id) => set((state) => ({
    papers: state.papers.filter((p) => p.id !== id),
    currentPaper: state.currentPaper?.id === id ? null : state.currentPaper,
  })),

  reset: () => set({
    currentPaper: null,
    isGenerating: false,
    generationProgress: null,
    generationError: null,
    streamingSections: {},
    selectedReferences: [],
    qualityReport: null,
    isCheckingQuality: false,
    exportConfig: defaultExportConfig,
  }),
}));