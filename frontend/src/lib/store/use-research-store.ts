import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Reference } from '../../services/references-api';
import { Dataset, DatasetAnalysis } from '../../services/dataset-finder';

// Paper context - selected research for generation
export interface PaperResearchContext {
    selectedReferences: Reference[];
    selectedDatasets: Dataset[];
    datasetAnalyses: Map<string, DatasetAnalysis>;
    researchNotes: string;
}

interface ResearchState {
    // Reference search
    referenceQuery: string;
    referenceResults: Reference[];
    isSearchingReferences: boolean;
    referenceSearchError: string | null;

    // Dataset search
    datasetQuery: string;
    datasetResults: Dataset[];
    isSearchingDatasets: boolean;
    datasetSearchError: string | null;

    // Selected dataset for analysis
    selectedDataset: Dataset | null;
    datasetAnalysis: DatasetAnalysis | null;
    isAnalyzingDataset: boolean;

    // Recent searches
    recentReferenceSearches: string[];
    recentDatasetSearches: string[];

    // Paper research context (for generation)
    paperContext: PaperResearchContext;

    // Actions
    setReferenceQuery: (query: string) => void;
    setReferenceResults: (results: Reference[]) => void;
    setSearchingReferences: (isSearching: boolean) => void;
    setReferenceSearchError: (error: string | null) => void;
    addRecentReferenceSearch: (query: string) => void;

    setDatasetQuery: (query: string) => void;
    setDatasetResults: (results: Dataset[]) => void;
    setSearchingDatasets: (isSearching: boolean) => void;
    setDatasetSearchError: (error: string | null) => void;
    addRecentDatasetSearch: (query: string) => void;

    setSelectedDataset: (dataset: Dataset | null) => void;
    setDatasetAnalysis: (analysis: DatasetAnalysis | null) => void;
    setAnalyzingDataset: (isAnalyzing: boolean) => void;

    // Paper context actions
    addReferenceToContext: (ref: Reference) => void;
    removeReferenceFromContext: (refId: string) => void;
    addDatasetToContext: (dataset: Dataset, analysis?: DatasetAnalysis) => void;
    removeDatasetFromContext: (datasetId: string) => void;
    addDatasetAnalysis: (datasetId: string, analysis: DatasetAnalysis) => void;
    setResearchNotes: (notes: string) => void;
    clearPaperContext: () => void;
    isReferenceSelected: (refId: string) => boolean;
    isDatasetSelected: (datasetId: string) => boolean;

    clearReferenceSearch: () => void;
    clearDatasetSearch: () => void;
    reset: () => void;
}

const emptyPaperContext: PaperResearchContext = {
    selectedReferences: [],
    selectedDatasets: [],
    datasetAnalyses: new Map(),
    researchNotes: '',
};

