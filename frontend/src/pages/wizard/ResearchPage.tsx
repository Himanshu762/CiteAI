import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Loader2, ArrowRight, ArrowLeft, Lightbulb, HelpCircle, BookOpen, Plus, Check, X, Sparkles, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useWizardStore } from '../../lib/store/use-wizard-store';
import { useResearchStore } from '../../lib/store/use-research-store';
import { searchReferences, Reference, getPaperUrl, getAIRecommendedPapers } from '../../services/references-api';
import { geminiCompletion, GEMINI_MODELS } from '../../services/gemini-api';
import toast from 'react-hot-toast';

export default function ResearchPage() {
    const navigate = useNavigate();
    const { topic, researchGaps, researchQuestions, setResearchGaps, setResearchQuestions, isAnalyzingTopic, setAnalyzingTopic, setStage } = useWizardStore();
    const { paperContext, addReferenceToContext, removeReferenceFromContext } = useResearchStore();

    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<Reference[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [autoFetched, setAutoFetched] = useState(false);
    const [showManualSearch, setShowManualSearch] = useState(false);
    const [activeTab, setActiveTab] = useState<'gaps' | 'questions' | 'references'>('gaps');

    // Redirect if no topic
    useEffect(() => {
        if (!topic) {
            navigate('/');
        }
    }, [topic, navigate]);

    // Analyze topic on mount
    useEffect(() => {
        if (topic && researchGaps.length === 0 && !isAnalyzingTopic) {
            analyzeTopic();
        }
    }, [topic]);

    // Auto-fetch and auto-select references on mount
    useEffect(() => {
        if (topic && !autoFetched && paperContext.selectedReferences.length === 0) {
            autoFetchReferences();
        }
    }, [topic, autoFetched]);

    // Auto-fetch and select top references
    const autoFetchReferences = async () => {
        setAutoFetched(true);
        setIsSearching(true);
        try {
            toast('Finding relevant references with AI...');
            // Use AI-powered multi-concept search
            const references = await getAIRecommendedPapers(topic);
            setSearchResults(references);

            // Auto-select top 5 (already sorted by AI/citation count)
            const topRefs = references.slice(0, 5);

            for (const ref of topRefs) {
                if (!isRefSelected(ref)) {
                    addReferenceToContext(ref);
                }
            }

            if (topRefs.length > 0) {
                toast.success(`Auto-selected ${topRefs.length} relevant references`);
            }
        } catch (error) {
            console.error('Auto-fetch failed:', error);
        } finally {
            setIsSearching(false);
        }
    };

    const analyzeTopic = async () => {
        setAnalyzingTopic(true);
        try {
            const prompt = `You are an expert academic researcher. Analyze this research topic and identify key research areas.

Topic: "${topic}"

Provide a JSON response with:
1. "gaps" - 3-4 research gaps (areas that need more study). Each with "title" and "description"
2. "questions" - 4-5 specific research questions. Each with "question" text

IMPORTANT: Respond ONLY with valid JSON, no other text:
{
    "gaps": [{"title": "...", "description": "..."}],
    "questions": [{"question": "..."}]
}`;

            const result = await geminiCompletion(prompt, GEMINI_MODELS.FLASH);

            // Parse JSON from response
            const jsonMatch = result.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const data = JSON.parse(jsonMatch[0]);

                if (data.gaps && Array.isArray(data.gaps)) {
                    setResearchGaps(data.gaps.map((g: { title: string; description: string }, i: number) => ({
                        id: `gap-${i}`,
                        title: g.title || 'Research Gap',
                        description: g.description || '',
                        selected: true
                    })));
                }

                if (data.questions && Array.isArray(data.questions)) {
                    setResearchQuestions(data.questions.map((q: { question: string }, i: number) => ({
                        id: `q-${i}`,
                        question: q.question || '',
                        selected: true
                    })));
                }

                toast.success('Analysis complete!');
            } else {
                toast.error('Could not parse AI response');
            }
        } catch (error) {
            console.error('Topic analysis error:', error);
            toast.error('Analysis failed - check API key');
        } finally {
            setAnalyzingTopic(false);
        }
    };

    const handleSearch = async () => {
        const queryToSearch = searchQuery.trim() || topic;
        setIsSearching(true);
        try {
            // Pass topic for AI-powered relevance scoring
            const result = await searchReferences({ query: queryToSearch, limit: 10, topic });
            setSearchResults(result.references);
            if (result.references.length === 0) {
                toast('No papers found. Try different keywords.');
            }
        } catch (error) {
            toast.error('Search failed');
        } finally {
            setIsSearching(false);
        }
    };

    const isRefSelected = (ref: Reference) =>
        paperContext.selectedReferences.some(r => r.id === ref.id);

    const toggleRef = (ref: Reference) => {
        if (isRefSelected(ref)) {
            removeReferenceFromContext(ref.id);
        } else {
            addReferenceToContext(ref);
            toast.success('Added to paper');
        }
    };

    const handleNext = () => {
        setStage('data');
        navigate('/analyze');
    };

    const handleBack = () => {
        navigate('/');
    };

    const canProceed = researchGaps.length > 0 || paperContext.selectedReferences.length > 0;

    const tabs = [
        { id: 'gaps' as const, label: 'Research Gaps', icon: Lightbulb, count: researchGaps.length },
        { id: 'questions' as const, label: 'Questions', icon: HelpCircle, count: researchQuestions.length },
        { id: 'references' as const, label: 'References', icon: BookOpen, count: paperContext.selectedReferences.length },
    ];

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

                    {/* Progress indicator */}
                    <div className="flex items-center gap-2">
                        {['Start', 'Research', 'Analyze', 'Write', 'Finish'].map((step, i) => (
                            <div key={step} className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${i <= 1 ? 'bg-blue-500' : 'bg-zinc-700'}`} />
                                {i < 4 && <div className={`w-4 h-px ${i < 1 ? 'bg-blue-500' : 'bg-zinc-700'}`} />}
                            </div>
                        ))}
                    </div>

                    <button
                        onClick={handleNext}
                        disabled={!canProceed}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${canProceed
                            ? 'bg-blue-600 text-white hover:bg-blue-700'
                            : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                            }`}
                    >
                        Continue
                        <ArrowRight className="w-4 h-4" />
                    </button>
                </div>
            </header>

            {/* Main */}
            <main className="max-w-5xl mx-auto px-6 py-8">
                {/* Topic display */}
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <div className="text-sm text-zinc-500 mb-2">Researching</div>
                    <h1 className="text-2xl md:text-3xl font-bold text-white leading-tight">
                        {topic}
                    </h1>
                </motion.div>

                {/* Tabs */}
                <div className="flex gap-1 mb-6 bg-zinc-900/50 p-1 rounded-xl border border-zinc-800">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id
                                ? 'bg-zinc-800 text-white'
                                : 'text-zinc-400 hover:text-white'
                                }`}
                        >
                            <tab.icon className="w-4 h-4" />
                            {tab.label}
                            {tab.count > 0 && (
                                <span className={`px-1.5 py-0.5 rounded text-xs ${activeTab === tab.id ? 'bg-blue-600' : 'bg-zinc-700'
                                    }`}>
                                    {tab.count}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <AnimatePresence mode="wait">
                    {activeTab === 'gaps' && (
                        <motion.div
                            key="gaps"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{ duration: 0.2 }}
                        >
                            {isAnalyzingTopic ? (
                                <div className="flex flex-col items-center justify-center py-20">
                                    <div className="relative">
                                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                                            <Sparkles className="w-8 h-8 text-white animate-pulse" />
                                        </div>
                                        <motion.div
                                            className="absolute inset-0 rounded-2xl border-2 border-blue-400"
                                            animate={{ scale: [1, 1.2, 1], opacity: [1, 0, 1] }}
                                            transition={{ duration: 1.5, repeat: Infinity }}
                                        />
                                    </div>
                                    <p className="text-zinc-400 mt-6 text-lg">Analyzing your topic...</p>
                                    <p className="text-zinc-600 text-sm mt-2">This takes about 10 seconds</p>
                                </div>
                            ) : researchGaps.length > 0 ? (
                                <div className="grid gap-4">
                                    {researchGaps.map((gap, i) => (
                                        <motion.div
                                            key={gap.id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: i * 0.1 }}
                                            className="p-5 bg-zinc-900/50 rounded-xl border border-zinc-800 hover:border-zinc-700 transition-colors"
                                        >
                                            <div className="flex items-start gap-4">
                                                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                                                    <Lightbulb className="w-4 h-4 text-white" />
                                                </div>
                                                <div className="flex-1">
                                                    <h3 className="font-semibold text-white mb-1">{gap.title}</h3>
                                                    <p className="text-sm text-zinc-400 leading-relaxed">{gap.description}</p>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}

                                    <button
                                        onClick={analyzeTopic}
                                        className="flex items-center justify-center gap-2 py-3 text-sm text-zinc-500 hover:text-white transition-colors"
                                    >
                                        <Sparkles className="w-4 h-4" />
                                        Regenerate analysis
                                    </button>
                                </div>
                            ) : (
                                <div className="text-center py-20">
                                    <Lightbulb className="w-12 h-12 mx-auto mb-4 text-zinc-700" />
                                    <p className="text-zinc-500 mb-4">Analysis not started</p>
                                    <button
                                        onClick={analyzeTopic}
                                        className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
                                    >
                                        Analyze Topic
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    )}

                    {activeTab === 'questions' && (
                        <motion.div
                            key="questions"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{ duration: 0.2 }}
                        >
                            {researchQuestions.length > 0 ? (
                                <div className="space-y-3">
                                    {researchQuestions.map((q, i) => (
                                        <motion.div
                                            key={q.id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: i * 0.1 }}
                                            className="flex items-start gap-4 p-4 bg-zinc-900/50 rounded-xl border border-zinc-800"
                                        >
                                            <span className="flex-shrink-0 w-7 h-7 rounded-lg bg-gradient-to-br from-blue-400 to-indigo-500 text-white text-xs font-bold flex items-center justify-center">
                                                {i + 1}
                                            </span>
                                            <p className="text-zinc-200 leading-relaxed">{q.question}</p>
                                        </motion.div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-20 text-zinc-500">
                                    <HelpCircle className="w-12 h-12 mx-auto mb-4 text-zinc-700" />
                                    <p>Questions will appear after analysis</p>
                                </div>
                            )}
                        </motion.div>
                    )}

                    {activeTab === 'references' && (
                        <motion.div
                            key="references"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{ duration: 0.2 }}
                        >
                            {/* Search bar */}
                            <div className="flex gap-2 mb-6">
                                <div className="flex-1 relative">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                        placeholder="Search academic papers..."
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

                            {/* Selected references */}
                            {paperContext.selectedReferences.length > 0 && (
                                <div className="mb-6 p-4 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-sm font-medium text-emerald-400">
                                            Selected for paper ({paperContext.selectedReferences.length})
                                        </span>
                                    </div>
                                    <div className="space-y-2">
                                        {paperContext.selectedReferences.slice(0, 3).map(ref => (
                                            <div key={ref.id} className="flex items-center justify-between">
                                                <span className="text-sm text-emerald-200 truncate flex-1">{ref.title}</span>
                                                <button
                                                    onClick={() => removeReferenceFromContext(ref.id)}
                                                    className="ml-2 p-1 text-emerald-500 hover:text-red-400 transition-colors"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                        {paperContext.selectedReferences.length > 3 && (
                                            <p className="text-xs text-emerald-500">+{paperContext.selectedReferences.length - 3} more</p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Search results */}
                            {isSearching ? (
                                <div className="text-center py-16">
                                    <Loader2 className="w-8 h-8 mx-auto animate-spin text-blue-500" />
                                    <p className="text-zinc-500 mt-4">Searching papers...</p>
                                </div>
                            ) : searchResults.length > 0 ? (
                                <div className="space-y-3">
                                    {searchResults.map((ref, i) => (
                                        <motion.div
                                            key={ref.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: i * 0.05 }}
                                            className="p-4 bg-zinc-900/50 rounded-xl border border-zinc-800 hover:border-zinc-700 transition-colors"
                                        >
                                            <div className="flex justify-between items-start gap-4">
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-medium text-white mb-1 leading-snug">{ref.title}</h4>
                                                    <p className="text-xs text-zinc-500">
                                                        {ref.authors.slice(0, 3).map(a => a.name).join(', ')}
                                                        {ref.authors.length > 3 && ` +${ref.authors.length - 3}`}
                                                        {ref.year && ` • ${ref.year}`}
                                                        {ref.citationCount !== undefined && ref.citationCount > 0 && ` • ${ref.citationCount} citations`}
                                                    </p>
                                                    {ref.abstract && (
                                                        <p className="text-sm text-zinc-400 mt-2 line-clamp-2">{ref.abstract}</p>
                                                    )}
                                                    {/* Paper Link */}
                                                    <a
                                                        href={getPaperUrl(ref)}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-1 mt-2 text-xs text-blue-400 hover:text-blue-300"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <ExternalLink className="w-3 h-3" />
                                                        View Paper
                                                    </a>
                                                </div>
                                                <button
                                                    onClick={() => toggleRef(ref)}
                                                    className={`flex-shrink-0 p-2.5 rounded-lg transition-all ${isRefSelected(ref)
                                                        ? 'bg-emerald-500 text-white'
                                                        : 'bg-zinc-800 text-zinc-400 hover:bg-blue-600 hover:text-white'
                                                        }`}
                                                >
                                                    {isRefSelected(ref) ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                                                </button>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-16">
                                    <BookOpen className="w-12 h-12 mx-auto mb-4 text-zinc-700" />
                                    <p className="text-zinc-500 mb-4">Search for academic papers</p>
                                    <button
                                        onClick={handleSearch}
                                        className="text-blue-400 hover:text-blue-300 text-sm"
                                    >
                                        Search based on your topic
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
}
