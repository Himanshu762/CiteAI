import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { CitationStyle, CITATION_STYLES } from '../../services/citation-formatter';
import type { TitlePageInfo } from '../../services/export/layout';

const FIELDS: { key: keyof TitlePageInfo; label: string; placeholder: string; type?: string }[] = [
  { key: 'author', label: 'Your name', placeholder: 'Alex Rivera' },
  { key: 'institution', label: 'Institution / department', placeholder: 'Department of Computer Science, State University' },
  { key: 'course', label: 'Course', placeholder: 'CS 410: Machine Learning' },
  { key: 'instructor', label: 'Instructor', placeholder: 'Dr. Priya Shah' },
  { key: 'dueDate', label: 'Due date', placeholder: '', type: 'date' },
];

interface TitlePageFormProps {
  style: CitationStyle;
  value: TitlePageInfo;
  onChange: (value: TitlePageInfo) => void;
}

export const TitlePageForm = ({ style, value, onChange }: TitlePageFormProps) => {
  const [open, setOpen] = useState(!value.author);
  // MLA's header block has no institution line
  const fields = FIELDS.filter(f => !(style === 'mla' && f.key === 'institution'));
  const where = style === 'mla' ? 'first-page header' : style === 'ieee' ? 'title block' : 'title page';

  return (
    <div className="mb-6 rounded-xl border border-zinc-800 bg-zinc-900/50">
      <button onClick={() => setOpen(o => !o)} className="flex w-full items-center justify-between px-5 py-3 text-left">
        <span className="text-sm text-zinc-300">
          <span className="font-medium text-white">{CITATION_STYLES[style].label}</span> {where}
          {value.author && !open && <span className="text-zinc-500"> • {value.author}{value.course ? `, ${value.course}` : ''}</span>}
        </span>
        <ChevronDown className={`h-4 w-4 text-zinc-500 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="grid grid-cols-1 gap-3 border-t border-zinc-800 p-5 md:grid-cols-2">
          {fields.map(f => (
            <label key={f.key} className="text-xs text-zinc-400">
              {f.label}
              <input
                type={f.type ?? 'text'}
                value={value[f.key]}
                placeholder={f.placeholder}
                onChange={e => onChange({ ...value, [f.key]: e.target.value })}
                className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:border-blue-500 focus:outline-none"
              />
            </label>
          ))}
          <p className="text-xs text-zinc-500 md:col-span-2">Saved in this browser and used for every export. Empty fields are left out.</p>
        </div>
      )}
    </div>
  );
};
