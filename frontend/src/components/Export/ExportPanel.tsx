import { useState } from 'react';
import { motion } from 'framer-motion';
import { Download, FileText, FileCheck, Settings, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Button } from '../ui/components';
import { PaperSection } from '../../services/paper-generator';
import { exportAndDownload } from '../../services/export-service';
import { usePaperStore } from '../../lib/store/use-paper-store';

interface ExportPanelProps {
    sections: PaperSection[];
    topic: string;
}

export function ExportPanel({ sections, topic }: ExportPanelProps) {
    const [isExporting, setIsExporting] = useState(false);
    const { selectedReferences, exportConfig, setExportConfig } = usePaperStore();

    const hasContent = sections.some(s => s.content.length > 0);

    const handleExport = async (format: 'pdf' | 'docx') => {
        if (!hasContent) {
            toast.error('No content to export');
            return;
        }

        setIsExporting(true);

        try {
            await exportAndDownload(sections, {
                format,
                title: topic || 'Untitled Paper',
                includeCoverPage: exportConfig.includeCoverPage,
                includeTableOfContents: exportConfig.includeTableOfContents,
                includeReferences: exportConfig.includeReferences,
                references: selectedReferences,
                fontSize: exportConfig.fontSize,
                lineSpacing: exportConfig.lineSpacing,
            });

            toast.success(`Exported as ${format.toUpperCase()}`);
        } catch (error) {
            toast.error('Export failed');
            console.error('Export error:', error);
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="p-4 space-y-6">
            <div>
                <h3 className="text-sm font-medium text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                    <Download size={16} />
                    Export Options
                </h3>

                {/* Format Selection */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleExport('pdf')}
                        disabled={isExporting || !hasContent}
                        className={`p-4 rounded-lg border-2 transition-colors ${!hasContent
                                ? 'border-slate-200 dark:border-slate-700 opacity-50 cursor-not-allowed'
                                : 'border-red-200 dark:border-red-800 hover:border-red-400 dark:hover:border-red-600 hover:bg-red-50 dark:hover:bg-red-900/20'
                            }`}
                    >
                        <FileText className="w-8 h-8 mx-auto mb-2 text-red-600" />
                        <p className="font-medium text-slate-900 dark:text-white">PDF</p>
                        <p className="text-xs text-slate-500">Best for printing</p>
                    </motion.button>

                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleExport('docx')}
                        disabled={isExporting || !hasContent}
                        className={`p-4 rounded-lg border-2 transition-colors ${!hasContent
                                ? 'border-slate-200 dark:border-slate-700 opacity-50 cursor-not-allowed'
                                : 'border-blue-200 dark:border-blue-800 hover:border-blue-400 dark:hover:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                            }`}
                    >
                        <FileCheck className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                        <p className="font-medium text-slate-900 dark:text-white">DOCX</p>
                        <p className="text-xs text-slate-500">Best for editing</p>
                    </motion.button>
                </div>

                {isExporting && (
                    <div className="flex items-center justify-center gap-2 text-blue-600 mb-4">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="text-sm">Generating document...</span>
                    </div>
                )}
            </div>

            {/* Export Settings */}
            <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                    <Settings size={14} />
                    Document Settings
                </h4>

                <div className="space-y-3">
                    <label className="flex items-center gap-3">
                        <input
                            type="checkbox"
                            checked={exportConfig.includeCoverPage}
                            onChange={(e) => setExportConfig({ includeCoverPage: e.target.checked })}
                            className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-slate-700 dark:text-slate-300">Include cover page</span>
                    </label>

                    <label className="flex items-center gap-3">
                        <input
                            type="checkbox"
                            checked={exportConfig.includeTableOfContents}
                            onChange={(e) => setExportConfig({ includeTableOfContents: e.target.checked })}
                            className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-slate-700 dark:text-slate-300">Include table of contents</span>
                    </label>

                    <label className="flex items-center gap-3">
                        <input
                            type="checkbox"
                            checked={exportConfig.includeReferences}
                            onChange={(e) => setExportConfig({ includeReferences: e.target.checked })}
                            className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-slate-700 dark:text-slate-300">
                            Include references ({selectedReferences.length} selected)
                        </span>
                    </label>
                </div>
            </div>

            {/* Font Settings */}
            <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                    Typography
                </h4>

                <div className="space-y-3">
                    <div>
                        <label className="text-xs text-slate-500 mb-1 block">Font Size</label>
                        <div className="flex gap-2">
                            {[10, 11, 12, 14].map((size) => (
                                <button
                                    key={size}
                                    onClick={() => setExportConfig({ fontSize: size })}
                                    className={`px-3 py-1 rounded text-sm ${exportConfig.fontSize === size
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                                        }`}
                                >
                                    {size}pt
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="text-xs text-slate-500 mb-1 block">Line Spacing</label>
                        <div className="flex gap-2">
                            {[1, 1.5, 2].map((spacing) => (
                                <button
                                    key={spacing}
                                    onClick={() => setExportConfig({ lineSpacing: spacing })}
                                    className={`px-3 py-1 rounded text-sm ${exportConfig.lineSpacing === spacing
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                                        }`}
                                >
                                    {spacing}×
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Preview Stats */}
            {hasContent && (
                <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3">
                    <p className="text-xs font-medium text-slate-500 mb-2">Export Preview</p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="flex justify-between">
                            <span className="text-slate-500">Sections:</span>
                            <span className="text-slate-700 dark:text-slate-300">{sections.length}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-500">Words:</span>
                            <span className="text-slate-700 dark:text-slate-300">
                                {sections.reduce((sum, s) => sum + s.wordCount, 0).toLocaleString()}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-500">References:</span>
                            <span className="text-slate-700 dark:text-slate-300">{selectedReferences.length}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-500">Est. Pages:</span>
                            <span className="text-slate-700 dark:text-slate-300">
                                ~{Math.ceil(sections.reduce((sum, s) => sum + s.wordCount, 0) / 300)}
                            </span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
