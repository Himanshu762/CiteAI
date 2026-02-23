import { ReactNode } from 'react';
import { Sparkles, ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { StageProgress } from './StageProgress';
import { useWizardStore } from '../../lib/store/use-wizard-store';

interface WizardLayoutProps {
    children: ReactNode;
    showBack?: boolean;
    backPath?: string;
}

export function WizardLayout({ children, showBack = false, backPath = '/' }: WizardLayoutProps) {
    const navigate = useNavigate();
    const { currentStage, prevStage } = useWizardStore();

    const handleBack = () => {
        if (currentStage === 'research') {
            navigate('/');
        } else {
            prevStage();
            navigate(backPath);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
            {/* Fixed Header */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-b border-slate-200 dark:border-slate-800">
                <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
                    {showBack ? (
                        <button
                            onClick={handleBack}
                            className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                            <span className="text-sm font-medium">Back</span>
                        </button>
                    ) : (
                        <Link to="/" className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
                                <Sparkles className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-xl font-bold text-slate-900 dark:text-white">CiteAI</span>
                        </Link>
                    )}

                    <Link to="/" className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
                            <Sparkles className="w-5 h-5 text-white" />
                        </div>
                    </Link>
                </div>
            </header>

            {/* Stage Progress */}
            <div className="fixed top-16 left-0 right-0 z-40">
                <StageProgress />
            </div>

            {/* Main Content */}
            <main className="pt-40 pb-24 px-6">
                <div className="max-w-4xl mx-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}
