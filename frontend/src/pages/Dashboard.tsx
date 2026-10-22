import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { DashboardLayout } from '../components/Dashboard/Layout';
import { FileText, Loader2, Plus, Trash2, Upload } from 'lucide-react';
import { Button } from '../components/ui/components';
import { usePaperStore } from '../lib/store/use-paper-store';
import { Paper } from '../types/paper';

const PaperRow = ({ paper, onOpen, onDelete }: { paper: Paper; onOpen: () => void; onDelete: () => void }) => (
  <div className="flex items-center p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
    <div className="p-2 bg-white dark:bg-slate-800 rounded-lg mr-4 border border-slate-200 dark:border-slate-600">
      <FileText size={20} className="text-blue-600" />
    </div>
    <button onClick={onOpen} className="flex-1 min-w-0 text-left">
      <h3 className="font-medium text-slate-900 dark:text-white truncate hover:text-blue-600">{paper.topic}</h3>
      <span className="text-xs text-slate-500">
        {paper.createdAt.toLocaleDateString()} • {paper.totalWordCount.toLocaleString()} words • {paper.sections.length} sections • {paper.model}
      </span>
    </button>
    <button
      onClick={onDelete}
      aria-label={`Delete ${paper.topic}`}
      className="ml-4 p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
    >
      <Trash2 size={16} />
    </button>
  </div>
);

export default function DashboardPage() {
  const navigate = useNavigate();
  const { papers, setCurrentPaper, deletePaper, addPaper, exportConfig } = usePaperStore();
  const fileInput = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);

  const handleImport = async (file: File) => {
    setImporting(true);
    try {
      const { importDocument } = await import('../services/import/parse-document');
      const doc = await importDocument(file);
      const paper: Paper = {
        id: crypto.randomUUID(),
        topic: doc.title,
        sections: doc.sections,
        totalWordCount: doc.sections.reduce((n, s) => n + s.wordCount, 0),
        createdAt: new Date(),
        updatedAt: new Date(),
        model: 'imported',
        status: 'complete',
        origin: 'imported',
        citationStyle: exportConfig.citationStyle,
      };
      addPaper(paper);
      setCurrentPaper(paper);
      doc.warnings.forEach(w => toast(w, { duration: 8000 }));
      toast.success(`Imported ${doc.sections.length} section${doc.sections.length === 1 ? '' : 's'}`);
      navigate('/finish');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Import failed');
    } finally {
      setImporting(false);
    }
  };

  const sortedPapers = [...papers].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  const handleNewPaper = () => navigate('/');

  const handleOpen = (paper: Paper) => {
    setCurrentPaper(paper);
    navigate('/finish');
  };

  const handleDelete = (paper: Paper) => {
    if (window.confirm(`Delete "${paper.topic}"? This cannot be undone.`)) {
      deletePaper(paper.id);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">My Papers</h1>
          <div className="flex gap-2">
            <input
              ref={fileInput}
              type="file"
              accept=".docx,.md,.markdown,.txt,.tex"
              className="hidden"
              onChange={e => {
                const file = e.target.files?.[0];
                e.target.value = '';
                if (file) handleImport(file);
              }}
            />
            <Button variant="outline" size="md" onClick={() => fileInput.current?.click()} disabled={importing}>
              {importing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
              Import draft
            </Button>
            <Button variant="primary" size="md" onClick={handleNewPaper}>
              <Plus className="w-4 h-4 mr-2" />
              New Paper
            </Button>
          </div>
        </div>

        {sortedPapers.length > 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 space-y-3">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Papers are saved in this browser only.
            </p>
            {sortedPapers.map((paper) => (
              <PaperRow
                key={paper.id}
                paper={paper}
                onOpen={() => handleOpen(paper)}
                onDelete={() => handleDelete(paper)}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mb-6">
              <FileText size={32} className="text-blue-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Create Your First Paper</h2>
            <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-md text-center">
              Pick a topic, choose sources and data, and generate a draft, or import your own .docx, .md or .tex draft to format and export it.
            </p>
            <Button variant="primary" size="lg" onClick={handleNewPaper}>
              <Plus className="w-4 h-4 mr-2" />
              Create Paper
            </Button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
