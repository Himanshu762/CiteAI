import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Loader2, ArrowRight, ArrowLeft, Database, BarChart3, Plus, Check, X, Sparkles, TrendingUp, AlertTriangle, Lightbulb, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useWizardStore } from '../../lib/store/use-wizard-store';
import { useResearchStore } from '../../lib/store/use-research-store';
import { searchDatasets, Dataset } from '../../services/dataset-finder';
import { analyzeRealData, RealDataAnalysis, interpretFindings } from '../../services/real-data-analysis';
import { discoverDatasetsForTopic } from '../../services/dataset-viz';
import toast from 'react-hot-toast';

// Simple bar chart for statistics
const StatBar = ({ label, value, max, color = '#3b82f6' }: { label: string; value: number; max: number; color?: string }) => {
    const width = max > 0 ? (value / max) * 100 : 0;
    return (
        <div className="flex items-center gap-2 text-sm">
            <span className="text-zinc-400 w-24 truncate">{label}</span>
            <div className="flex-1 h-4 bg-zinc-800 rounded overflow-hidden">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(width, 100)}%` }}
                    transition={{ duration: 0.5 }}
                    className="h-full rounded"
                    style={{ backgroundColor: color }}
                />
            </div>
            <span className="text-zinc-500 w-16 text-right text-xs">{typeof value === 'number' ? value.toLocaleString() : value}</span>
        </div>
    );
};

export default function AnalyzePage() {
    const navigate = useNavigate();
    const { topic, setStage } = useWizardStore();
    const { paperContext, addDatasetToContext, removeDatasetFromContext, addDatasetAnalysis } = useResearchStore();

    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<Dataset[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [analyzingId, setAnalyzingId] = useState<string | null>(null);
    const [analyses, setAnalyses] = useState<Map<string, RealDataAnalysis>>(new Map());
    const [interpretations, setInterpretations] = useState<Map<string, string>>(new Map());
    const [suggestedQueries, setSuggestedQueries] = useState<string[]>([]);
    const [isDiscovering, setIsDiscovering] = useState(false);
    const [expandedDataset, setExpandedDataset] = useState<string | null>(null);

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
        } catch (error) {
            toast.error('Search failed');
        } finally {
            setIsSearching(false);
        }
    };

    const handleAnalyze = async (dataset: Dataset) => {
        if (dataset.source !== 'huggingface') {
            toast.error('Real analysis only available for HuggingFace datasets');
            return;
        }

        setAnalyzingId(dataset.id);
        setExpandedDataset(dataset.id);

        try {
            toast('Fetching real data sample...');
            const analysis = await analyzeRealData(dataset.id);
            setAnalyses(prev => new Map(prev).set(dataset.id, analysis));

            // Store summary in research context
            addDatasetAnalysis(dataset.id, {
                summary: {
                    totalRows: analysis.summary.totalRows,
                    totalColumns: analysis.summary.totalColumns,
                    missingValues: analysis.summary.missingValues,
                    duplicateRows: 0,
                },
                columns: analysis.columns.map(c => ({
                    name: c.name,
                    type: c.type === 'unknown' ? 'text' : c.type, // Map unknown to text
                    unique: c.unique,
                    missing: c.missing,
                    min: c.min,
                    max: c.max,
                    mean: c.mean,
                    topValues: c.topValues?.map(v => ({ value: v.value, count: v.count })),
                })),
                source: 'real',
            });

            // Get AI interpretation
            const interpretation = await interpretFindings(analysis, topic);
            setInterpretations(prev => new Map(prev).set(dataset.id, interpretation));

            toast.success('Analysis complete with real statistics!');
        } catch (error) {
            console.error('Analysis failed:', error);
            toast.error('Could not analyze dataset - data may not be publicly accessible');
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

                                {/* Analysis results */}
                                <AnimatePresence>
                                    {analyses.has(dataset.id) && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="border-t border-zinc-800"
                                        >
                                            <div className="p-5 bg-zinc-800/30">
                                                {/* Summary stats */}
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                                                    <div className="p-3 bg-zinc-900/50 rounded-lg text-center">
                                                        <div className="text-2xl font-bold text-white">
                                                            {analyses.get(dataset.id)!.summary.totalRows.toLocaleString()}
                                                        </div>
                                                        <div className="text-xs text-zinc-500">Total Rows</div>
                                                    </div>
                                                    <div className="p-3 bg-zinc-900/50 rounded-lg text-center">
                                                        <div className="text-2xl font-bold text-white">
                                                            {analyses.get(dataset.id)!.summary.totalColumns}
                                                        </div>
                                                        <div className="text-xs text-zinc-500">Columns</div>
                                                    </div>
                                                    <div className="p-3 bg-zinc-900/50 rounded-lg text-center">
                                                        <div className="text-2xl font-bold text-white">
                                                            {analyses.get(dataset.id)!.summary.numericColumns}
                                                        </div>
                                                        <div className="text-xs text-zinc-500">Numeric</div>
                                                    </div>
                                                    <div className="p-3 bg-zinc-900/50 rounded-lg text-center">
                                                        <div className="text-2xl font-bold text-white">
                                                            {analyses.get(dataset.id)!.summary.missingPercentage.toFixed(1)}%
                                                        </div>
                                                        <div className="text-xs text-zinc-500">Missing</div>
                                                    </div>
                                                </div>

                                                {/* AI Interpretation */}
                                                {interpretations.has(dataset.id) && (
                                                    <div className="mb-6 p-4 bg-purple-500/10 rounded-xl border border-purple-500/20">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <Sparkles className="w-4 h-4 text-purple-400" />
                                                            <span className="text-sm font-medium text-purple-300">AI Interpretation</span>
                                                        </div>
                                                        <p className="text-sm text-zinc-300 leading-relaxed">
                                                            {interpretations.get(dataset.id)}
                                                        </p>
                                                    </div>
                                                )}

                                                {/* Statistical Findings */}
                                                <div className="mb-6">
                                                    <h4 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
                                                        <BarChart3 className="w-4 h-4 text-blue-400" />
                                                        Statistical Findings
                                                    </h4>
                                                    <div className="grid gap-3">
                                                        {analyses.get(dataset.id)!.findings.map((finding, j) => (
                                                            <div
                                                                key={j}
                                                                className={`p-3 rounded-lg flex items-start gap-3 ${finding.type === 'warning'
                                                                    ? 'bg-amber-500/10 border border-amber-500/20'
                                                                    : finding.type === 'recommendation'
                                                                        ? 'bg-blue-500/10 border border-blue-500/20'
                                                                        : 'bg-zinc-800/50 border border-zinc-700/50'
                                                                    }`}
                                                            >
                                                                {finding.type === 'warning' ? (
                                                                    <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                                                                ) : (
                                                                    <Lightbulb className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                                                                )}
                                                                <div>
                                                                    <div className="text-sm font-medium text-white">{finding.title}</div>
                                                                    <div className="text-xs text-zinc-400 mt-0.5">{finding.description}</div>
                                                                </div>
                                                                {finding.value !== undefined && (
                                                                    <div className="ml-auto text-sm font-mono text-zinc-300">
                                                                        {typeof finding.value === 'number'
                                                                            ? finding.value.toLocaleString()
                                                                            : finding.value}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Correlations */}
                                                {analyses.get(dataset.id)!.correlations.length > 0 && (
                                                    <div className="mb-6">
                                                        <h4 className="text-sm font-medium text-white mb-3">Correlations</h4>
                                                        <div className="space-y-2">
                                                            {analyses.get(dataset.id)!.correlations.slice(0, 5).map((corr, j) => (
                                                                <div key={j} className="flex items-center gap-2 text-sm">
                                                                    <span className="text-zinc-400">{corr.column1}</span>
                                                                    <span className="text-zinc-600">↔</span>
                                                                    <span className="text-zinc-400">{corr.column2}</span>
                                                                    <div className={`ml-auto px-2 py-0.5 rounded text-xs ${corr.strength === 'strong' ? 'bg-green-500/20 text-green-300' :
                                                                        corr.strength === 'moderate' ? 'bg-blue-500/20 text-blue-300' :
                                                                            corr.strength === 'weak' ? 'bg-yellow-500/20 text-yellow-300' :
                                                                                'bg-zinc-700 text-zinc-400'
                                                                        }`}>
                                                                        r = {corr.correlation}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Column Statistics */}
                                                <div>
                                                    <h4 className="text-sm font-medium text-white mb-3">Column Statistics</h4>
                                                    <div className="grid gap-3 md:grid-cols-2">
                                                        {analyses.get(dataset.id)!.columns.slice(0, 6).map((col, j) => (
                                                            <div key={j} className="p-3 bg-zinc-900/50 rounded-lg">
                                                                <div className="flex items-center justify-between mb-2">
                                                                    <span className="text-sm font-medium text-white truncate">{col.name}</span>
                                                                    <span className={`text-xs px-2 py-0.5 rounded ${col.type === 'numeric' ? 'bg-blue-500/20 text-blue-300' :
                                                                        col.type === 'categorical' ? 'bg-purple-500/20 text-purple-300' :
                                                                            'bg-zinc-700 text-zinc-400'
                                                                        }`}>
                                                                        {col.type}
                                                                    </span>
                                                                </div>
                                                                <div className="text-xs text-zinc-500 space-y-1">
                                                                    <div>Unique: {col.unique.toLocaleString()} | Missing: {col.missingPercent.toFixed(1)}%</div>
                                                                    {col.type === 'numeric' && col.mean !== undefined && (
                                                                        <div>Mean: {col.mean} | Range: {col.min} - {col.max}</div>
                                                                    )}
                                                                    {col.topValues && col.topValues.length > 0 && (
                                                                        <div>Top: {col.topValues[0].value} ({col.topValues[0].percentage.toFixed(0)}%)</div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
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
