import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Loader2, ArrowLeft, ArrowRight, Check, Cpu, FileText, Zap, Brain } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useWizardStore } from '../../lib/store/use-wizard-store';
import { useResearchStore } from '../../lib/store/use-research-store';
import { usePaperStore } from '../../lib/store/use-paper-store';
import { generatePaper, PaperSection } from '../../services/paper-generator';
import { GEMINI_MODELS } from '../../services/gemini-api';
import toast from 'react-hot-toast';

const SECTION_OPTIONS = [
    { id: 'abstract', label: 'Abstract', duration: '~30s' },
    { id: 'introduction', label: 'Introduction', duration: '~45s' },
    { id: 'literature-review', label: 'Literature Review', duration: '~60s' },
    { id: 'methodology', label: 'Methodology', duration: '~45s' },
    { id: 'results', label: 'Results', duration: '~45s' },
    { id: 'discussion', label: 'Discussion', duration: '~45s' },
    { id: 'conclusion', label: 'Conclusion', duration: '~30s' },
];

const MODELS = [
    { id: GEMINI_MODELS.FLASH, name: 'Gemini 2.5 Flash', speed: 'Fast • Free', icon: Zap, description: 'Quick generation, good quality' },
    { id: GEMINI_MODELS.PRO, name: 'Gemini 2.5 Pro', speed: 'Smart • Free', icon: Brain, description: 'Best quality, detailed writing' },
    { id: GEMINI_MODELS.FLASH_LITE, name: 'Gemini Flash Lite', speed: 'Fastest • Free', icon: Cpu, description: 'Ultra-fast, basic quality' },
];


