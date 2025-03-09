import { create } from 'zustand';
import { Paper } from '../../types';

interface PaperState {
  papers: Paper[];
  addPaper: (paper: Paper) => void;
  updatePaperContent: (id: string, content: string) => void;
}

export const usePaperStore = create<PaperState>((set) => ({
  papers: [],
  addPaper: (paper: Paper) => 
    set((state: PaperState) => ({ 
      papers: [...state.papers, paper] 
    })),
  updatePaperContent: (id: string, content: string) =>
    set((state: PaperState) => ({
      papers: state.papers.map((p: Paper) =>
        p.id === id ? { ...p, content } : p
      ),
    })),
}));