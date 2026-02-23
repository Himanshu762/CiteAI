import { motion } from 'framer-motion';
import { BookOpen, BarChart3, FileText, CheckCircle, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { WizardStage, useWizardStore } from '../../lib/store/use-wizard-store';

interface StageInfo {
    id: WizardStage;
    label: string;
    icon: React.ElementType;
    path: string;
}

const stages: StageInfo[] = [
    { id: 'research', label: 'Research', icon: BookOpen, path: '/research' },
    { id: 'data', label: 'Analyze', icon: BarChart3, path: '/analyze' },
    { id: 'write', label: 'Write', icon: FileText, path: '/compose' },
    { id: 'finish', label: 'Finish', icon: CheckCircle, path: '/finish' },
];

const stageOrder: WizardStage[] = ['start', 'research', 'data', 'write', 'finish'];

export function StageProgress() {
    const navigate = useNavigate();
    const { currentStage, topic } = useWizardStore();

    const currentIndex = stageOrder.indexOf(currentStage);

    const getStageStatus = (stageId: WizardStage) => {
        const stageIdx = stageOrder.indexOf(stageId);
        if (stageIdx < currentIndex) return 'complete';
        if (stageIdx === currentIndex) return 'current';
        return 'upcoming';
    };

    const handleClick = (stage: StageInfo) => {
        const status = getStageStatus(stage.id);
        if (status === 'complete' || status === 'current') {
            navigate(stage.path);
        }
    };

    // Don't show on start page
    if (currentStage === 'start') return null;

    return (
        <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
            <div className="max-w-4xl mx-auto px-6 py-4">
                {/* Topic badge */}
                <div className="text-center mb-4">
                    <span className="inline-block px-4 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm font-medium rounded-full truncate max-w-md">
                        {topic}
                    </span>
                </div>

                {/* Progress steps */}
                <div className="flex items-center justify-center gap-2">
                    {stages.map((stage, i) => {
                        const status = getStageStatus(stage.id);
                        const Icon = stage.icon;

                        return (
                            <div key={stage.id} className="flex items-center">
                                <button
                                    onClick={() => handleClick(stage)}
                                    disabled={status === 'upcoming'}
                                    className={`
                                        flex items-center gap-2 px-4 py-2 rounded-lg transition-all
                                        ${status === 'current'
                                            ? 'bg-blue-600 text-white'
                                            : status === 'complete'
                                                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-200'
                                                : 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                                        }
                                    `}
                                >
                                    {status === 'complete' ? (
                                        <Check className="w-4 h-4" />
                                    ) : (
                                        <Icon className="w-4 h-4" />
                                    )}
                                    <span className="text-sm font-medium hidden sm:inline">{stage.label}</span>
                                </button>

                                {i < stages.length - 1 && (
                                    <div className={`w-8 h-0.5 mx-1 ${getStageStatus(stages[i + 1].id) !== 'upcoming'
                                            ? 'bg-green-400'
                                            : 'bg-slate-200 dark:bg-slate-700'
                                        }`} />
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
