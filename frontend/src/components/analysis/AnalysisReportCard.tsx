import { useState } from 'react';
import { Bar, Scatter } from 'react-chartjs-2';
import { BarElement, CategoryScale, Chart as ChartJS, LinearScale, PointElement, Tooltip } from 'chart.js';
import { AlertTriangle, ChevronDown, Database, ExternalLink, Trash2 } from 'lucide-react';
import { AnalysisReport, ChartSpec } from '../../services/data-analysis/report';
import { ReportTableView } from './ReportTableView';

ChartJS.register(LinearScale, CategoryScale, PointElement, BarElement, Tooltip);

const axis = (title: string) => ({
  title: { display: true, text: title, color: '#a1a1aa' },
  ticks: { color: '#71717a' },
  grid: { color: 'rgba(113, 113, 122, 0.2)' },
});

const ResultChart = ({ chart }: { chart: ChartSpec }) => {
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: { x: axis(chart.xLabel), y: axis(chart.yLabel) },
  };
  return (
    <div className="h-56">
      {chart.kind === 'scatter' ? (
        <Scatter options={options} data={{ datasets: [{ data: chart.points, backgroundColor: 'rgba(96, 165, 250, 0.6)', pointRadius: 2.5 }] }} />
      ) : (
        <Bar options={options} data={{ labels: chart.categories, datasets: [{ data: chart.values, backgroundColor: 'rgba(167, 139, 250, 0.7)' }] }} />
      )}
    </div>
  );
};

interface AnalysisReportCardProps {
  report: AnalysisReport;
  onToggleInclude: () => void;
  onRemove: () => void;
}

export const AnalysisReportCard = ({ report, onToggleInclude, onRemove }: AnalysisReportCardProps) => {
  const [showTables, setShowTables] = useState(false);

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-zinc-800 p-5">
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-2">
            <Database className="h-4 w-4 flex-shrink-0 text-yellow-400" />
            <h3 className="truncate font-semibold text-white">{report.dataset.title}</h3>
            <a href={report.dataset.url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300" aria-label="Open dataset">
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
          <p className="text-xs text-zinc-500">
            {report.dataset.id} • {report.dataset.totalRows.toLocaleString()} rows • {report.sampleSize.toLocaleString()} analyzed
            {report.statisticsScope !== 'sample' && ' • descriptives over the full dataset'}
          </p>
          {report.rationale && <p className="mt-2 text-sm text-zinc-400">{report.rationale}</p>}
        </div>
        <div className="flex items-center gap-2">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-300">
            <input type="checkbox" checked={report.includeInPaper} onChange={onToggleInclude} className="accent-blue-500" />
            Use in paper
          </label>
          <button onClick={onRemove} aria-label="Remove analysis" className="rounded-lg p-2 text-zinc-500 hover:bg-red-500/10 hover:text-red-400">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="space-y-5 p-5">
        {report.results.map((result) => (
          <div key={result.id}>
            <div className="mb-2 flex items-center gap-2">
              <span className={`rounded px-2 py-0.5 text-xs font-medium ${result.significant ? 'bg-emerald-500/15 text-emerald-300' : 'bg-zinc-700/50 text-zinc-400'}`}>
                {result.significant ? 'Significant' : 'Not significant'}
              </span>
              <h4 className="text-sm font-medium text-white">{result.title}</h4>
            </div>
            <p className="mb-3 text-sm text-zinc-300">{result.finding}</p>
            {result.chart && <ResultChart chart={result.chart} />}
          </div>
        ))}

        <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
          <div className="mb-1 flex items-center gap-2 text-xs font-medium text-amber-300">
            <AlertTriangle className="h-3.5 w-3.5" /> Limitations
          </div>
          <ul className="list-disc space-y-0.5 pl-5 text-xs text-zinc-400">
            {report.limitations.map((l) => <li key={l}>{l}</li>)}
          </ul>
        </div>

        <button onClick={() => setShowTables(v => !v)} className="flex items-center gap-1 text-sm text-blue-400 hover:text-blue-300">
          <ChevronDown className={`h-4 w-4 transition-transform ${showTables ? 'rotate-180' : ''}`} />
          {showTables ? 'Hide' : 'Show'} tables that will appear in the paper
        </button>
        {showTables && [...report.descriptives, ...report.results.map(r => r.table)].map((table, i) => (
          <ReportTableView key={i} table={table} />
        ))}
      </div>
    </div>
  );
};
