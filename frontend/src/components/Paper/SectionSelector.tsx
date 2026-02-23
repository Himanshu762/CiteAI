import { useState } from 'react';
import { motion } from 'framer-motion';
import { LayoutList, Plus, X, GripVertical } from 'lucide-react';
import { DEFAULT_SECTIONS } from '../../services/paper-generator';

interface SectionSelectorProps {
    sections: string[];
    onChange: (sections: string[]) => void;
    disabled?: boolean;
}

const PRESET_TEMPLATES = [
    { name: 'Research Paper', sections: DEFAULT_SECTIONS },
    { name: 'Essay', sections: ['Introduction', 'Body', 'Conclusion'] },
    { name: 'Literature Review', sections: ['Abstract', 'Introduction', 'Methodology', 'Findings', 'Discussion', 'Conclusion'] },
    { name: 'Case Study', sections: ['Executive Summary', 'Background', 'Analysis', 'Recommendations', 'Conclusion'] },
];

export function SectionSelector({ sections, onChange, disabled = false }: SectionSelectorProps) {
    const [customSection, setCustomSection] = useState('');
    const [showCustomInput, setShowCustomInput] = useState(false);

    const allSections = [
        'Abstract',
        'Introduction',
        'Literature Review',
        'Methodology',
        'Results',
        'Discussion',
        'Conclusion',
        'References',
        'Appendix',
    ];

    const toggleSection = (section: string) => {
        if (disabled) return;
        if (sections.includes(section)) {
            onChange(sections.filter((s) => s !== section));
        } else {
            onChange([...sections, section]);
        }
    };

    const addCustomSection = () => {
        if (customSection.trim() && !sections.includes(customSection.trim())) {
            onChange([...sections, customSection.trim()]);
            setCustomSection('');
            setShowCustomInput(false);
        }
    };

    const applyTemplate = (templateSections: string[]) => {
        if (!disabled) {
            onChange([...templateSections]);
        }
    };

    const moveSection = (index: number, direction: 'up' | 'down') => {
        if (disabled) return;
        const newSections = [...sections];
        const newIndex = direction === 'up' ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= newSections.length) return;
        [newSections[index], newSections[newIndex]] = [newSections[newIndex], newSections[index]];
        onChange(newSections);
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <label className="flex items-center text-sm font-medium text-slate-700 dark:text-slate-300">
                    <LayoutList className="w-4 h-4 mr-2 text-blue-600" />
                    Paper Sections
                </label>
                <span className="text-xs text-slate-500">{sections.length} selected</span>
            </div>

            {/* Templates */}
            <div className="flex flex-wrap gap-2">
                {PRESET_TEMPLATES.map((template) => (
                    <button
                        key={template.name}
                        onClick={() => applyTemplate(template.sections)}
                        disabled={disabled}
                        className="text-xs px-2 py-1 rounded border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors disabled:opacity-50"
                    >
                        {template.name}
                    </button>
                ))}
            </div>

            {/* Section Selection */}
            <div className="grid grid-cols-2 gap-2">
                {allSections.map((section) => (
                    <button
                        key={section}
                        onClick={() => toggleSection(section)}
                        disabled={disabled}
                        className={`p-2 rounded-lg border text-left text-sm font-medium transition-colors ${sections.includes(section)
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                                : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-600 dark:text-slate-400'
                            } disabled:opacity-50`}
                    >
                        {section}
                    </button>
                ))}
            </div>

            {/* Custom Section */}
            {showCustomInput ? (
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={customSection}
                        onChange={(e) => setCustomSection(e.target.value)}
                        placeholder="Custom section name..."
                        className="flex-1 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        onKeyDown={(e) => e.key === 'Enter' && addCustomSection()}
                        disabled={disabled}
                    />
                    <button
                        onClick={addCustomSection}
                        className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
                        disabled={disabled}
                    >
                        Add
                    </button>
                    <button
                        onClick={() => setShowCustomInput(false)}
                        className="px-3 py-2 text-slate-500 hover:text-slate-700"
                    >
                        <X size={18} />
                    </button>
                </div>
            ) : (
                <button
                    onClick={() => setShowCustomInput(true)}
                    disabled={disabled}
                    className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 disabled:opacity-50"
                >
                    <Plus size={16} />
                    Add custom section
                </button>
            )}

            {/* Selected Order */}
            {sections.length > 0 && (
                <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <p className="text-xs font-medium text-slate-500 mb-2">Section Order (drag to reorder)</p>
                    <div className="space-y-1">
                        {sections.map((section, index) => (
                            <motion.div
                                key={section}
                                layout
                                className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 px-2 py-1.5 rounded border border-slate-200 dark:border-slate-600"
                            >
                                <GripVertical size={14} className="text-slate-400 cursor-grab" />
                                <span className="flex-1">{section}</span>
                                <div className="flex gap-1">
                                    <button
                                        onClick={() => moveSection(index, 'up')}
                                        disabled={index === 0 || disabled}
                                        className="text-slate-400 hover:text-slate-600 disabled:opacity-30"
                                    >
                                        ↑
                                    </button>
                                    <button
                                        onClick={() => moveSection(index, 'down')}
                                        disabled={index === sections.length - 1 || disabled}
                                        className="text-slate-400 hover:text-slate-600 disabled:opacity-30"
                                    >
                                        ↓
                                    </button>
                                </div>
                                <button
                                    onClick={() => toggleSection(section)}
                                    disabled={disabled}
                                    className="text-slate-400 hover:text-red-500"
                                >
                                    <X size={14} />
                                </button>
                            </motion.div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