export const useResearchStore = create<ResearchState>()(
    persist(
        (set, get) => ({
            referenceQuery: '',
            referenceResults: [],
            isSearchingReferences: false,
            referenceSearchError: null,

            datasetQuery: '',
            datasetResults: [],
            isSearchingDatasets: false,
            datasetSearchError: null,

            selectedDataset: null,
            datasetAnalysis: null,
            isAnalyzingDataset: false,

            recentReferenceSearches: [],
            recentDatasetSearches: [],

            paperContext: { ...emptyPaperContext },

            setReferenceQuery: (query) => set({ referenceQuery: query }),

            setReferenceResults: (results) => set({
                referenceResults: results,
                referenceSearchError: null,
            }),

            setSearchingReferences: (isSearching) => set({ isSearchingReferences: isSearching }),

            setReferenceSearchError: (error) => set({
                referenceSearchError: error,
                isSearchingReferences: false,
            }),

            addRecentReferenceSearch: (query) => set((state) => {
                const recent = [query, ...state.recentReferenceSearches.filter(q => q !== query)].slice(0, 10);
                return { recentReferenceSearches: recent };
            }),

            setDatasetQuery: (query) => set({ datasetQuery: query }),

            setDatasetResults: (results) => set({
                datasetResults: results,
                datasetSearchError: null,
            }),

            setSearchingDatasets: (isSearching) => set({ isSearchingDatasets: isSearching }),

            setDatasetSearchError: (error) => set({
                datasetSearchError: error,
                isSearchingDatasets: false,
            }),

            addRecentDatasetSearch: (query) => set((state) => {
                const recent = [query, ...state.recentDatasetSearches.filter(q => q !== query)].slice(0, 10);
                return { recentDatasetSearches: recent };
            }),

            setSelectedDataset: (dataset) => set({ selectedDataset: dataset }),

            setDatasetAnalysis: (analysis) => set({ datasetAnalysis: analysis }),

            setAnalyzingDataset: (isAnalyzing) => set({ isAnalyzingDataset: isAnalyzing }),

            // Paper context actions
            addReferenceToContext: (ref) => set((state) => {
                const exists = state.paperContext.selectedReferences.some(r => r.id === ref.id);
                if (exists) return state;
                return {
                    paperContext: {
                        ...state.paperContext,
                        selectedReferences: [...state.paperContext.selectedReferences, ref],
                    },
                };
            }),

            removeReferenceFromContext: (refId) => set((state) => ({
                paperContext: {
                    ...state.paperContext,
                    selectedReferences: state.paperContext.selectedReferences.filter(r => r.id !== refId),
                },
            })),

            addDatasetToContext: (dataset, analysis) => set((state) => {
                const exists = state.paperContext.selectedDatasets.some(d => d.id === dataset.id);
                if (exists) return state;
                const newAnalyses = new Map(state.paperContext.datasetAnalyses);
                if (analysis) {
                    newAnalyses.set(dataset.id, analysis);
                }
                return {
                    paperContext: {
                        ...state.paperContext,
                        selectedDatasets: [...state.paperContext.selectedDatasets, dataset],
                        datasetAnalyses: newAnalyses,
                    },
                };
            }),

            removeDatasetFromContext: (datasetId) => set((state) => {
                const newAnalyses = new Map(state.paperContext.datasetAnalyses);
                newAnalyses.delete(datasetId);
                return {
                    paperContext: {
                        ...state.paperContext,
                        selectedDatasets: state.paperContext.selectedDatasets.filter(d => d.id !== datasetId),
                        datasetAnalyses: newAnalyses,
                    },
                };
            }),

            addDatasetAnalysis: (datasetId, analysis) => set((state) => {
                const newAnalyses = new Map(state.paperContext.datasetAnalyses);
                newAnalyses.set(datasetId, analysis);
                return {
                    paperContext: {
                        ...state.paperContext,
                        datasetAnalyses: newAnalyses,
                    },
                };
            }),

            setResearchNotes: (notes) => set((state) => ({
                paperContext: {
                    ...state.paperContext,
                    researchNotes: notes,
                },
            })),

            clearPaperContext: () => set({ paperContext: { ...emptyPaperContext } }),

            isReferenceSelected: (refId) => {
                return get().paperContext.selectedReferences.some(r => r.id === refId);
            },

            isDatasetSelected: (datasetId) => {
                return get().paperContext.selectedDatasets.some(d => d.id === datasetId);
            },

            clearReferenceSearch: () => set({
                referenceQuery: '',
                referenceResults: [],
                referenceSearchError: null,
            }),

            clearDatasetSearch: () => set({
                datasetQuery: '',
                datasetResults: [],
                datasetSearchError: null,
                selectedDataset: null,
                datasetAnalysis: null,
            }),

            reset: () => set({
                referenceQuery: '',
                referenceResults: [],
                isSearchingReferences: false,
                referenceSearchError: null,
                datasetQuery: '',
                datasetResults: [],
                isSearchingDatasets: false,
                datasetSearchError: null,
                selectedDataset: null,
                datasetAnalysis: null,
                isAnalyzingDataset: false,
                paperContext: { ...emptyPaperContext },
            }),
        }),
        {
            name: 'citeai-research-context',
            partialize: (state) => ({
                recentReferenceSearches: state.recentReferenceSearches,
                recentDatasetSearches: state.recentDatasetSearches,
                paperContext: {
                    selectedReferences: state.paperContext.selectedReferences,
                    selectedDatasets: state.paperContext.selectedDatasets,
                    researchNotes: state.paperContext.researchNotes,
                    // Note: Map doesn't serialize well, so analyses won't persist
                },
            }),
        }
    )
);
