import { create } from 'zustand';

interface Paper {
  id: string;
  title: string;
  content: string;
  citations: Citation[];
}

interface Citation {
  id: string;
  source: string;
  page?: number;
}

interface PaperStore {
  papers: Paper[];
  addPaper: (paper: Paper) => void;
  updatePaper: (id: string, content: string) => void;
}

export const usePaperStore = create<PaperStore>((set) => ({
  papers: [],
  addPaper: (paper) => set((state) => ({ papers: [...state.papers, paper] })),
  updatePaper: (id, content) => set((state) => ({
    papers: state.papers.map(p => p.id === id ? { ...p, content } : p)
  }))
}));