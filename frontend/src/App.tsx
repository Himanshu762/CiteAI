import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileDown, FileText, Loader, Settings2, Sparkles, AlertTriangle } from 'lucide-react';
import { DashboardNavbar } from './components/navigation/Navigation';
import { Typewriter } from './components/Typewriter';
import { PaperSections } from './types/paper';

// use shared UI components
import { Button, Input } from './components/ui/components';

// --- Bespoke Components for "The Scholar's Desk" Theme ---

export default function App() {
  const [topic, setTopic] = useState('');
  const [wordLimit, setWordLimit] = useState(3000);
  const [loading, setLoading] = useState(false);
  const [paperSections, setPaperSections] = useState<PaperSections | null>(null);
  const [error, setError] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => { /* Logic unchanged */ };
  const generatePdf = async () => { /* Logic unchanged */ };

  return (
    <div className="flex flex-col min-h-screen w-full bg-background">
      <DashboardNavbar />
      <main className="flex-1 container mx-auto px-4 lg:px-8 pt-28">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="lg:col-span-4 lg:sticky top-28"
          >
            <div className="royal-card border-2 border-border rounded-lg p-6 shadow-2xl animate-royal-entrance">
              <h2 className="text-3xl font-bold font-serif mb-6 flex items-center text-primary border-b-2 border-border pb-4">
                <Settings2 className="mr-3 text-gold-500" />
                Configuration
              </h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <Input
                    type="textarea"
                    value={topic}
                    onChange={(e) => setTopic((e.target as HTMLTextAreaElement).value)}
                    placeholder="e.g., The Luminary Philosophers of the Renaissance"
                    disabled={loading}
                    label="Research Topic"
                    className="font-serif"
                  />
                </div>
                <div>
                  <label className="block text-lg font-serif font-semibold mb-2 text-secondary">Word Limit: <span className="font-bold text-gold-500">{wordLimit.toLocaleString()}</span></label>
                  <input
                    type="range"
                    min="1000" max="5000" step="250"
                    value={wordLimit} onChange={(e) => setWordLimit(Number(e.target.value))}
                    disabled={loading}
                    className="w-full mt-2"
                  />
                </div>
                <div className="pt-4">
                  <Button disabled={loading} size="lg" className="w-full font-display">
                    {loading ? (
                      <> <Loader className="animate-spin mr-3" /> Transcribing... </>
                    ) : (
                      <> <Sparkles className="mr-3" /> Generate Manuscript </>
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </motion.div>

          <div className="lg:col-span-8">
            <AnimatePresence>
              {error && (
                <motion.div 
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="bg-red-900/40 border border-red-500/60 rounded-lg p-4 mb-8 flex items-center text-red-300 font-semibold"
                >
                  <AlertTriangle className="mr-3 flex-shrink-0" /> {error}
                </motion.div>
              )}
            </AnimatePresence>

            <motion.div 
              initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
              className="parchment-bg text-foreground rounded-lg p-8 min-h-[80vh] shadow-royal border-2 border-gold-500/20"
            >
              {!paperSections && !loading && (
                <div className="text-center text-foreground/50 flex flex-col items-center justify-center h-full">
                  <FileText size={64} className="mb-4" />
                  <h3 className="text-3xl font-semibold font-serif text-foreground/80">The Scroll is Blank</h3>
                  <p className="text-foreground/60 mt-2">Your manuscript will be inscribed here.</p>
                </div>
              )}

              {loading && (
                <div className="text-center text-foreground/50 flex flex-col items-center justify-center h-full">
                  <Loader size={64} className="mb-4 animate-spin text-gold-500" />
                  <h3 className="text-3xl font-semibold font-serif text-foreground/80">The Quill is in Motion...</h3>
                </div>
              )}
              
              {paperSections && (
                <article className="animate-royal-entrance">
                  <header className="flex flex-col sm:flex-row justify-between sm:items-center mb-8 border-b-2 border-foreground/10 pb-6">
                    <h1 className="text-5xl font-bold font-serif text-foreground mb-4 sm:mb-0">
                      {topic}
                    </h1>
                    <button onClick={generatePdf} className="flex items-center text-sm font-semibold text-gold-500 hover:text-gold-400 transition-colors self-start sm:self-center">
                      <FileDown className="mr-2" size={16} /> EXPORT
                    </button>
                  </header>
                  <section className="space-y-12">
                    {Object.entries(paperSections).map(([section, content]) => (
                      <div key={section}>
                        <h2 className="text-3xl font-bold font-serif mb-4 text-gold-500 capitalize">{section.replace(/_/g, ' ')}</h2>
                        <div className="text-foreground/80 leading-loose text-lg font-serif">
                           <Typewriter text={content as string} speed={1} />
                        </div>
                      </div>
                    ))}
                  </section>
                </article>
              )}
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
}