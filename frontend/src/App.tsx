import { useState, useEffect } from 'react';
import './App.css';
import { PDFDocument } from 'pdf-lib';
import { DashboardNavbar } from './components/navigation/Navigation';
import CommonFooter from './components/Footer';
import { Button, Input } from './components/ui/components';
import React from 'react';
import { generatePaper } from './services/openrouter';
import { PaperSections } from './types/paper';
import { Typewriter } from './components/Typewriter';

const App = () => {
  const [topic, setTopic] = useState('');
  const [wordLimit, setWordLimit] = useState(3000);
  const [loading, setLoading] = useState(false);
  const [paperSections, setPaperSections] = useState<PaperSections>({});
  const [error, setError] = useState<string>('');
  const [plagiarismScore, setPlagiarismScore] = useState(0);
  const [readabilityScore, setReadabilityScore] = useState(0);
  const [wordCount, setWordCount] = useState(0);
  const [lightweightMode, setLightweightMode] = useState(false);
  const [debugMode, setDebugMode] = useState(false);
  const [apiResponse, setApiResponse] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!topic.trim()) {
      setError('Please enter a topic');
      return;
    }
    
    setLoading(true);
    setError('');
    setPaperSections({});
    setApiResponse('');

    const result = await generatePaper({
      topic,
      wordLimit: lightweightMode ? Math.min(wordLimit, 2000) : wordLimit,
      sections: lightweightMode 
        ? ['Abstract', 'Introduction', 'Methodology', 'Results', 'Conclusion']
        : ['Abstract', 'Introduction', 'Literature Review', 'Methodology', 'Results', 'Discussion', 'Conclusion']
    });

    if (result.status === 'success') {
      setPaperSections(result.sections);
      setPlagiarismScore(result.plagiarism_score || 0);
      setReadabilityScore(result.readability_score || 0);
      setWordCount(result.word_count || 0);
      if (debugMode) {
        setApiResponse('Successfully generated paper. Raw response from AI is not shown in the new implementation.');
      }
    } else {
      const errorMsg = result.message || 'An error occurred while generating the paper';
      setError('Error: ' + errorMsg);
      if (debugMode) {
        setApiResponse(`Error: ${errorMsg}\n\n${JSON.stringify(result, null, 2)}`);
      }
    }

    setLoading(false);
  };

  const generatePdf = async () => {
    if (Object.keys(paperSections).length === 0) return;

    try {
      const pdfDoc = await PDFDocument.create();
      let page = pdfDoc.addPage();
      const { width, height } = page.getSize();
      let yPosition = height - 50;

      // Helper function for drawing text and handling page breaks
      const drawTextWithPagination = (text: string, size: number, x: number) => {
          if (yPosition < 50) { // Check if new page is needed
              page = pdfDoc.addPage();
              yPosition = height - 50;
          }
          // Note: pdf-lib doesn't have built-in text wrapping, this is a simplified approach
          page.drawText(text.substring(0, 120), { x, y: yPosition, size, maxWidth: width - 100 });
          yPosition -= (size * 1.5); // Move yPosition down
      };

      drawTextWithPagination('Generated Academic Paper', 20, 50);
      yPosition -= 20;

      for (const [section, content] of Object.entries(paperSections)) {
        drawTextWithPagination(section.toUpperCase().replace('_', ' '), 14, 50);
        yPosition -= 10;
        
        const paragraphs = (content as string).split('\n');
        paragraphs.forEach(paragraph => {
          drawTextWithPagination(paragraph, 10, 50);
        });
        yPosition -= 10;
      }
      
      const pdfBytes = await pdfDoc.save();
      
      // Create a Blob from the Uint8Array
      const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${topic.replace(/\s+/g, '_')}_paper.pdf`;
      document.body.appendChild(a); // Append the link to the body
      a.click(); // Programmatically click the link to trigger the download
      
      // Clean up by removing the link and revoking the URL
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

    } catch (err) {
      console.error('Error generating PDF:', err);
      setError('Failed to generate PDF. See console for details.');
    }
  };

  const handleDocxExport = () => {
    if (Object.keys(paperSections).length === 0) return;
    
    let content = '';
    Object.entries(paperSections).forEach(([section, text]) => {
      content += `${section.toUpperCase()}\n\n${text}\n\n`;
    });
    
    const blob = new Blob([content], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${topic.replace(/\s+/g, '_')}_paper.docx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    const count = Object.values(paperSections).reduce((acc: number, content) => 
      acc + (content ? (content as string).split(/\s+/).length : 0), 0);
    setWordCount(count);
  }, [paperSections]);


  return (
    <div className="flex flex-col min-h-screen w-screen bg-gray-50 dark:bg-gray-900 overflow-x-hidden">
      <DashboardNavbar />
      
      <main className="flex-1 w-full py-8 md:py-16 mt-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 md:p-10 w-full mx-auto">
            <h1 className="text-3xl md:text-4xl font-bold mb-8 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Academic Paper Generator
            </h1>
            
            {error && (
              <div className="mb-8 p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg border border-red-200 dark:border-red-800">
                {error}
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-8 mb-10">
              <Input
                id="topic"
                label="Research Topic"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Enter your research topic"
                disabled={loading}
              />
              
              <div>
                <label htmlFor="wordLimit" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Word Limit: <span className="text-indigo-600 dark:text-indigo-400 font-semibold">{wordLimit}</span>
                </label>
                <input
                  id="wordLimit"
                  type="range"
                  min="1000"
                  max="5000"
                  step="100"
                  value={wordLimit}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setWordLimit(parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  disabled={loading}
                />
              </div>
              
              <div className="flex items-center mt-4">
                <input
                  type="checkbox"
                  id="lightweightMode"
                  checked={lightweightMode}
                  onChange={(e) => setLightweightMode(e.target.checked)}
                  className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                  disabled={loading}
                />
                <label htmlFor="lightweightMode" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Lightweight Mode
                </label>
              </div>

              <div className="flex items-center mt-2">
                <input
                  type="checkbox"
                  id="debugMode"
                  checked={debugMode}
                  onChange={(e) => setDebugMode(e.target.checked)}
                  className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                  disabled={loading}
                />
                <label htmlFor="debugMode" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Debug Mode
                </label>
              </div>
              
              <Button
                type="submit"
                disabled={loading}
                className="w-full py-3"
                variant="primary"
                size="lg"
              >
                {loading ? 'Generating Paper...' : 'Generate Paper'}
              </Button>
            </form>
            
            {Object.keys(paperSections).length > 0 && (
              <div className="space-y-8">
                 <div className="flex flex-wrap gap-4 mb-8">
                   <div className="bg-indigo-50 dark:bg-indigo-900/30 p-4 rounded-lg flex flex-col items-center">
                     <span className="text-sm text-indigo-700 dark:text-indigo-300 mb-1">Word Count</span>
                     <span className="text-2xl font-bold text-indigo-800 dark:text-indigo-200">{wordCount}</span>
                   </div>
                   {plagiarismScore > 0 && (
                     <div className="bg-green-50 dark:bg-green-900/30 p-4 rounded-lg flex flex-col items-center">
                       <span className="text-sm text-green-700 dark:text-green-300 mb-1">Originality</span>
                       <span className="text-2xl font-bold text-green-800 dark:text-green-200">{100 - plagiarismScore}%</span>
                     </div>
                   )}
                   {readabilityScore > 0 && (
                     <div className="bg-purple-50 dark:bg-purple-900/30 p-4 rounded-lg flex flex-col items-center">
                       <span className="text-sm text-purple-700 dark:text-purple-300 mb-1">Readability</span>
                       <span className="text-2xl font-bold text-purple-800 dark:text-purple-200">{readabilityScore}/100</span>
                     </div>
                   )}
                 </div>
                
                <div className="border-t border-gray-200 dark:border-gray-700 pt-8">
                  <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">Generated Paper</h2>
                  
                  {Object.entries(paperSections).map(([section, content]) => (
                      <div key={section} className="mb-8">
                          <h3 className="text-xl font-semibold mb-3 text-gray-800 dark:text-white capitalize">
                          {section.replace('-', ' ')}
                          </h3>
                          <div className="prose dark:prose-invert prose-indigo max-w-none text-left">
                              <Typewriter text={content as string} speed={5} />
                          </div>
                      </div>
                  ))}
                </div>
                
                <div className="flex flex-wrap gap-4 mt-8">
                  <Button
                    onClick={generatePdf}
                    variant="outline"
                    size="md"
                  >
                    Export as PDF
                  </Button>
                  <Button
                    onClick={handleDocxExport}
                    variant="outline"
                    size="md"
                  >
                    Export as DOCX
                  </Button>
                </div>
              </div>
            )}

            {debugMode && apiResponse && (
              <div className="mt-8 border-t border-gray-200 dark:border-gray-700 pt-8">
                <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">Debug Information</h2>
                <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md">
                  <pre className="whitespace-pre-wrap text-xs text-gray-700 dark:text-gray-300 overflow-auto max-h-96">
                    {apiResponse}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
      
      <CommonFooter />
    </div>
  );
};

export default App;