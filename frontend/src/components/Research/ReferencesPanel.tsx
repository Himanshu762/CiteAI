import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, BookOpen, Plus, Check, ExternalLink, Loader2, X, Clock, FileText } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Button } from '../ui/components';
import { searchReferences, Reference } from '../../services/references-api';
import { formatAPAInTextCitation } from '../../services/citation-formatter';
import { useResearchStore } from '../../lib/store/use-research-store';
import { usePaperStore } from '../../lib/store/use-paper-store';

export function ReferencesPanel() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<Reference[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { selectedReferences, addReference, removeReference } = usePaperStore();
    const {
        recentReferenceSearches,
        addRecentReferenceSearch,
        paperContext,
        addReferenceToContext,
        removeReferenceFromContext
    } = useResearchStore();

    const handleSearch = async () => {
        if (!query.trim()) return;

        setIsSearching(true);
        setError(null);
        addRecentReferenceSearch(query.trim());

        try {
            const result = await searchReferences({ query: query.trim(), limit: 15 });
            setResults(result.references);
            if (result.references.length === 0) {
                toast('No references found', { icon: '📚' });
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Search failed';
            setError(message);
            toast.error(message);
        } finally {
            setIsSearching(false);
        }
    };

    const isSelected = (ref: Reference) =>
        selectedReferences.some(r => r.id === ref.id);

    const isInPaperContext = (ref: Reference) =>
        paperContext.selectedReferences.some(r => r.id === ref.id);

    const toggleReference = (ref: Reference) => {
        if (isSelected(ref)) {
            removeReference(ref.id);
            toast.success('Reference removed');
        } else {
            addReference(ref);
            toast.success('Reference added');
        }
    };

    const togglePaperContext = (ref: Reference) => {
        if (isInPaperContext(ref)) {
            removeReferenceFromContext(ref.id);
            toast.success('Removed from paper context');
        } else {
            addReferenceToContext(ref);
            toast.success('Added to paper context - will inform your paper!');
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
                    placeholder="Search academic papers..."
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
                        <Search className="w-4 h-4 mr-2" />
                        Search References
                    </>
                )}
            </Button>

            {/* Recent Searches */}
            {recentReferenceSearches.length > 0 && !results.length && (
                <div className="space-y-2">
                    <p className="text-xs font-medium text-slate-500 flex items-center gap-1">
                        <Clock size={12} />
                        Recent searches
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {recentReferenceSearches.slice(0, 5).map((search) => (
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

            {/* Selected References */}
            {selectedReferences.length > 0 && (
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                    <p className="text-sm font-medium text-blue-700 dark:text-blue-400 mb-2">
                        Selected ({selectedReferences.length})
                    </p>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                        {selectedReferences.map((ref) => (
                            <div key={ref.id} className="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400">
                                <Check size={12} />
                                <span className="flex-1 truncate">{ref.title}</span>
                                <button
                                    onClick={() => removeReference(ref.id)}
                                    className="text-blue-400 hover:text-red-500"
                                >
                                    <X size={12} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Error */}
            {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg text-sm text-red-600 dark:text-red-400">
                    {error}
                </div>
            )}

            {/* Search Results */}
            <AnimatePresence>
                {results.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="space-y-3 max-h-[400px] overflow-y-auto"
                    >
                        <p className="text-xs text-slate-500">{results.length} results</p>

                        {results.map((ref) => (
                            <motion.div
                                key={ref.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`p-3 rounded-lg border transition-colors ${isSelected(ref)
                                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                                    }`}
                            >
                                <div className="flex justify-between items-start gap-2">
                                    <h4 className="font-medium text-sm text-slate-900 dark:text-white line-clamp-2">
                                        {ref.title}
                                    </h4>
                                    <button
                                        onClick={() => toggleReference(ref)}
                                        className={`flex-shrink-0 p-1 rounded ${isSelected(ref)
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                                            }`}
                                    >
                                        {isSelected(ref) ? <Check size={14} /> : <Plus size={14} />}
                                    </button>
                                </div>

                                <p className="text-xs text-slate-500 mt-1">
                                    {ref.authors.map(a => a.name).slice(0, 3).join(', ')}
                                    {ref.authors.length > 3 && ` et al.`}
                                    {ref.year && ` (${ref.year})`}
                                </p>

                                {ref.venue && (
                                    <p className="text-xs text-slate-400 italic truncate">{ref.venue}</p>
                                )}

                                {ref.abstract && (
                                    <p className="text-xs text-slate-500 mt-2 line-clamp-2">
                                        {ref.abstract}
                                    </p>
                                )}

                                <div className="flex items-center gap-3 mt-2 text-xs">
                                    {ref.citationCount !== undefined && (
                                        <span className="text-slate-400">
                                            {ref.citationCount.toLocaleString()} citations
                                        </span>
                                    )}
                                    {ref.isOpenAccess && (
                                        <span className="text-green-600 dark:text-green-400">Open Access</span>
                                    )}
                                    {ref.doi && (
                                        <a
                                            href={`https://doi.org/${ref.doi}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-500 hover:underline flex items-center gap-1"
                                        >
                                            DOI <ExternalLink size={10} />
                                        </a>
                                    )}
                                </div>

                                {/* Citation Preview */}
                                <div className="mt-2 p-2 bg-slate-50 dark:bg-slate-800 rounded text-xs text-slate-600 dark:text-slate-400 font-mono">
                                    {formatAPAInTextCitation(ref)}
                                </div>

                                {/* Use in Paper Button */}
                                <button
                                    onClick={() => togglePaperContext(ref)}
                                    className={`mt-2 w-full flex items-center justify-center gap-1 px-3 py-1.5 text-xs rounded-lg transition-colors ${isInPaperContext(ref)
                                            ? 'bg-green-100 text-green-700 border border-green-300 hover:bg-green-200'
                                            : 'bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100'
                                        }`}
                                >
                                    <FileText size={12} />
                                    {isInPaperContext(ref) ? 'Added to Paper ✓' : 'Use in Paper'}
                                </button>
                            </motion.div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Empty State */}
            {!isSearching && !results.length && !error && (
                <div className="text-center py-8 text-slate-400">
                    <BookOpen size={32} className="mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Search for academic papers</p>
                    <p className="text-xs mt-1">Results from Semantic Scholar</p>
                </div>
            )}
        </div>
    );
}
