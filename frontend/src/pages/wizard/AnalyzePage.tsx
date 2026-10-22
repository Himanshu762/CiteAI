import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Loader2, ArrowRight, ArrowLeft, Database, Plus, Check, X, Sparkles, TrendingUp, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useWizardStore } from '../../lib/store/use-wizard-store';
import { useResearchStore } from '../../lib/store/use-research-store';
import { searchDatasets, Dataset } from '../../services/dataset-finder';
import { analyzeSpecificDataset } from '../../services/data-analysis/auto-analyze';
import { AutoAnalysisPanel } from '../../components/analysis/AutoAnalysisPanel';
import { AnalysisReportCard } from '../../components/analysis/AnalysisReportCard';
import { discoverDatasetsForTopic } from '../../services/dataset-viz';
import toast from 'react-hot-toast';
import { disciplineName } from '../../services/disciplines';

export default function AnalyzePage() {
    const navigate = useNavigate();
    const { topic, setStage, researchQuestions, fieldId } = useWizardStore();
    const { paperContext, addDatasetToContext, removeDatasetFromContext, addAnalysisReport, removeAnalysisReport, toggleReportInPaper } = useResearchStore();
    const selectedQuestions = researchQuestions.filter(q => q.selected).map(q => q.question);

    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<Dataset[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [analyzingId, setAnalyzingId] = useState<string | null>(null);
    const [suggestedQueries, setSuggestedQueries] = useState<string[]>([]);
    const [isDiscovering, setIsDiscovering] = useState(false);

    // Redirect if no topic
    useEffect(() => {
        if (!topic) {
            navigate('/');
        }
    }, [topic, navigate]);

    // Auto-discover dataset queries on mount
    useEffect(() => {
        if (topic && suggestedQueries.length === 0) {
            discoverDatasets();
        }
    }, [topic]);

    const discoverDatasets = async () => {
        setIsDiscovering(true);
        try {
            const queries = await discoverDatasetsForTopic(topic);
            setSuggestedQueries(queries);
            if (queries.length > 0) {
                handleSearchWithQuery(queries[0]);
            }
        } catch (error) {
            console.error('Discovery failed:', error);
        } finally {
            setIsDiscovering(false);
        }
    };

    const handleSearch = () => {
        handleSearchWithQuery(searchQuery.trim() || topic);
    };

    const handleSearchWithQuery = async (query: string) => {
        setIsSearching(true);
        try {
            const results = await searchDatasets({ query, limit: 10 });
            // Filter to HuggingFace datasets (we can analyze these)
            const hfResults = results.filter(r => r.source === 'huggingface');
            setSearchResults(hfResults.length > 0 ? hfResults : results);
            if (results.length === 0) {
                toast('No datasets found. Try different keywords.');
            }
        } catch {
            toast.error('Search failed');
        } finally {
            setIsSearching(false);
        }
    };

    const handleAnalyze = async (dataset: Dataset) => {
        if (dataset.source !== 'huggingface') {
            toast.error('Analysis is only available for Hugging Face datasets');
            return;
        }

        setAnalyzingId(dataset.id);
        try {
            const report = await analyzeSpecificDataset(topic, dataset, { researchQuestions: selectedQuestions });
            if (!report || report.results.length === 0) {
                toast.error('This dataset has no columns suitable for statistical tests');
                return;
            }
            addAnalysisReport(report);
            if (!isSelected(dataset)) addDatasetToContext(dataset);
            toast.success('Analysis complete');
        } catch (error) {
            console.error('Analysis failed:', error);
            toast.error(error instanceof Error ? error.message : 'Could not analyze dataset');
        } finally {
            setAnalyzingId(null);
        }
    };

    const isSelected = (dataset: Dataset) =>
        paperContext.selectedDatasets.some(d => d.id === dataset.id);

    const toggleDataset = (dataset: Dataset) => {
        if (isSelected(dataset)) {
            removeDatasetFromContext(dataset.id);
        } else {
            addDatasetToContext(dataset);
            toast.success('Added to paper');
        }
    };

    const handleNext = () => {
        setStage('write');
        navigate('/compose');
    };

    const handleBack = () => {
        navigate('/research');
    };

    return (
        <div className="min-h-screen bg-[#0a0a0f] text-white">
            {/* Header */}
            <header className="border-b border-zinc-800/50 bg-zinc-900/50 backdrop-blur-xl sticky top-0 z-50">
                <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
                    <button
                        onClick={handleBack}
                        className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back
                    </button>

                    <div className="flex items-center gap-2">
                        {['Start', 'Research', 'Analyze', 'Write', 'Finish'].map((step, i) => (
                            <div key={step} className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${i <= 2 ? 'bg-blue-500' : 'bg-zinc-700'}`} />
                                {i < 4 && <div className={`w-4 h-px ${i < 2 ? 'bg-blue-500' : 'bg-zinc-700'}`} />}
                            </div>
                        ))}
                    </div>

                    <button
                        onClick={handleNext}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                    >
                        Continue
                        <ArrowRight className="w-4 h-4" />
                    </button>
                </div>
            </header>

            {/* Main */}
            <main className="max-w-5xl mx-auto px-6 py-8">
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6"
                >
                    <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
                        Data Analysis
                    </h1>
                    <p className="text-zinc-400">
                        Find real datasets and get numerical statistics for your research
                    </p>
                </motion.div>

                <AutoAnalysisPanel topic={topic} researchQuestions={selectedQuestions} discipline={disciplineName(fieldId)} />

                {paperContext.analysisReports.length > 0 && (
                    <div className="mb-8 space-y-4">
                        {paperContext.analysisReports.map(report => (
                            <AnalysisReportCard
                                key={report.id}
                                report={report}
                                onToggleInclude={() => toggleReportInPaper(report.id)}
                                onRemove={() => removeAnalysisReport(report.id)}
                            />
                        ))}
                    </div>
                )}

                <h2 className="mb-3 text-sm font-medium text-zinc-400">Or search and pick a dataset yourself</h2>

                {/* Suggested queries */}
                {suggestedQueries.length > 0 && (
                    <div className="mb-6">
                        <div className="flex items-center gap-2 mb-3">
                            <Sparkles className="w-4 h-4 text-purple-400" />
                            <span className="text-sm text-zinc-400">AI-suggested searches:</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {suggestedQueries.map((query, i) => (
                                <button
                                    key={i}
                                    onClick={() => handleSearchWithQuery(query)}
                                    className="px-3 py-1.5 text-sm bg-purple-500/10 border border-purple-500/30 text-purple-300 rounded-lg hover:bg-purple-500/20 transition-colors"
                                >
                                    {query}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {isDiscovering && (
                    <div className="mb-6 flex items-center gap-2 text-zinc-400">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="text-sm">Finding relevant datasets...</span>
                    </div>
                )}

                {/* Search bar */}
                <div className="flex gap-2 mb-8">
                    <div className="flex-1 relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            placeholder="Search datasets..."
                            className="w-full pl-12 pr-4 py-3.5 bg-zinc-900/50 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500/50 transition-colors"
                        />
                    </div>
                    <button
                        onClick={handleSearch}
                        disabled={isSearching}
                        className="px-6 py-3.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
                    >
                        {isSearching ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Search'}
                    </button>
                </div>

                {/* Selected datasets */}
                {paperContext.selectedDatasets.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-8 p-4 bg-emerald-500/10 rounded-xl border border-emerald-500/20"
                    >
                        <span className="text-sm font-medium text-emerald-400 mb-3 block">
                            Selected datasets ({paperContext.selectedDatasets.length})
                        </span>
                        <div className="space-y-2">
                            {paperContext.selectedDatasets.map(ds => (
                                <div key={ds.id} className="flex items-center justify-between">
                                    <span className="text-sm text-emerald-200 truncate flex-1">{ds.title}</span>
                                    <button
                                        onClick={() => removeDatasetFromContext(ds.id)}
                                        className="ml-2 p-1 text-emerald-500 hover:text-red-400 transition-colors"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* Results */}
                {isSearching ? (
                    <div className="text-center py-16">
                        <Loader2 className="w-8 h-8 mx-auto animate-spin text-blue-500" />
                        <p className="text-zinc-500 mt-4">Searching datasets...</p>
                    </div>
                ) : searchResults.length > 0 ? (
                    <div className="space-y-6">
                        {searchResults.map((dataset, i) => (
                            <motion.div
                                key={dataset.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className="bg-zinc-900/50 rounded-xl border border-zinc-800 overflow-hidden"
                            >
                                {/* Dataset header */}
                                <div className="p-5">
                                    <div className="flex justify-between items-start gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${dataset.source === 'huggingface'
                                                    ? 'bg-gradient-to-br from-yellow-400 to-orange-500'
                                                    : 'bg-gradient-to-br from-blue-400 to-cyan-500'
                                                    }`}>
                                                    <Database className="w-4 h-4 text-white" />
                                                </div>
                                                <div>
                                                    <h3 className="font-semibold text-white">{dataset.title}</h3>
                                                    <span className={`text-xs px-2 py-0.5 rounded ${dataset.source === 'huggingface'
                                                        ? 'bg-yellow-500/20 text-yellow-300'
                                                        : 'bg-blue-500/20 text-blue-300'
                                                        }`}>
                                                        {dataset.source}
                                                    </span>
                                                </div>
                                            </div>
                                            <p className="text-sm text-zinc-400 mb-3 line-clamp-2">{dataset.description}</p>
                                            <a
                                                href={dataset.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300"
                                            >
                                                <ExternalLink className="w-3 h-3" />
                                                View Dataset
                                            </a>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleAnalyze(dataset)}
                                                disabled={analyzingId === dataset.id || dataset.source !== 'huggingface'}
                                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${dataset.source === 'huggingface'
                                                    ? 'bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50'
                                                    : 'bg-zinc-700 text-zinc-400 cursor-not-allowed'
                                                    }`}
                                            >
                                                {analyzingId === dataset.id ? (
                                                    <>
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                        Analyzing...
                                                    </>
                                                ) : (
                                                    <>
                                                        <TrendingUp className="w-4 h-4" />
                                                        Analyze Data
                                                    </>
                                                )}
                                            </button>
                                            <button
                                                onClick={() => toggleDataset(dataset)}
                                                className={`p-2.5 rounded-lg transition-all ${isSelected(dataset)
                                                    ? 'bg-emerald-500 text-white'
                                                    : 'bg-zinc-800 text-zinc-400 hover:bg-blue-600 hover:text-white'
                                                    }`}
                                            >
                                                {isSelected(dataset) ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                            </motion.div>
                        ))}
                    </div>
                ) : !isDiscovering && (
                    <div className="text-center py-20">
                        <Database className="w-12 h-12 mx-auto mb-4 text-zinc-700" />
                        <p className="text-zinc-500 mb-4">Search for datasets to analyze</p>
                        <button
                            onClick={handleSearch}
                            className="text-blue-400 hover:text-blue-300 text-sm"
                        >
                            Search based on your topic
                        </button>
                    </div>
                )}

                {/* Skip option */}
                <div className="mt-8 text-center">
                    <button
                        onClick={handleNext}
                        className="text-zinc-500 hover:text-zinc-300 text-sm"
                    >
                        Skip this step →
                    </button>
                </div>
            </main>
        </div>
    );
}
