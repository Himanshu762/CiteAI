import { motion } from 'framer-motion';
import { FileText, Loader2, Check, RefreshCw } from 'lucide-react';
import { PaperSection } from '../../services/paper-generator';
import { Button } from '../ui/components';

interface StreamingPaperViewerProps {
    title: string;
    sections: PaperSection[];
    isGenerating: boolean;
    onRegenerateSection?: (sectionId: string) => void;
}

export function StreamingPaperViewer({
    title,
    sections,
    isGenerating,
    onRegenerateSection,
}: StreamingPaperViewerProps) {
    const totalWords = sections.reduce((sum, s) => sum + s.wordCount, 0);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="max-w-4xl mx-auto"
        >
            {/* Paper Header */}
            <div className="bg-white dark:bg-slate-800 rounded-t-xl border border-slate-200 dark:border-slate-700 p-8">
                <div className="flex justify-between items-start">
                    <div>
                        <motion.h1
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-3xl font-bold text-slate-900 dark:text-white mb-2"
                        >
                            {title || 'Untitled Paper'}
                        </motion.h1>
                        <p className="text-slate-500 dark:text-slate-400">
                            {totalWords.toLocaleString()} words • {sections.length} sections
                        </p>
                    </div>

                    {isGenerating && (
                        <div className="flex items-center gap-2 text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-3 py-1 rounded-full">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span className="text-sm font-medium">Generating...</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Sections Navigation */}
            <div className="bg-slate-50 dark:bg-slate-800/50 border-x border-slate-200 dark:border-slate-700 px-8 py-4">
                <div className="flex flex-wrap gap-2">
                    {sections.map((section) => (
                        <a
                            key={section.id}
                            href={`#section-${section.id}`}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm transition-colors ${section.isComplete
                                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                    : section.isGenerating
                                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                        : section.content
                                            ? 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                                            : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500'
                                }`}
                        >
                            {section.isComplete ? (
                                <Check size={14} />
                            ) : section.isGenerating ? (
                                <Loader2 size={14} className="animate-spin" />
                            ) : (
                                <FileText size={14} />
                            )}
                            {section.title}
                        </a>
                    ))}
                </div>
            </div>

            {/* Paper Content */}
            <div className="bg-white dark:bg-slate-800 rounded-b-xl border border-t-0 border-slate-200 dark:border-slate-700">
                <div className="p-8 space-y-12">
                    {sections.map((section) => (
                        <motion.section
                            key={section.id}
                            id={`section-${section.id}`}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.3 }}
                            className="scroll-mt-24"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                                    {section.title}
                                    {section.isGenerating && (
                                        <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                                    )}
                                    {section.isComplete && (
                                        <Check className="w-5 h-5 text-green-600" />
                                    )}
                                </h2>

                                {section.isComplete && onRegenerateSection && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => onRegenerateSection(section.id)}
                                    >
                                        <RefreshCw size={14} className="mr-1" />
                                        Regenerate
                                    </Button>
                                )}
                            </div>

                            <div className="prose prose-slate dark:prose-invert max-w-none">
                                {section.content ? (
                                    <div className="whitespace-pre-wrap leading-relaxed text-slate-700 dark:text-slate-300">
                                        {section.content}
                                        {section.isGenerating && (
                                            <motion.span
                                                animate={{ opacity: [1, 0] }}
                                                transition={{ repeat: Infinity, duration: 0.8 }}
                                                className="inline-block w-2 h-5 bg-blue-600 ml-0.5 align-text-bottom"
                                            />
                                        )}
                                    </div>
                                ) : section.isGenerating ? (
                                    <div className="flex items-center gap-3 text-slate-400">
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        <span>Generating content...</span>
                                    </div>
                                ) : (
                                    <p className="text-slate-400 italic">
                                        This section will be generated when you start.
                                    </p>
                                )}
                            </div>

                            {section.wordCount > 0 && (
                                <p className="mt-4 text-xs text-slate-400">
                                    {section.wordCount.toLocaleString()} words
                                </p>
                            )}
                        </motion.section>
                    ))}
                </div>
            </div>
        </motion.div>
    );
}
