import { useMemo, useState } from 'react';
import { Check, Lock, Wand2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { cleanupSections, DashStyle, SectionCleanup } from '../../services/writing/style-cleanup';
import type { PaperSection } from '../../services/paper-generator';

interface StyleCleanupPanelProps {
  sections: PaperSection[];
  dashStyle: DashStyle;
  onDashStyleChange: (style: DashStyle) => void;
  onApply: (sections: PaperSection[]) => void;
}

export const StyleCleanupPanel = ({ sections, dashStyle, onDashStyleChange, onApply }: StyleCleanupPanelProps) => {
  const editable = sections.filter(s => s.id !== 'references');
  const [selected, setSelected] = useState<string[]>(editable.map(s => s.id));
  const [preview, setPreview] = useState<SectionCleanup[] | null>(null);

  const totalChanges = useMemo(() => preview?.reduce((n, r) => n + r.changes.length, 0) ?? 0, [preview]);

  const toggle = (id: string) => {
    setSelected(sel => (sel.includes(id) ? sel.filter(x => x !== id) : [...sel, id]));
    setPreview(null);
  };

  const run = () => setPreview(cleanupSections(sections, selected, { dashes: dashStyle }));

  const apply = () => {
    if (!preview) return;
    const after = new Map(preview.map(r => [r.sectionId, r.after]));
    onApply(sections.map(s => {
      const content = after.get(s.id);
      return content === undefined ? s : { ...s, content, wordCount: content.split(/\s+/).filter(Boolean).length };
    }));
    toast.success(`Applied ${totalChanges} edit${totalChanges === 1 ? '' : 's'}`);
    setPreview(null);
  };

  return (
    <div className="p-6">
      <h3 className="font-semibold text-white">Style cleanup</h3>
      <p className="mb-5 max-w-2xl text-sm text-zinc-400">
        Rewrites stock phrases ("delves into", "plays a pivotal role in") with plain wording and normalizes em-dashes, in the sections you choose. Changes are shown before anything is applied.
      </p>

      <div className="mb-4 flex flex-wrap gap-2">
        {editable.map(s => (
          <button
            key={s.id}
            onClick={() => toggle(s.id)}
            className={`rounded-lg border px-3 py-1.5 text-sm ${selected.includes(s.id) ? 'border-blue-500/50 bg-blue-500/20 text-white' : 'border-zinc-800 text-zinc-400 hover:border-zinc-700'}`}
          >
            {s.title}
          </button>
        ))}
      </div>

      <label className="mb-4 flex items-center gap-2 text-sm text-zinc-300">
        <input
          type="checkbox"
          checked={dashStyle === 'replace'}
          onChange={e => { onDashStyleChange(e.target.checked ? 'replace' : 'keep'); setPreview(null); }}
          className="accent-blue-500"
        />
        Replace em-dashes (paired asides become parentheses, single dashes become commas)
      </label>

      <div className="mb-6 flex items-start gap-2 rounded-lg border border-zinc-800 bg-zinc-900/60 p-3 text-xs text-zinc-400">
        <Lock className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
        Never changed: direct quotes, citations, numbers and statistics, equations, code, URLs, tables and the reference list.
      </div>

      <button
        onClick={run}
        disabled={selected.length === 0}
        className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
      >
        <Wand2 className="h-4 w-4" /> Preview changes
      </button>

      {preview && (
        <div className="mt-6">
          {preview.length === 0 ? (
            <p className="text-sm text-zinc-400">Nothing to change in the selected sections.</p>
          ) : (
            <>
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm text-zinc-300">{totalChanges} change{totalChanges === 1 ? '' : 's'} in {preview.length} section{preview.length === 1 ? '' : 's'}</span>
                <button onClick={apply} className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700">
                  <Check className="h-4 w-4" /> Apply all
                </button>
              </div>
              <div className="space-y-4">
                {preview.map(r => (
                  <div key={r.sectionId} className="rounded-xl border border-zinc-800 p-4">
                    <div className="mb-2 text-xs uppercase tracking-wide text-zinc-500">{r.title}</div>
                    <ul className="space-y-1 text-sm">
                      {r.changes.map((c, i) => (
                        <li key={i} className="text-zinc-300">
                          <span className="text-red-300 line-through decoration-red-400/60">{c.from}</span>
                          <span className="mx-2 text-zinc-600">→</span>
                          <span className="text-emerald-300">{c.to}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};