export default function ComposePage() {
    const navigate = useNavigate();
    const { topic, setStage } = useWizardStore();
    const { paperContext } = useResearchStore();
    const { addPaper, setCurrentPaper } = usePaperStore();

    const [selectedModel, setSelectedModel] = useState(MODELS[0].id);
    const [selectedSections, setSelectedSections] = useState<string[]>(SECTION_OPTIONS.map(s => s.id));
    const [wordLimit, setWordLimit] = useState(3000);
    const [isGenerating, setIsGenerating] = useState(false);
    const [progress, setProgress] = useState(0);
    const [currentSection, setCurrentSection] = useState('');
    const [generatedSections, setGeneratedSections] = useState<PaperSection[]>([]);

    // Redirect if no topic
    useEffect(() => {
        if (!topic) {
            navigate('/');
        }
    }, [topic, navigate]);

    const toggleSection = (id: string) => {
        setSelectedSections(prev =>
            prev.includes(id)
                ? prev.filter(s => s !== id)
                : [...prev, id]
        );
    };

    const handleGenerate = async () => {
        if (selectedSections.length === 0) {
            toast.error('Select at least one section');
            return;
        }

        setIsGenerating(true);
        setProgress(0);
        setGeneratedSections([]);

        try {
            const paper = await generatePaper({
                topic,
                wordLimit,
                sections: selectedSections.map(id =>
                    SECTION_OPTIONS.find(s => s.id === id)?.label || id
                ),
                model: selectedModel,
                researchContext: paperContext,
                onProgress: (p) => {
                    setProgress(p.overallProgress);
                    setCurrentSection(p.currentSection);
                },
                onSectionComplete: (section) => {
                    setGeneratedSections(prev => [...prev, section]);
                },
            });

            const totalWordCount = paper.sections.reduce((acc, s) => acc + s.wordCount, 0);
            const newPaper = {
                id: crypto.randomUUID(),
                title: topic,
                topic: topic,
                sections: paper.sections,
                totalWordCount,
                createdAt: new Date(),
                updatedAt: new Date(),
                model: selectedModel,
                status: 'complete' as const,
            };
            addPaper(newPaper);
            setCurrentPaper(newPaper);

            toast.success('Paper generated!');
            setStage('finish');
            navigate('/finish');
        } catch (error) {
            toast.error('Generation failed - check console');
            console.error(error);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleBack = () => {
        navigate('/analyze');
    };

    return (
        <div className="min-h-screen bg-[#0a0a0f] text-white">
            {/* Header */}
            <header className="border-b border-zinc-800/50 bg-zinc-900/50 backdrop-blur-xl sticky top-0 z-50">
                <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
                    <button
                        onClick={handleBack}
                        disabled={isGenerating}
                        className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors disabled:opacity-50"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back
                    </button>

                    {/* Progress indicator */}
                    <div className="flex items-center gap-2">
                        {['Start', 'Research', 'Analyze', 'Write', 'Finish'].map((step, i) => (
                            <div key={step} className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${i <= 3 ? 'bg-blue-500' : 'bg-zinc-700'}`} />
                                {i < 4 && <div className={`w-4 h-px ${i < 3 ? 'bg-blue-500' : 'bg-zinc-700'}`} />}
                            </div>
                        ))}
                    </div>

                    <div className="w-16" /> {/* Spacer */}
                </div>
            </header>

            {/* Main */}
            <main className="max-w-4xl mx-auto px-6 py-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    {isGenerating ? (
                        /* Generation Progress */
                        <div className="py-12">
                            <div className="text-center mb-12">
                                <motion.div
                                    className="relative w-24 h-24 mx-auto mb-6"
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                                >
                                    <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 flex items-center justify-center">
                                        <Sparkles className="w-10 h-10 text-white" />
                                    </div>
                                </motion.div>
                                <h2 className="text-2xl font-bold text-white mb-2">
                                    Generating Your Paper
                                </h2>
                                <p className="text-zinc-400">
                                    Currently writing: <span className="text-blue-400">{currentSection}</span>
                                </p>
                            </div>

                            {/* Progress bar */}
                            <div className="max-w-md mx-auto mb-8">
                                <div className="flex justify-between text-sm text-zinc-500 mb-2">
                                    <span>Progress</span>
                                    <span>{Math.round(progress)}%</span>
                                </div>
                                <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                                    <motion.div
                                        className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                                        initial={{ width: 0 }}
                                        animate={{ width: `${progress}%` }}
                                    />
                                </div>
                            </div>

                            {/* Completed sections */}
                            {generatedSections.length > 0 && (
                                <div className="max-w-md mx-auto space-y-2">
                                    {generatedSections.map(section => (
                                        <motion.div
                                            key={section.id}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            className="flex items-center gap-3 p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/20"
                                        >
                                            <Check className="w-4 h-4 text-emerald-400" />
                                            <span className="flex-1 text-emerald-200">{section.title}</span>
                                            <span className="text-xs text-emerald-500">{section.wordCount} words</span>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        /* Configuration */
                        <>
                            <div className="text-center mb-8">
                                <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
                                    Generate Your Paper
                                </h1>
                                <p className="text-zinc-400">
                                    Configure AI settings and sections
                                </p>
                            </div>

                            {/* Research context */}
                            <div className="p-4 bg-blue-500/10 rounded-xl border border-blue-500/20 mb-8">
                                <div className="flex items-center gap-4">
                                    <FileText className="w-5 h-5 text-blue-400" />
                                    <div className="flex-1">
                                        <div className="text-sm font-medium text-blue-300">Research Context</div>
                                        <div className="text-xs text-blue-400/70 mt-1">
                                            {paperContext.selectedReferences.length} references • {paperContext.selectedDatasets.length} datasets
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Model selection */}
                            <div className="mb-8">
                                <label className="block text-sm font-medium text-zinc-300 mb-3">AI Model (Free Gemini)</label>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    {MODELS.map(model => (
                                        <button
                                            key={model.id}
                                            onClick={() => setSelectedModel(model.id)}
                                            className={`p-4 rounded-xl border text-left transition-all ${selectedModel === model.id
                                                ? 'bg-gradient-to-br from-blue-500/20 to-purple-500/20 border-blue-500/50 ring-1 ring-blue-500/30'
                                                : 'bg-zinc-900/50 border-zinc-800 hover:border-zinc-700'
                                                }`}
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${selectedModel === model.id
                                                    ? 'bg-gradient-to-br from-blue-600 to-purple-600'
                                                    : 'bg-zinc-800'
                                                    }`}>
                                                    <model.icon className="w-5 h-5 text-white" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-medium text-white">{model.name}</div>
                                                    <div className="text-xs text-blue-400 mb-1">{model.speed}</div>
                                                    <div className="text-xs text-zinc-500">{model.description}</div>
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Sections */}
                            <div className="mb-8">
                                <label className="block text-sm font-medium text-zinc-300 mb-3">Sections</label>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                    {SECTION_OPTIONS.map(section => (
                                        <button
                                            key={section.id}
                                            onClick={() => toggleSection(section.id)}
                                            className={`p-3 rounded-xl text-sm font-medium transition-all ${selectedSections.includes(section.id)
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-zinc-900/50 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700'
                                                }`}
                                        >
                                            {section.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Word limit */}
                            <div className="mb-10">
                                <div className="flex justify-between items-center mb-3">
                                    <label className="text-sm font-medium text-zinc-300">Word Limit</label>
                                    <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                                        {wordLimit.toLocaleString()}
                                    </span>
                                </div>
                                <input
                                    type="range"
                                    min={1000}
                                    max={8000}
                                    step={500}
                                    value={wordLimit}
                                    onChange={(e) => setWordLimit(Number(e.target.value))}
                                    className="w-full h-2 bg-zinc-800 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-500"
                                />
                                <div className="flex justify-between text-xs text-zinc-500 mt-2">
                                    <span>1,000</span>
                                    <span>8,000</span>
                                </div>
                            </div>

                            {/* Generate button */}
                            <motion.button
                                onClick={handleGenerate}
                                disabled={selectedSections.length === 0}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="w-full flex items-center justify-center gap-3 py-5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white rounded-2xl font-bold text-lg shadow-2xl shadow-blue-500/25 hover:shadow-blue-500/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Sparkles className="w-6 h-6" />
                                Generate Paper
                            </motion.button>

                            <p className="text-center text-xs text-zinc-500 mt-4">
                                Estimated time: {Math.round(selectedSections.length * 0.7)} minutes
                            </p>
                        </>
                    )}
                </motion.div>
            </main>
        </div>
    );
}
