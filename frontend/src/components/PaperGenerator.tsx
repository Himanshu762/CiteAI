import { motion } from 'framer-motion';
import { Wand2, Sliders, Cloud, LayoutList, Loader2, AlertCircle } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { UserButton } from '@clerk/clerk-react';

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
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic,
          word_limit: wordLimit,
          sections: selectedSections
        }),
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

  return (
    <div className="min-h-screen bg-neutral dark:bg-primary-900 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-12">
          <motion.h1 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-4xl font-bold text-primary dark:text-neutral"
          >
            Paper Generator
          </motion.h1>
          <UserButton afterSignOutUrl="/" />
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Controls Column */}
          <motion.div 
            className="bg-white dark:bg-primary-800 rounded-2xl p-6 shadow-xl"
            initial={{ x: -50 }}
            animate={{ x: 0 }}
          >
            <div className="space-y-8">
              <div>
                <label className="flex items-center text-lg font-semibold mb-4 text-primary dark:text-neutral">
                  <Wand2 className="mr-2 h-6 w-6 text-accent" />
                  Research Topic
                </label>
                <motion.input
                  type="text"
                  value={topic}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTopic(e.target.value)}
                  className="w-full p-4 rounded-xl border-2 border-neutral-200 dark:border-primary-700 bg-neutral dark:bg-primary-700 text-primary dark:text-neutral focus:border-accent focus:ring-0"
                  placeholder="Enter your research topic..."
                  whileFocus={{ scale: 1.02 }}
                  disabled={isGenerating}
                />
              </div>

              <div>
                <label className="flex items-center text-lg font-semibold mb-4 text-primary dark:text-neutral">
                  <Sliders className="mr-2 h-6 w-6 text-accent" />
                  Word Limit
                </label>
                <div className="relative pt-8">
                  <input
                    type="range"
                    min="1000"
                    max="10000"
                    step="500"
                    value={wordLimit}
                    onChange={(e) => setWordLimit(Number(e.target.value))}
                    className="w-full h-2 bg-neutral-200 dark:bg-primary-700 rounded-lg appearance-none cursor-pointer accent-accent"
                    disabled={isGenerating}
                  />
                  <div className="absolute top-0 right-0 text-lg font-bold text-accent">
                    {wordLimit.toLocaleString()} words
                  </div>
                </div>
              </div>

              <div>
                <label className="flex items-center text-lg font-semibold mb-4 text-primary dark:text-neutral">
                  <LayoutList className="mr-2 h-6 w-6 text-accent" />
                  Paper Sections
                </label>
                <div className="grid grid-cols-2 gap-4">
                  {['Abstract', 'Introduction', 'Literature Review', 'Methodology', 
                    'Results', 'Discussion', 'Conclusion', 'References'].map((section) => (
                    <motion.div
                      key={section}
                      whileHover={{ scale: isGenerating ? 1 : 1.05 }}
                      className={`p-4 rounded-xl border-2 cursor-pointer transition-colors
                        ${selectedSections.includes(section) 
                          ? 'border-accent bg-accent/10' 
                          : 'border-neutral-200 dark:border-primary-700 hover:border-accent'}`}
                      onClick={() => {
                        if (!isGenerating) {
                          setSelectedSections(prev =>
                            prev.includes(section)
                              ? prev.filter(s => s !== section)
                              : [...prev, section]
                          );
                        }
                      }}
                    >
                      {section}
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Preview Column */}
          <motion.div 
            className="bg-white dark:bg-primary-800 rounded-2xl p-6 shadow-xl"
            initial={{ x: 50 }}
            animate={{ x: 0 }}
          >
            <div className="flex items-center text-lg font-semibold mb-6 text-primary dark:text-neutral">
              <Cloud className="mr-2 h-6 w-6 text-accent" />
              {generatedPaper ? 'Generated Paper' : 'Preview'}
            </div>
            
            {error && (
              <div className="rounded-xl bg-alert/10 border-2 border-alert p-4 mb-6">
                <div className="flex items-start">
                  <AlertCircle className="h-6 w-6 text-alert mr-2 flex-shrink-0 mt-0.5" />
                  <p className="text-alert">{error}</p>
                </div>
              </div>
            )}

            {!generatedPaper && !isGenerating && (
              <div className="h-96 rounded-xl bg-neutral dark:bg-primary-700 border-2 border-dashed border-neutral-300 dark:border-primary-600 flex items-center justify-center">
                <p className="text-primary/50 dark:text-neutral/50">Your generated paper will appear here</p>
              </div>
            )}

            {isGenerating && (
              <div className="h-96 rounded-xl bg-neutral dark:bg-primary-700 border-2 border-neutral-300 dark:border-primary-600 flex flex-col items-center justify-center">
                <Loader2 className="h-12 w-12 text-accent animate-spin mb-4" />
                <p className="text-primary dark:text-neutral font-medium">Generating your paper...</p>
                <p className="text-primary/60 dark:text-neutral/60 text-sm mt-2">This may take a few moments</p>
              </div>
            )}

            {generatedPaper && (
              <div className="h-96 rounded-xl bg-neutral dark:bg-primary-700 border-2 border-neutral-300 dark:border-primary-600 overflow-auto p-4">
                <div className="mb-4 flex justify-between items-center">
                  <h3 className="text-xl font-bold text-primary dark:text-neutral">{topic}</h3>
                  <div className="flex space-x-4">
                    <div className="text-sm bg-accent/10 px-3 py-1 rounded-full text-accent">
                      {generatedPaper.word_count} words
                    </div>
                    <div className="text-sm bg-accent/10 px-3 py-1 rounded-full text-accent">
                      Score: {generatedPaper.readability_score}/100
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  {Object.entries(generatedPaper.sections).map(([key, content]) => (
                    <div key={key} className="space-y-2">
                      <h4 className="font-medium text-primary dark:text-neutral capitalize">{key}</h4>
                      <p className="text-primary/70 dark:text-neutral/70 text-sm line-clamp-3">{content}</p>
                    </div>
                  ))}
                </div>
                
                <div className="mt-4 text-center">
                  <p className="text-sm text-accent cursor-pointer hover:underline">
                    View full paper
                  </p>
                </div>
              </div>
            )}

            <motion.button
              onClick={generatePaper}
              disabled={isGenerating}
              className={`mt-8 w-full bg-accent hover:bg-accent-600 text-primary px-8 py-4 rounded-lg text-lg font-semibold flex items-center justify-center transition-colors ${isGenerating ? 'opacity-70 cursor-not-allowed' : ''}`}
              whileHover={isGenerating ? {} : { scale: 1.02 }}
              whileTap={isGenerating ? {} : { scale: 0.98 }}
              id="generate-content-btn"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="animate-spin mr-2 h-5 w-5" />
                  Generating...
                </>
              ) : (
                'Generate Paper'
              )}
            </motion.button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}