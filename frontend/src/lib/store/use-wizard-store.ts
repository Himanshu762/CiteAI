import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type WizardStage = 'start' | 'research' | 'data' | 'write' | 'finish';

export interface ResearchGap {
    id: string;
    title: string;
    description: string;
    selected: boolean;
}

export interface ResearchQuestion {
    id: string;
    question: string;
    selected: boolean;
}

interface WizardState {
    // Current stage
    currentStage: WizardStage;

    // Start stage
    topic: string;

    // Research stage
    researchGaps: ResearchGap[];
    researchQuestions: ResearchQuestion[];
    isAnalyzingTopic: boolean;

    // Computed
    canProceed: boolean;

    // Actions
    setTopic: (topic: string) => void;
    setStage: (stage: WizardStage) => void;
    nextStage: () => void;
    prevStage: () => void;

    // Research actions
    setResearchGaps: (gaps: ResearchGap[]) => void;
    setResearchQuestions: (questions: ResearchQuestion[]) => void;
    toggleGap: (id: string) => void;
    toggleQuestion: (id: string) => void;
    setAnalyzingTopic: (analyzing: boolean) => void;

    // Reset
    reset: () => void;
}

const stageOrder: WizardStage[] = ['start', 'research', 'data', 'write', 'finish'];

const initialState = {
    currentStage: 'start' as WizardStage,
    topic: '',
    researchGaps: [],
    researchQuestions: [],
    isAnalyzingTopic: false,
    canProceed: false,
};

export const useWizardStore = create<WizardState>()(
    persist(
        (set, get) => ({
            ...initialState,

            setTopic: (topic) => set({
                topic,
                canProceed: topic.trim().length >= 10,
                // Reset research data when topic changes
                researchGaps: [],
                researchQuestions: [],
                isAnalyzingTopic: false,
            }),

            setStage: (stage) => set({ currentStage: stage }),

            nextStage: () => {
                const current = get().currentStage;
                const idx = stageOrder.indexOf(current);
                if (idx < stageOrder.length - 1) {
                    set({ currentStage: stageOrder[idx + 1] });
                }
            },

            prevStage: () => {
                const current = get().currentStage;
                const idx = stageOrder.indexOf(current);
                if (idx > 0) {
                    set({ currentStage: stageOrder[idx - 1] });
                }
            },

            setResearchGaps: (gaps) => set({ researchGaps: gaps }),
            setResearchQuestions: (questions) => set({ researchQuestions: questions }),

            toggleGap: (id) => set((state) => ({
                researchGaps: state.researchGaps.map(g =>
                    g.id === id ? { ...g, selected: !g.selected } : g
                )
            })),

            toggleQuestion: (id) => set((state) => ({
                researchQuestions: state.researchQuestions.map(q =>
                    q.id === id ? { ...q, selected: !q.selected } : q
                )
            })),

            setAnalyzingTopic: (analyzing) => set({ isAnalyzingTopic: analyzing }),

            reset: () => set(initialState),
        }),
        {
            name: 'citeai-wizard',
            partialize: (state) => ({
                topic: state.topic,
                currentStage: state.currentStage,
                researchGaps: state.researchGaps,
                researchQuestions: state.researchQuestions,
            }),
        }
    )
);
