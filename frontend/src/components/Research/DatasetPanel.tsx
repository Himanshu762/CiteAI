import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Database, Download, BarChart2, Loader2, ExternalLink, FileSpreadsheet, FileText, Check } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Button } from '../ui/components';
import { searchDatasets, analyzeDataset, Dataset, DatasetAnalysis } from '../../services/dataset-finder';
import { useResearchStore } from '../../lib/store/use-research-store';

export function DatasetPanel() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<Dataset[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [selectedDataset, setSelectedDataset] = useState<Dataset | null>(null);
    const [analysis, setAnalysis] = useState<DatasetAnalysis | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const {
        recentDatasetSearches,
        addRecentDatasetSearch,
        paperContext,
        addDatasetToContext,
        removeDatasetFromContext,
        addDatasetAnalysis
    } = useResearchStore();

    const isInPaperContext = (dataset: Dataset) =>
        paperContext.selectedDatasets.some(d => d.id === dataset.id);

    const togglePaperContext = (dataset: Dataset) => {
        if (isInPaperContext(dataset)) {
            removeDatasetFromContext(dataset.id);
            toast.success('Removed from paper context');
        } else {
            addDatasetToContext(dataset);
            toast.success('Added to paper context - will inform your Results section!');
        }
    };

    const handleSearch = async () => {
        if (!query.trim()) return;

        setIsSearching(true);
        addRecentDatasetSearch(query.trim());

        try {
            const datasets = await searchDatasets({ query: query.trim(), limit: 10 });
            setResults(datasets);
            if (datasets.length === 0) {
                toast('No datasets found', { icon: '📊' });
            }
        } catch (err) {
            toast.error('Search failed');
        } finally {
            setIsSearching(false);
        }
    };

    const handleAnalyze = async (dataset: Dataset) => {
        setSelectedDataset(dataset);
        setIsAnalyzing(true);

        try {
            const source = dataset.source === 'local' ? 'huggingface' : dataset.source;
            const result = await analyzeDataset(dataset.id, source);
            setAnalysis(result);
            // Store analysis in paper context
            addDatasetAnalysis(dataset.id, result);
            toast.success('Analysis complete');
        } catch (err) {
            toast.error('Analysis failed');
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <div className="p-4 space-y-4">
            {/* Search Input */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    placeholder="Search datasets..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>

            <Button onClick={handleSearch} disabled={isSearching || !query.trim()} className="w-full">
                {isSearching ? (
                    <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Searching...
                    </>
                ) : (
                    <>
                        <Database className="w-4 h-4 mr-2" />
                        Find Datasets
                    </>
                )}
            </Button>

            {/* Recent Searches */}
            {recentDatasetSearches.length > 0 && !results.length && (
                <div className="space-y-2">
                    <p className="text-xs font-medium text-slate-500">Recent</p>
                    <div className="flex flex-wrap gap-2">
                        {recentDatasetSearches.slice(0, 5).map((search) => (
                            <button
                                key={search}
                                onClick={() => {
                                    setQuery(search);
                                    setTimeout(handleSearch, 0);
                                }}
                                className="text-xs px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400"
                            >
                                {search}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Analysis Modal */}
            <AnimatePresence>
                {selectedDataset && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700"
                    >
                        <div className="flex justify-between items-start mb-3">
                            <h4 className="font-medium text-sm text-slate-900 dark:text-white">
                                {selectedDataset.title}
                            </h4>
                            <button
                                onClick={() => {
                                    setSelectedDataset(null);
                                    setAnalysis(null);
                                }}
                                className="text-slate-400 hover:text-slate-600"
                            >
                                ×
                            </button>
                        </div>

                        {isAnalyzing ? (
                            <div className="flex items-center gap-2 text-slate-500 py-4">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span className="text-sm">Analyzing dataset...</span>
                            </div>
                        ) : analysis ? (
                            <div className="space-y-3">
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                    <div className="bg-white dark:bg-slate-700 p-2 rounded">
                                        <span className="text-slate-500">Rows</span>
                                        <p className="font-medium text-slate-900 dark:text-white">
                                            {analysis.summary.totalRows.toLocaleString()}
                                        </p>
                                    </div>
                                    <div className="bg-white dark:bg-slate-700 p-2 rounded">
                                        <span className="text-slate-500">Columns</span>
                                        <p className="font-medium text-slate-900 dark:text-white">
                                            {analysis.summary.totalColumns}
                                        </p>
                                    </div>
                                    <div className="bg-white dark:bg-slate-700 p-2 rounded">
                                        <span className="text-slate-500">Missing</span>
                                        <p className="font-medium text-slate-900 dark:text-white">
                                            {analysis.summary.missingValues.toLocaleString()}
                                        </p>
                                    </div>
                                    <div className="bg-white dark:bg-slate-700 p-2 rounded">
                                        <span className="text-slate-500">Duplicates</span>
                                        <p className="font-medium text-slate-900 dark:text-white">
                                            {analysis.summary.duplicateRows}
                                        </p>
                                    </div>
                                </div>

                                <div>
                                    <p className="text-xs font-medium text-slate-500 mb-1">Columns</p>
                                    <div className="space-y-1 max-h-24 overflow-y-auto">
                                        {analysis.columns.map((col) => (
                                            <div key={col.name} className="flex justify-between text-xs bg-white dark:bg-slate-700 px-2 py-1 rounded">
                                                <span className="text-slate-700 dark:text-slate-300">{col.name}</span>
                                                <span className="text-slate-400">{col.type}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ) : null}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Search Results */}
            <AnimatePresence>
                {results.length > 0 && !selectedDataset && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="space-y-3 max-h-[400px] overflow-y-auto"
                    >
                        <p className="text-xs text-slate-500">{results.length} datasets found</p>

                        {results.map((dataset) => (
                            <motion.div
                                key={dataset.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition-colors"
                            >
                                <h4 className="font-medium text-sm text-slate-900 dark:text-white line-clamp-2 mb-1">
                                    {dataset.title}
                                </h4>

                                <p className="text-xs text-slate-500 line-clamp-2 mb-2">
                                    {dataset.description}
                                </p>

                                <div className="flex flex-wrap gap-2 text-xs text-slate-400 mb-2">
                                    <span className="flex items-center gap-1">
                                        <FileSpreadsheet size={12} />
                                        {dataset.size}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Download size={12} />
                                        {dataset.downloadCount.toLocaleString()}
                                    </span>
                                    <span>{dataset.format.join(', ')}</span>
                                </div>

                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleAnalyze(dataset)}
                                        className="flex-1"
                                    >
                                        <BarChart2 size={14} className="mr-1" />
                                        Analyze
                                    </Button>
                                    <a
                                        href={dataset.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-1 px-3 py-1 text-xs text-blue-600 hover:text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-50"
                                    >
                                        Open <ExternalLink size={12} />
                                    </a>
                                </div>

                                {/* Use in Paper Button */}
                                <button
                                    onClick={() => togglePaperContext(dataset)}
                                    className={`mt-2 w-full flex items-center justify-center gap-1 px-3 py-1.5 text-xs rounded-lg transition-colors ${isInPaperContext(dataset)
                                            ? 'bg-green-100 text-green-700 border border-green-300 hover:bg-green-200'
                                            : 'bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100'
                                        }`}
                                >
                                    <FileText size={12} />
                                    {isInPaperContext(dataset) ? 'Added to Paper ✓' : 'Use in Paper'}
                                </button>
                            </motion.div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Empty State */}
            {!isSearching && !results.length && !selectedDataset && (
                <div className="text-center py-8 text-slate-400">
                    <Database size={32} className="mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Search for research datasets</p>
                    <p className="text-xs mt-1">Find data for your analysis</p>
                </div>
            )}
        </div>
    );
}
