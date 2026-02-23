import { useState } from 'react';
import { Wand2, Sliders, LayoutList, Loader2, AlertCircle, FileText } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { UserMenu } from './auth/UserMenu';
import { Button, Badge, Logo } from './ui/components';
import { Link } from 'react-router-dom';

interface GeneratedPaper {
  sections: Record<string, string>;
  word_count: number;
  readability_score: number;
  plagiarism_score: number;
}

export default function PaperGenerator() {
  const [topic, setTopic] = useState('');
  const [wordLimit, setWordLimit] = useState(5000);
  const [selectedSections, setSelectedSections] = useState([
    'Abstract', 'Introduction', 'Methodology', 'Results', 'Discussion', 'Conclusion'
  ]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedPaper, setGeneratedPaper] = useState<GeneratedPaper | null>(null);

  const generatePaper = async () => {
    if (!topic) {
      toast.error('Please enter a research topic');
      return;
    }
    if (selectedSections.length === 0) {
      toast.error('Please select at least one section');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setGeneratedPaper(null);

    try {
      const response = await fetch('http://localhost:8000/generate-paper', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, word_limit: wordLimit, sections: selectedSections }),
      });

      const data = await response.json();
      if (!response.ok || data.status === 'error') {
        throw new Error(data.message || 'Failed to generate paper');
      }

      setGeneratedPaper(data);
      toast.success(`Paper generated with ${data.word_count} words!`);
    } catch (error) {
      console.error('Error:', error);
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
      toast.error('Failed to generate paper');
    } finally {
      setIsGenerating(false);
    }
  };

  const allSections = ['Abstract', 'Introduction', 'Literature Review', 'Methodology', 'Results', 'Discussion', 'Conclusion', 'References'];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Logo />
            <UserMenu afterSignOutUrl="/" />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Paper Generator</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Create research papers with AI assistance</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Configuration Panel */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
            <div className="space-y-6">
              {/* Topic */}
              <div>
                <label className="flex items-center text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  <Wand2 className="w-4 h-4 mr-2 text-blue-600" />
                  Research Topic
                </label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="Enter your research topic..."
                  disabled={isGenerating}
                  className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Word Limit */}
              <div>
                <label className="flex items-center text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  <Sliders className="w-4 h-4 mr-2 text-blue-600" />
                  Word Limit
                </label>
                <div className="relative pt-6">
                  <input
                    type="range"
                    min="1000"
                    max="10000"
                    step="500"
                    value={wordLimit}
                    onChange={(e) => setWordLimit(Number(e.target.value))}
                    disabled={isGenerating}
                    className="w-full"
                  />
                  <div className="absolute top-0 right-0 text-sm font-semibold text-blue-600">
                    {wordLimit.toLocaleString()} words
                  </div>
                </div>
              </div>

              {/* Sections */}
              <div>
                <label className="flex items-center text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                  <LayoutList className="w-4 h-4 mr-2 text-blue-600" />
                  Paper Sections
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {allSections.map((section) => (
                    <button
                      key={section}
                      onClick={() => !isGenerating && setSelectedSections(prev =>
                        prev.includes(section) ? prev.filter(s => s !== section) : [...prev, section]
                      )}
                      disabled={isGenerating}
                      className={`p-3 rounded-lg border text-left text-sm font-medium transition-colors ${selectedSections.includes(section)
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                          : 'border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500 text-slate-700 dark:text-slate-300'
                        }`}
                    >
                      {section}
                    </button>
                  ))}
                </div>
              </div>

              <Button onClick={generatePaper} disabled={isGenerating} size="lg" className="w-full">
                {isGenerating ? (
                  <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Generating...</>
                ) : (
                  'Generate Paper'
                )}
              </Button>
            </div>
          </div>

          {/* Preview Panel */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
            <div className="flex items-center mb-6">
              <FileText className="w-5 h-5 text-blue-600 mr-2" />
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                {generatedPaper ? 'Generated Paper' : 'Preview'}
              </h2>
            </div>

            {error && (
              <div className="flex items-start gap-3 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 mb-4">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
              </div>
            )}

            {!generatedPaper && !isGenerating && (
              <div className="h-80 rounded-lg bg-slate-50 dark:bg-slate-700/50 border-2 border-dashed border-slate-200 dark:border-slate-600 flex items-center justify-center">
                <p className="text-slate-400">Your generated paper will appear here</p>
              </div>
            )}

            {isGenerating && (
              <div className="h-80 rounded-lg bg-slate-50 dark:bg-slate-700/50 flex flex-col items-center justify-center">
                <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
                <p className="text-slate-600 dark:text-slate-300 font-medium">Generating your paper...</p>
                <p className="text-slate-400 text-sm mt-1">This may take a few moments</p>
              </div>
            )}

            {generatedPaper && (
              <div className="h-80 rounded-lg bg-slate-50 dark:bg-slate-700/50 overflow-auto p-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold text-slate-900 dark:text-white">{topic}</h3>
                  <div className="flex gap-2">
                    <Badge>{generatedPaper.word_count} words</Badge>
                    <Badge variant="success">Score: {generatedPaper.readability_score}/100</Badge>
                  </div>
                </div>
                <div className="space-y-4">
                  {Object.entries(generatedPaper.sections).map(([key, content]) => (
                    <div key={key}>
                      <h4 className="font-medium text-slate-800 dark:text-slate-200 capitalize mb-1">{key}</h4>
                      <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-3">{content}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}