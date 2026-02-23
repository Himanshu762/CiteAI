import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    CheckCircle, AlertTriangle, FileText, BarChart2, Loader2,
    BookCheck, Gauge, Type, RefreshCw, Wand2, Sparkles, Bot, Shield,
    ChevronDown, ChevronUp
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Button, Badge, Alert, ProgressBar } from '../ui/components';
import { PaperSection } from '../../services/paper-generator';
import { analyzeQuality, fixPlagiarism, QualityAnalysis } from '../../services/plagiarism-checker';
import { detectAIContent, AIDetectionResult } from '../../services/ai-detector-v2';
import { humanizeContent, HumanizationLevel } from '../../services/humanizer-v2';
import { reduceTextSimilarity } from '../../services/anti-plagiarism';
import { usePaperStore } from '../../lib/store/use-paper-store';

interface QualityPanelProps {
    sections: PaperSection[];
    onContentUpdate?: (content: string) => void;
}

export function QualityPanel({ sections, onContentUpdate }: QualityPanelProps) {
    const [analysis, setAnalysis] = useState<QualityAnalysis | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isFixing, setIsFixing] = useState(false);
    const [isHumanizing, setIsHumanizing] = useState(false);
    const [progressStatus, setProgressStatus] = useState<string>('');
    const [fixProgress, setFixProgress] = useState(0);
    const [humanizationLevel, setHumanizationLevel] = useState<HumanizationLevel>(3);
    const [aiRisk, setAiRisk] = useState<AIDetectionResult | null>(null);
    const [showMetrics, setShowMetrics] = useState(false);

    const { setQualityReport, setCheckingQuality } = usePaperStore();

    const hasContent = sections.some(s => s.content.length > 0);
    const fullText = sections.map(s => s.content).join('\n\n');

    const runAnalysis = async () => {
        if (!hasContent) {
            toast.error('No content to analyze');
            return;
        }

        setIsAnalyzing(true);
        setCheckingQuality(true);
        setProgressStatus('Starting AI analysis...');

        try {
            const result = await analyzeQuality(fullText, (status) => {
                setProgressStatus(status);
            });

            setAnalysis(result);
            setQualityReport({
                ...result,
                checkedAt: new Date(),
            });

            // Use v2 AI detection (synchronous - pure algorithmic)
            const aiResult = detectAIContent(fullText);
            setAiRisk(aiResult);

            toast.success('Analysis complete');
        } catch (error) {
            toast.error('Analysis failed');
            console.error('Quality analysis error:', error);
        } finally {
            setIsAnalyzing(false);
            setCheckingQuality(false);
            setProgressStatus('');
        }
    };

    const handleAutoFix = async () => {
        if (!hasContent || !analysis?.canAutoFix) {
            toast.error('No issues to fix');
            return;
        }

        setIsFixing(true);
        setFixProgress(0);

        try {
            const result = await fixPlagiarism(fullText, (status, progress) => {
                setProgressStatus(status);
                setFixProgress(progress);
            });

            if (result.passagesFixed > 0) {
                onContentUpdate?.(result.fixedText);
                toast.success(`Fixed ${result.passagesFixed} passage(s)! Originality: ${result.originalScore}% → ${result.newScore}%`);

                // Re-run analysis after fix
                setTimeout(() => runAnalysis(), 500);
            } else {
                toast('No passages needed fixing', { icon: '✨' });
            }
        } catch (error) {
            toast.error('Auto-fix failed');
            console.error('Auto-fix error:', error);
        } finally {
            setIsFixing(false);
            setProgressStatus('');
            setFixProgress(0);
        }
    };

    const handleHumanize = async () => {
        if (!hasContent) {
            toast.error('No content to humanize');
            return;
        }

        setIsHumanizing(true);
        setProgressStatus('Humanizing content...');

        try {
            // Use v2 humanizer with numeric level
            const result = await humanizeContent(fullText, humanizationLevel);

            // Also apply anti-plagiarism
            const antiPlagResult = reduceTextSimilarity(result.humanizedText, 'moderate');

            onContentUpdate?.(antiPlagResult.processedText);

            // Re-analyze with v2 detector after humanization
            const newAiRisk = detectAIContent(antiPlagResult.processedText);
            setAiRisk(newAiRisk);

            toast.success(`Humanized! Estimated ${result.estimatedReduction}% AI score reduction`);

            // Re-run analysis
            setTimeout(() => runAnalysis(), 500);
        } catch (error) {
            toast.error('Humanization failed');
            console.error('Humanize error:', error);
        } finally {
            setIsHumanizing(false);
            setProgressStatus('');
        }
    };

    // Auto-run analysis when content changes significantly
    useEffect(() => {
        if (hasContent && !analysis && !isAnalyzing) {
            const timer = setTimeout(() => runAnalysis(), 2000);
            return () => clearTimeout(timer);
        }
    }, [hasContent]);

    const getScoreColor = (score: number, type: 'originality' | 'readability'): 'green' | 'amber' | 'red' => {
        if (score > 80) return 'green';
        if (score > 60) return 'amber';
        return 'red';
    };

    const getRiskColor = (risk: string) => {
        switch (risk) {
            case 'LOW': return 'text-green-600';
            case 'MEDIUM': return 'text-amber-600';
            case 'HIGH': return 'text-orange-600';
            case 'VERY_HIGH': return 'text-red-600';
            default: return 'text-amber-600';
        }
    };

    const getGradeLabel = (level: number) => {
        if (level <= 8) return 'Easy';
        if (level <= 12) return 'Standard';
        if (level <= 16) return 'Advanced';
        return 'Expert';
    };

    return (
        <div className="p-4 space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-slate-900 dark:text-white flex items-center gap-2">
                    <CheckCircle size={16} />
                    Quality Analysis
                </h3>
                <div className="flex items-center gap-2">
                    {analysis?.canAutoFix && !isFixing && !isAnalyzing && !isHumanizing && (
                        <Button
                            variant="primary"
                            size="sm"
                            onClick={handleAutoFix}
                            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                        >
                            <Wand2 size={14} className="mr-1" />
                            Auto-Fix
                        </Button>
                    )}
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={runAnalysis}
                        disabled={isAnalyzing || isFixing || isHumanizing || !hasContent}
                    >
                        {isAnalyzing ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <RefreshCw size={14} />
                        )}
                    </Button>
                </div>
            </div>

            {/* AI Badge */}
            <Badge variant="success">
                <Sparkles size={12} className="mr-1" />
                AI-Powered • Unlimited
            </Badge>

            {/* Empty State */}
            {!hasContent ? (
                <div className="text-center py-8 text-slate-400">
                    <FileText size={32} className="mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Generate content to analyze</p>
                </div>
            ) : isAnalyzing || isFixing || isHumanizing ? (
                /* Loading State */
                <div className="text-center py-8">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-blue-600" />
                    <p className="text-sm text-slate-600 dark:text-slate-400">{progressStatus || 'Processing...'}</p>
                    {(isFixing || isHumanizing) && (
                        <div className="mt-3 px-4">
                            <ProgressBar value={fixProgress} color="blue" />
                            <p className="text-xs text-slate-400 mt-1">{fixProgress}%</p>
                        </div>
                    )}
                </div>
            ) : analysis ? (
                /* Results */
                <div className="space-y-4">
                    {/* Main Scores */}
                    <div className="grid grid-cols-2 gap-3">
                        {/* Originality Score */}
                        <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <BookCheck size={16} className="text-slate-500" />
                                <span className="text-xs font-medium text-slate-500">Originality</span>
                            </div>
                            <p className={`text-2xl font-bold ${getScoreColor(analysis.originalityScore, 'originality') === 'green' ? 'text-green-600' :
                                getScoreColor(analysis.originalityScore, 'originality') === 'amber' ? 'text-amber-600' : 'text-red-600'
                                }`}>
                                {analysis.originalityScore}%
                            </p>
                            <ProgressBar
                                value={analysis.originalityScore}
                                color={getScoreColor(analysis.originalityScore, 'originality')}
                                className="mt-2"
                            />
                        </div>

                        {/* AI Detection Risk */}
                        <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <Bot size={16} className="text-slate-500" />
                                <span className="text-xs font-medium text-slate-500">AI Detection</span>
                            </div>
                            {aiRisk ? (
                                <>
                                    <p className={`text-2xl font-bold ${getRiskColor(aiRisk.riskLevel)}`}>
                                        {aiRisk.riskLevel}
                                    </p>
                                    <p className="text-xs text-slate-500 mt-1">
                                        AI Score: {aiRisk.overallScore}% ({aiRisk.confidence}% confident)
                                    </p>
                                    {/* Expandable metrics */}
                                    <button
                                        onClick={() => setShowMetrics(!showMetrics)}
                                        className="text-xs text-blue-500 flex items-center gap-1 mt-2 hover:underline"
                                    >
                                        {showMetrics ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                                        {showMetrics ? 'Hide' : 'Show'} Metrics
                                    </button>
                                    {showMetrics && (
                                        <div className="mt-2 space-y-1">
                                            {aiRisk.metrics.slice(0, 5).map((m, i) => (
                                                <div key={i} className="flex justify-between text-xs">
                                                    <span className="text-slate-500">{m.name}</span>
                                                    <span className={m.score > 60 ? 'text-red-500' : m.score > 40 ? 'text-amber-500' : 'text-green-500'}>
                                                        {m.score}%
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </>
                            ) : (
                                <p className="text-sm text-slate-400">Analyzing...</p>
                            )}
                        </div>
                    </div>

                    {/* AI Humanizer Section */}
                    {aiRisk && aiRisk.riskLevel !== 'LOW' && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-lg p-4 border border-emerald-200 dark:border-emerald-800"
                        >
                            <div className="flex items-center gap-3 mb-3">
                                <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                                    <Shield className="w-5 h-5 text-emerald-600" />
                                </div>
                                <div className="flex-1">
                                    <p className="font-medium text-emerald-900 dark:text-emerald-100 text-sm">
                                        AI Detection Risk: {aiRisk.riskLevel}
                                    </p>
                                    <p className="text-xs text-emerald-600 dark:text-emerald-400">
                                        Humanize to reduce AI detection patterns
                                    </p>
                                </div>
                            </div>

                            {/* Humanization Level Selector - Numeric 1-5 */}
                            <div className="flex items-center gap-2 mb-3">
                                <span className="text-xs text-slate-600">Level:</span>
                                {([1, 2, 3, 4, 5] as HumanizationLevel[]).map((level) => (
                                    <button
                                        key={level}
                                        onClick={() => setHumanizationLevel(level)}
                                        className={`w-8 h-8 text-xs rounded-full transition-colors font-medium ${humanizationLevel === level
                                            ? 'bg-emerald-600 text-white'
                                            : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-emerald-100'
                                            }`}
                                        title={level === 1 ? 'Minimal' : level === 2 ? 'Light' : level === 3 ? 'Moderate' : level === 4 ? 'Strong' : 'Maximum'}
                                    >
                                        {level}
                                    </button>
                                ))}
                            </div>

                            <Button
                                variant="primary"
                                size="sm"
                                onClick={handleHumanize}
                                disabled={isHumanizing}
                                className="w-full bg-emerald-600 hover:bg-emerald-700"
                            >
                                <Shield size={14} className="mr-1" />
                                Humanize Text
                            </Button>
                        </motion.div>
                    )}

                    {/* Auto-Fix Banner */}
                    {analysis.canAutoFix && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800"
                        >
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                                    <Wand2 className="w-5 h-5 text-purple-600" />
                                </div>
                                <div className="flex-1">
                                    <p className="font-medium text-purple-900 dark:text-purple-100 text-sm">
                                        Auto-Fix Available
                                    </p>
                                    <p className="text-xs text-purple-600 dark:text-purple-400">
                                        AI can paraphrase flagged passages to improve originality
                                    </p>
                                </div>
                                <Button
                                    variant="primary"
                                    size="sm"
                                    onClick={handleAutoFix}
                                    disabled={isFixing}
                                    className="bg-purple-600 hover:bg-purple-700"
                                >
                                    Fix Now
                                </Button>
                            </div>
                        </motion.div>
                    )}

                    {/* Readability & Grade */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <Gauge size={16} className="text-slate-500" />
                                <span className="text-xs font-medium text-slate-500">Readability</span>
                            </div>
                            <p className={`text-2xl font-bold ${getScoreColor(analysis.readabilityScore, 'readability') === 'green' ? 'text-green-600' :
                                getScoreColor(analysis.readabilityScore, 'readability') === 'amber' ? 'text-amber-600' : 'text-red-600'
                                }`}>
                                {analysis.readabilityScore}
                            </p>
                        </div>

                        <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <Type size={16} className="text-slate-500" />
                                <span className="text-xs font-medium text-slate-500">Grade Level</span>
                            </div>
                            <p className="text-2xl font-bold text-slate-900 dark:text-white">
                                {analysis.gradeLevel}
                            </p>
                            <p className="text-xs text-slate-500">{getGradeLabel(analysis.gradeLevel)}</p>
                        </div>
                    </div>

                    {/* Statistics */}
                    <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
                        <p className="text-xs font-medium text-slate-500 mb-3 flex items-center gap-1">
                            <BarChart2 size={12} />
                            Statistics
                        </p>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="flex justify-between">
                                <span className="text-slate-500">Words:</span>
                                <span className="font-medium text-slate-700 dark:text-slate-300">
                                    {analysis.wordCount.toLocaleString()}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">Sentences:</span>
                                <span className="font-medium text-slate-700 dark:text-slate-300">
                                    {analysis.sentenceCount}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">Avg. Words/Sent:</span>
                                <span className="font-medium text-slate-700 dark:text-slate-300">
                                    {analysis.avgWordsPerSentence}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">Avg. Syllables:</span>
                                <span className="font-medium text-slate-700 dark:text-slate-300">
                                    {analysis.avgSyllablesPerWord}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Recommendations */}
                    {analysis.recommendations.length > 0 && (
                        <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4">
                            <p className="text-xs font-medium text-amber-600 dark:text-amber-400 mb-2 flex items-center gap-1">
                                <AlertTriangle size={12} />
                                Recommendations
                            </p>
                            <ul className="space-y-1">
                                {analysis.recommendations.map((rec, index) => (
                                    <li key={index} className="text-xs text-amber-700 dark:text-amber-300 flex items-start gap-2">
                                        <span className="text-amber-400">•</span>
                                        {rec}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* All Good */}
                    {analysis.originalityScore >= 85 && aiRisk?.riskLevel === 'LOW' && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 text-center"
                        >
                            <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                            <p className="font-medium text-green-700 dark:text-green-400">Excellent Quality!</p>
                            <p className="text-xs text-green-600 dark:text-green-500 mt-1">
                                Your paper meets high standards with low AI detection risk
                            </p>
                        </motion.div>
                    )}
                </div>
            ) : null}
        </div>
    );
}

