import { useCallback, useEffect, useRef, useState } from 'react';
import { BarChart3, Check, Loader2, RefreshCw, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { useResearchStore } from '../../lib/store/use-research-store';
import { AnalysisStep, autoAnalyze } from '../../services/data-analysis/auto-analyze';

const STEPS: { id: AnalysisStep; label: string }[] = [
  { id: 'assess', label: 'Deciding whether the topic needs data' },
  { id: 'search', label: 'Searching public datasets' },
  { id: 'inspect', label: 'Checking which datasets are readable' },
  { id: 'plan', label: 'Choosing a dataset and planning tests' },
  { id: 'fetch', label: 'Loading the data' },
  { id: 'analyze', label: 'Computing statistics' },
];

export const AutoAnalysisPanel = ({ topic, researchQuestions, discipline }: { topic: string; researchQuestions: string[]; discipline?: string }) => {
  const { lastAutoAnalysis, setLastAutoAnalysis, addAnalysisReport, paperContext } = useResearchStore();
  const [running, setRunning] = useState(false);
  const [step, setStep] = useState<AnalysisStep | null>(null);
  const [detail, setDetail] = useState('');
  const started = useRef(false);

  const run = useCallback(async (force: boolean) => {
    setRunning(true);
    setStep(null);
    try {
      const outcome = await autoAnalyze(topic, {
        researchQuestions,
        discipline,
        force,
        onStep: (s, d) => { setStep(s); setDetail(d ?? ''); },
      });
      if (outcome.status === 'done') {
        addAnalysisReport(outcome.report);
        setLastAutoAnalysis({ topic, status: 'done', message: `Analyzed ${outcome.report.dataset.id}` });
        toast.success('Data analysis complete');
      } else {
        setLastAutoAnalysis({ topic, status: outcome.status, message: outcome.reason });
      }
    } catch (error) {
      setLastAutoAnalysis({ topic, status: 'error', message: error instanceof Error ? error.message : 'Analysis failed' });
    } finally {
      setRunning(false);
    }
  }, [topic, researchQuestions, discipline, addAnalysisReport, setLastAutoAnalysis]);

  // Run once per topic; later visits show the saved outcome instead of spending quota again
  useEffect(() => {
    if (started.current || !topic) return;
    started.current = true;
    if (lastAutoAnalysis?.topic !== topic) run(false);
  }, [topic, lastAutoAnalysis, run]);

  const hasReports = paperContext.analysisReports.length > 0;
  const stepIndex = step ? STEPS.findIndex(s => s.id === step) : -1;
  const outcome = lastAutoAnalysis?.topic === topic ? lastAutoAnalysis : null;

  return (
    <div className="mb-6 rounded-xl border border-blue-500/20 bg-gradient-to-br from-blue-500/10 to-purple-500/10 p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-purple-600">
            <BarChart3 className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="font-semibold text-white">Automatic data analysis</h2>
            <p className="text-sm text-zinc-400">
              Finds a public dataset for your topic and runs real statistical tests. Numbers come from the data, not the AI.
            </p>
          </div>
        </div>
        {!running && (
          <button
            onClick={() => run(outcome?.status === 'not-needed')}
            className="flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-sm text-white hover:bg-white/20"
          >
            {outcome ? <RefreshCw className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
            {outcome?.status === 'not-needed' ? 'Analyze anyway' : outcome ? 'Find another dataset' : 'Find & analyze data'}
          </button>
        )}
      </div>

      {running && (
        <ol className="mt-4 space-y-1.5">
          {STEPS.map((s, i) => (
            <li key={s.id} className={`flex items-center gap-2 text-sm ${i <= stepIndex ? 'text-zinc-200' : 'text-zinc-600'}`}>
              {i < stepIndex ? <Check className="h-4 w-4 text-emerald-400" />
                : i === stepIndex ? <Loader2 className="h-4 w-4 animate-spin text-blue-400" />
                  : <span className="h-4 w-4" />}
              {s.label}
              {i === stepIndex && detail && <span className="truncate text-xs text-zinc-500">({detail})</span>}
            </li>
          ))}
        </ol>
      )}

      {!running && outcome && outcome.status !== 'done' && (
        <p className={`mt-4 text-sm ${outcome.status === 'error' ? 'text-red-300' : 'text-zinc-300'}`}>
          {outcome.status === 'not-needed' && 'Data analysis not needed: '}
          {outcome.status === 'no-dataset' && 'No suitable dataset found: '}
          {outcome.message}
          {outcome.status === 'no-dataset' && ' You can still search and pick a dataset below.'}
        </p>
      )}

      {!running && outcome?.status === 'done' && !hasReports && (
        <p className="mt-4 text-sm text-zinc-400">The analysis was removed. Run it again or pick a dataset below.</p>
      )}
    </div>
  );
};
