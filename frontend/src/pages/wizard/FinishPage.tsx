import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileText, Download, Shield, Bot, Loader2, Check, Copy, ArrowLeft, ChevronDown, Sparkles, CheckCircle, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useWizardStore } from '../../lib/store/use-wizard-store';
import { usePaperStore } from '../../lib/store/use-paper-store';
import { analyzeOriginality } from '../../services/ai-plagiarism';
import { analyzeAIRisk, humanizeText, HumanizationLevel } from '../../services/ai-humanizer';
import { exportAndDownload } from '../../services/export-service';
import toast from 'react-hot-toast';

export default function FinishPage() {
    const navigate = useNavigate();
    const { reset: resetWizard, topic } = useWizardStore();
    const { currentPaper } = usePaperStore();

    const [activeTab, setActiveTab] = useState<'preview' | 'plagiarism' | 'humanize'>('preview');
    const [isCheckingPlagiarism, setIsCheckingPlagiarism] = useState(false);
    const [plagiarismScore, setPlagiarismScore] = useState<number | null>(null);
    const [aiRisk, setAiRisk] = useState<string | null>(null);
    const [isHumanizing, setIsHumanizing] = useState(false);
    const [showExportMenu, setShowExportMenu] = useState(false);

    const allContent = currentPaper?.sections.map(s => s.content).join('\n\n') || '';
    const totalWords = currentPaper?.sections.reduce((acc, s) => acc + s.wordCount, 0) || 0;

    // Redirect if no paper
    useEffect(() => {
        if (!currentPaper) {
            navigate('/compose');
        }
    }, [currentPaper, navigate]);

    const handleCheckPlagiarism = async () => {
        setIsCheckingPlagiarism(true);
        try {
            const result = await analyzeOriginality(allContent);
            setPlagiarismScore(result.overallScore);
            const risk = await analyzeAIRisk(allContent);
            setAiRisk(risk.risk);
            toast.success('Analysis complete');
        } catch (error) {
            toast.error('Check failed');
        } finally {
            setIsCheckingPlagiarism(false);
        }
    };

    const handleHumanize = async (level: HumanizationLevel) => {
        setIsHumanizing(true);
        try {
            await humanizeText(allContent, level);
            toast.success('Text humanized');
            setAiRisk('low');
        } catch (error) {
            toast.error('Humanization failed');
        } finally {
            setIsHumanizing(false);
        }
    };

    const handleExport = async (format: 'pdf' | 'docx') => {
        if (!currentPaper) return;
        setShowExportMenu(false);
        try {
            await exportAndDownload(currentPaper.sections, {
                format,
                title: currentPaper.topic,
            });
            toast.success(`Exported as ${format.toUpperCase()}`);
        } catch (error) {
            toast.error('Export failed');
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(allContent);
        toast.success('Copied to clipboard');
    };

    const handleNewPaper = () => {
        resetWizard();
        navigate('/');
    };

    const handleBack = () => {
        navigate('/compose');
    };

    const tabs = [
        { id: 'preview' as const, label: 'Preview', icon: FileText },
        { id: 'plagiarism' as const, label: 'Originality', icon: Shield },
        { id: 'humanize' as const, label: 'AI Check', icon: Bot },
    ];

    if (!currentPaper) {
        return null; // Will redirect
    }

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
                                <div className={`w-2 h-2 rounded-full ${i <= 4 ? 'bg-blue-500' : 'bg-zinc-700'}`} />
                                {i < 4 && <div className="w-4 h-px bg-blue-500" />}
                            </div>
                        ))}
                    </div>

                    {/* Export button */}
                    <div className="relative">
                        <button
                            onClick={() => setShowExportMenu(!showExportMenu)}
                            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium text-sm hover:shadow-lg hover:shadow-blue-500/25 transition-all"
                        >
                            <Download className="w-4 h-4" />
                            Export
                            <ChevronDown className="w-3 h-3" />
                        </button>

                        {showExportMenu && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="absolute right-0 mt-2 w-40 bg-zinc-900 rounded-xl border border-zinc-800 py-2 shadow-xl z-10"
                            >
                                {(['pdf', 'docx'] as const).map(format => (
                                    <button
                                        key={format}
                                        onClick={() => handleExport(format)}
                                        className="w-full px-4 py-2 text-left text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
                                    >
                                        {format.toUpperCase()}
                                    </button>
                                ))}
                            </motion.div>
                        )}
                    </div>
                </div>
            </header>

            {/* Main */}
            <main className="max-w-5xl mx-auto px-6 py-8">
                {/* Paper info */}
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <div className="flex items-center gap-3 mb-2">
                        <CheckCircle className="w-6 h-6 text-emerald-400" />
                        <span className="text-sm font-medium text-emerald-400">Paper Complete</span>
                    </div>
                    <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
                        {topic}
                    </h1>
                    <p className="text-zinc-400">
                        {totalWords.toLocaleString()} words • {currentPaper.sections.length} sections
                    </p>
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
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800">
                    {activeTab === 'preview' && (
                        <div className="p-6">
                            <div className="flex justify-end gap-2 mb-6">
                                <button
                                    onClick={handleCopy}
                                    className="flex items-center gap-2 px-3 py-1.5 text-sm text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                                >
                                    <Copy className="w-4 h-4" />
                                    Copy all
                                </button>
                            </div>
                            <div className="prose prose-invert prose-zinc max-w-none">
                                {currentPaper.sections.map((section, i) => (
                                    <motion.div
                                        key={section.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.05 }}
                                        className="mb-8 pb-8 border-b border-zinc-800 last:border-0"
                                    >
                                        <h2 className="text-xl font-bold text-white mb-4">
                                            {section.title}
                                        </h2>
                                        <div className="text-zinc-300 whitespace-pre-wrap leading-relaxed text-sm">
                                            {section.content}
                                        </div>
                                        <div className="mt-3 text-xs text-zinc-500">
                                            {section.wordCount} words
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'plagiarism' && (
                        <div className="p-8">
                            {plagiarismScore !== null ? (
                                <div className="text-center py-8">
                                    <div className={`w-28 h-28 mx-auto mb-6 rounded-2xl flex items-center justify-center text-4xl font-bold ${plagiarismScore >= 90
                                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                            : plagiarismScore >= 70
                                                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                                : 'bg-red-500/20 text-red-400 border border-red-500/30'
                                        }`}>
                                        {plagiarismScore}%
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-2">
                                        Originality Score
                                    </h3>
                                    <p className="text-zinc-400 max-w-md mx-auto">
                                        {plagiarismScore >= 90 ? 'Excellent! Your paper is highly original and ready for submission.' :
                                            plagiarismScore >= 70 ? 'Good originality, but consider rephrasing some sections for better results.' :
                                                'Consider revising your paper to improve originality before submission.'}
                                    </p>
                                    <button
                                        onClick={handleCheckPlagiarism}
                                        className="mt-6 text-sm text-blue-400 hover:text-blue-300"
                                    >
                                        Run again
                                    </button>
                                </div>
                            ) : (
                                <div className="text-center py-16">
                                    <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-zinc-800 flex items-center justify-center">
                                        <Shield className="w-10 h-10 text-zinc-600" />
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-2">
                                        Check Originality
                                    </h3>
                                    <p className="text-zinc-400 mb-6 max-w-sm mx-auto">
                                        Analyze your paper for potential plagiarism issues
                                    </p>
                                    <button
                                        onClick={handleCheckPlagiarism}
                                        disabled={isCheckingPlagiarism}
                                        className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
                                    >
                                        {isCheckingPlagiarism ? (
                                            <span className="flex items-center gap-2">
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                Analyzing...
                                            </span>
                                        ) : (
                                            'Run Check'
                                        )}
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'humanize' && (
                        <div className="p-8">
                            {aiRisk ? (
                                <div className="text-center py-8">
                                    <div className={`w-28 h-28 mx-auto mb-6 rounded-2xl flex items-center justify-center ${aiRisk === 'low'
                                            ? 'bg-emerald-500/20 border border-emerald-500/30'
                                            : aiRisk === 'medium'
                                                ? 'bg-amber-500/20 border border-amber-500/30'
                                                : 'bg-red-500/20 border border-red-500/30'
                                        }`}>
                                        <Bot className={`w-12 h-12 ${aiRisk === 'low' ? 'text-emerald-400' :
                                                aiRisk === 'medium' ? 'text-amber-400' : 'text-red-400'
                                            }`} />
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-2 capitalize">
                                        {aiRisk} AI Detection Risk
                                    </h3>
                                    <p className="text-zinc-400 mb-6">
                                        {aiRisk === 'low'
                                            ? 'Your paper appears to be written naturally.'
                                            : 'Consider humanizing the text to reduce detection risk.'}
                                    </p>
                                    {aiRisk !== 'low' && (
                                        <div className="flex justify-center gap-3">
                                            {(['light', 'moderate', 'strong'] as const).map(level => (
                                                <button
                                                    key={level}
                                                    onClick={() => handleHumanize(level)}
                                                    disabled={isHumanizing}
                                                    className="px-4 py-2 bg-zinc-800 text-zinc-300 rounded-lg text-sm font-medium hover:bg-zinc-700 hover:text-white transition-colors capitalize disabled:opacity-50"
                                                >
                                                    {level}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="text-center py-16">
                                    <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-zinc-800 flex items-center justify-center">
                                        <Bot className="w-10 h-10 text-zinc-600" />
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-2">
                                        AI Detection Check
                                    </h3>
                                    <p className="text-zinc-400 mb-6 max-w-sm mx-auto">
                                        Analyze how likely your paper is to be flagged by AI detectors
                                    </p>
                                    <button
                                        onClick={handleCheckPlagiarism}
                                        disabled={isCheckingPlagiarism}
                                        className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
                                    >
                                        {isCheckingPlagiarism ? (
                                            <span className="flex items-center gap-2">
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                Analyzing...
                                            </span>
                                        ) : (
                                            'Analyze'
                                        )}
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* New paper */}
                <div className="mt-8 text-center">
                    <button
                        onClick={handleNewPaper}
                        className="inline-flex items-center gap-2 text-zinc-500 hover:text-white text-sm transition-colors"
                    >
                        <Sparkles className="w-4 h-4" />
                        Start a new paper
                    </button>
                </div>
            </main>
        </div>
    );
}
