import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FileText, Settings2, Sparkles, Loader2, AlertTriangle,
    BookOpen, Database, Download, CheckCircle, RefreshCw,
    ChevronRight, ChevronLeft
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { DashboardNavbar } from '../components/navigation/Navigation';
import { Button, Input } from '../components/ui/components';
import { StreamingPaperViewer } from '../components/Paper/StreamingPaperViewer';
import { SectionSelector } from '../components/Paper/SectionSelector';
import { ReferencesPanel } from '../components/Research/ReferencesPanel';
import { DatasetPanel } from '../components/Research/DatasetPanel';
import { ExportPanel } from '../components/Export/ExportPanel';
import { QualityPanel } from '../components/quality/QualityPanel';
import { ModelSelector } from '../components/ModelSelector/ModelSelector';
import { usePaperStore } from '../lib/store/use-paper-store';
import { useResearchStore } from '../lib/store/use-research-store';
import { generatePaper, DEFAULT_SECTIONS, PaperSection } from '../services/paper-generator';
import { API_CONFIG } from '../services/api';
import { Paper } from '../types/paper';

type SidePanel = 'config' | 'references' | 'datasets' | 'export' | 'quality';

export default function GeneratePage() {
    // Local form state
    const [topic, setTopic] = useState('');
    const [wordLimit, setWordLimit] = useState(3000);
    const [selectedSections, setSelectedSections] = useState<string[]>(DEFAULT_SECTIONS);
    const [activePanel, setActivePanel] = useState<SidePanel>('config');
    const [isPanelCollapsed, setIsPanelCollapsed] = useState(false);
    const [selectedModel, setSelectedModel] = useState(API_CONFIG.openRouter.defaultModel);

    // Research context
    const { paperContext } = useResearchStore();

    // Store state
    const {
        currentPaper,
        isGenerating,
        generationProgress,
        generationError,
        streamingSections,
        setCurrentPaper,
        setGenerating,
        setGenerationProgress,
        setGenerationError,
        appendToSection,
        addPaper,
        reset,
    } = usePaperStore();

    // Handle paper generation
    const handleGenerate = async () => {
        if (!topic.trim()) {
            toast.error('Please enter a research topic');
            return;
        }

        if (selectedSections.length === 0) {
            toast.error('Please select at least one section');
            return;
        }

        // Reset state
        reset();
        setGenerating(true);

        try {
            const paper = await generatePaper({
                topic: topic.trim(),
                wordLimit,
                sections: selectedSections,
                model: selectedModel,
                researchContext: paperContext,
                onProgress: (progress) => {
                    setGenerationProgress(progress);
                },
                onSectionStart: (sectionName) => {
                    toast.loading(`Generating ${sectionName}...`, { id: 'section-progress' });
                },
                onSectionComplete: (section) => {
                    toast.success(`${section.title} complete`, { id: 'section-progress' });
                },
                onToken: (sectionId, token) => {
                    appendToSection(sectionId, token);
                },
                onComplete: (sections) => {
                    toast.success('Paper generated successfully!', { id: 'section-progress' });
                },
                onError: (error) => {
                    setGenerationError(error.message);
                    toast.error(error.message);
                },
            });

            // Create paper object
            const newPaper: Paper = {
                id: crypto.randomUUID(),
                topic: topic.trim(),
                sections: paper.sections,
                totalWordCount: paper.totalWordCount,
                createdAt: new Date(),
                updatedAt: new Date(),
                model: paper.model,
                status: 'complete',
            };

            addPaper(newPaper);
            setActivePanel('quality'); // Show quality panel after generation

        } catch (error) {
            console.error('Generation error:', error);
            setGenerationError(error instanceof Error ? error.message : 'Generation failed');
        } finally {
            setGenerating(false);
        }
    };

    // Get display sections (streaming or complete)
    const getDisplaySections = (): PaperSection[] => {
        if (currentPaper?.sections) {
            return currentPaper.sections;
        }

        // Build sections from streaming state
        if (Object.keys(streamingSections).length > 0) {
            return selectedSections.map(title => {
                const id = title.toLowerCase().replace(/\s+/g, '_');
                const content = streamingSections[id] || '';
                return {
                    id,
                    title,
                    content,
                    isGenerating: generationProgress?.currentSection === title,
                    isComplete: generationProgress?.completedSections.includes(title) || false,
                    wordCount: content.split(/\s+/).filter(Boolean).length,
                };
            });
        }

        return [];
    };

    const displaySections = getDisplaySections();
    const hasContent = displaySections.some(s => s.content.length > 0);

    // Handle content update from auto-fix
    const handleContentUpdate = (fixedContent: string) => {
        if (!currentPaper) return;

        // Split fixed content back into sections
        const paragraphs = fixedContent.split('\n\n');
        const updatedSections = currentPaper.sections.map((section, index) => {
            // Simple approach: update content proportionally
            const sectionParagraphs = paragraphs.splice(0, Math.ceil(paragraphs.length / (currentPaper.sections.length - index)));
            return {
                ...section,
                content: sectionParagraphs.join('\n\n') || section.content,
                wordCount: sectionParagraphs.join(' ').split(/\s+/).filter(Boolean).length,
            };
        });

        setCurrentPaper({
            ...currentPaper,
            sections: updatedSections,
            updatedAt: new Date(),
        });
    };

    return (
        <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-900">
            <DashboardNavbar />

            <main className="flex-1 pt-20">
                <div className="flex h-[calc(100vh-5rem)]">
                    {/* Side Panel */}
                    <AnimatePresence mode="wait">
                        {!isPanelCollapsed && (
                            <motion.div
                                initial={{ width: 0, opacity: 0 }}
                                animate={{ width: 400, opacity: 1 }}
                                exit={{ width: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="border-r border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex flex-col overflow-hidden"
                            >
                                {/* Panel Tabs */}
                                <div className="flex border-b border-slate-200 dark:border-slate-700">
                                    {[
                                        { id: 'config', icon: Settings2, label: 'Configure' },
                                        { id: 'references', icon: BookOpen, label: 'References' },
                                        { id: 'datasets', icon: Database, label: 'Datasets' },
                                        { id: 'quality', icon: CheckCircle, label: 'Quality' },
                                        { id: 'export', icon: Download, label: 'Export' },
                                    ].map((tab) => (
                                        <button
                                            key={tab.id}
                                            onClick={() => setActivePanel(tab.id as SidePanel)}
                                            className={`flex-1 flex flex-col items-center gap-1 py-3 px-2 text-xs font-medium transition-colors ${activePanel === tab.id
                                                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                                                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                                }`}
                                        >
                                            <tab.icon size={18} />
                                            {tab.label}
                                        </button>
                                    ))}
                                </div>

                                {/* Panel Content */}
                                <div className="flex-1 overflow-y-auto">
                                    {activePanel === 'config' && (
                                        <div className="p-6 space-y-6">
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                                    Research Topic
                                                </label>
                                                <textarea
                                                    value={topic}
                                                    onChange={(e) => setTopic(e.target.value)}
                                                    placeholder="Enter your research topic..."
                                                    disabled={isGenerating}
                                                    className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none h-24"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                                    Word Limit: <span className="text-blue-600 font-bold">{wordLimit.toLocaleString()}</span>
                                                </label>
                                                <input
                                                    type="range"
                                                    min="1000"
                                                    max="10000"
                                                    step="500"
                                                    value={wordLimit}
                                                    onChange={(e) => setWordLimit(Number(e.target.value))}
                                                    disabled={isGenerating}
                                                    className="w-full"
                                                />
                                                <div className="flex justify-between text-xs text-slate-500 mt-1">
                                                    <span>1,000</span>
                                                    <span>10,000</span>
                                                </div>
                                            </div>

                                            <SectionSelector
                                                sections={selectedSections}
                                                onChange={setSelectedSections}
                                                disabled={isGenerating}
                                            />

                                            {/* Model Selector */}
                                            <ModelSelector
                                                selectedModel={selectedModel}
                                                onModelSelect={setSelectedModel}
                                            />

                                            {/* Research Context Summary */}
                                            {(paperContext.selectedReferences.length > 0 || paperContext.selectedDatasets.length > 0) && (
                                                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                                                    <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2 flex items-center gap-2">
                                                        <CheckCircle size={14} />
                                                        Research Context
                                                    </p>
                                                    <div className="space-y-1 text-xs text-blue-700 dark:text-blue-300">
                                                        {paperContext.selectedReferences.length > 0 && (
                                                            <p>📚 {paperContext.selectedReferences.length} reference(s) selected</p>
                                                        )}
                                                        {paperContext.selectedDatasets.length > 0 && (
                                                            <p>📊 {paperContext.selectedDatasets.length} dataset(s) selected</p>
                                                        )}
                                                    </div>
                                                    <p className="text-[10px] text-blue-500 mt-2">
                                                        These will inform your Literature Review & Results
                                                    </p>
                                                </div>
                                            )}

                                            <Button
                                                onClick={handleGenerate}
                                                disabled={isGenerating || !topic.trim()}
                                                size="lg"
                                                className="w-full"
                                            >
                                                {isGenerating ? (
                                                    <>
                                                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                                        Generating...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Sparkles className="w-4 h-4 mr-2" />
                                                        Generate Paper
                                                    </>
                                                )}
                                            </Button>

                                            {generationProgress && (
                                                <div className="mt-4">
                                                    <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400 mb-1">
                                                        <span>{generationProgress.currentSection}</span>
                                                        <span>{Math.round(generationProgress.overallProgress)}%</span>
                                                    </div>
                                                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                                                        <motion.div
                                                            className="bg-blue-600 h-2 rounded-full"
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${generationProgress.overallProgress}%` }}
                                                            transition={{ duration: 0.3 }}
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {activePanel === 'references' && <ReferencesPanel />}
                                    {activePanel === 'datasets' && <DatasetPanel />}
                                    {activePanel === 'quality' && <QualityPanel sections={displaySections} onContentUpdate={handleContentUpdate} />}
                                    {activePanel === 'export' && <ExportPanel sections={displaySections} topic={topic} />}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Collapse Toggle */}
                    <button
                        onClick={() => setIsPanelCollapsed(!isPanelCollapsed)}
                        className="absolute left-0 top-1/2 transform -translate-y-1/2 z-10 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-r-lg p-1 hover:bg-slate-50 dark:hover:bg-slate-700"
                        style={{ left: isPanelCollapsed ? 0 : 400 }}
                    >
                        {isPanelCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
                    </button>

                    {/* Main Content - Paper Viewer */}
                    <div className="flex-1 overflow-y-auto bg-slate-100 dark:bg-slate-900 p-8">
                        {generationError && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-3"
                            >
                                <AlertTriangle className="text-red-600 flex-shrink-0" />
                                <div>
                                    <p className="font-medium text-red-800 dark:text-red-400">Generation Error</p>
                                    <p className="text-sm text-red-600 dark:text-red-300">{generationError}</p>
                                </div>
                                <Button variant="outline" size="sm" onClick={() => setGenerationError(null)} className="ml-auto">
                                    Dismiss
                                </Button>
                            </motion.div>
                        )}

                        {!hasContent && !isGenerating ? (
                            <div className="h-full flex flex-col items-center justify-center text-center">
                                <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mb-6">
                                    <FileText size={40} className="text-blue-600" />
                                </div>
                                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                                    Ready to Generate
                                </h2>
                                <p className="text-slate-500 dark:text-slate-400 max-w-md">
                                    Enter your research topic and configure your paper settings, then click "Generate Paper" to start.
                                </p>
                            </div>
                        ) : (
                            <StreamingPaperViewer
                                title={topic}
                                sections={displaySections}
                                isGenerating={isGenerating}
                            />
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
