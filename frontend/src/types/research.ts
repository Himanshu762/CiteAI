export interface SemanticScholarResult {
    paperId: string;
    title: string;
    authors: { name: string; authorId?: string }[];
    year: number;
    venue?: string;
    abstract?: string;
    citationCount?: number;
    isOpenAccess?: boolean;
    openAccessPdf?: { url: string };
    externalIds?: {
        DOI?: string;
        ArXiv?: string;
        PubMed?: string;
    };
}

export interface CrossRefResult {
    DOI: string;
    title: string[];
    author: { given?: string; family?: string }[];
    published: { 'date-parts': number[][] };
    'container-title': string[];
    URL: string;
}

export interface KaggleDataset {
    id: string;
    ref: string;
    title: string;
    subtitle: string;
    creatorName: string;
    totalBytes: number;
    downloadCount: number;
    voteCount: number;
    lastUpdated: string;
    tags: { name: string }[];
    licenseName: string;
    url: string;
}

export interface PlagiarismCheckResult {
    score: number;
    passages: {
        text: string;
        startIndex: number;
        endIndex: number;
        matchPercentage: number;
        source: {
            url: string;
            title: string;
            matchPercentage: number;
        };
    }[];
    totalWords: number;
    matchedWords: number;
    sources: {
        url: string;
        title: string;
        matchPercentage: number;
    }[];
}

export interface DatasetAnalysisResult {
    summary: {
        totalRows: number;
        totalColumns: number;
        missingValues: number;
        duplicateRows: number;
    };
    columns: {
        name: string;
        type: 'numeric' | 'categorical' | 'datetime' | 'text';
        unique: number;
        missing: number;
        min?: number;
        max?: number;
        mean?: number;
        topValues?: { value: string; count: number }[];
    }[];
    correlations?: { col1: string; col2: string; value: number }[];
}
