import { useState, useEffect } from 'react'
import './App.css'
import { PDFDocument } from 'pdf-lib';
import { DashboardNavbar } from './components/navigation/Navigation';
import CommonFooter from './components/Footer';
import { Button, Input } from './components/ui/components';
import { ENDPOINTS } from './config/api';

interface PaperSections {
  [key: string]: string;
}

const App = () => {
  const [topic, setTopic] = useState('');
  const [wordLimit, setWordLimit] = useState(3000);
  const [loading, setLoading] = useState(false);
  const [paperSections, setPaperSections] = useState<PaperSections>({});
  const [error, setError] = useState<string>('');
  const [plagiarismScore, setPlagiarismScore] = useState(0);
  const [readabilityScore, setReadabilityScore] = useState(0);
  const [wordCount, setWordCount] = useState(0);
  const [newCitation, setNewCitation] = useState('');
  const [citations, setCitations] = useState<Array<{ id: string; text: string }>>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) {
      setError('Please enter a topic');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      // Clean up the URL to ensure no double slashes
      const apiUrl = ENDPOINTS.GENERATE_PAPER.replace(/([^:]\/)\/+/g, "$1");
      console.log("Attempting to connect to:", apiUrl);
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          topic,
          word_limit: wordLimit,
          sections: ['Abstract', 'Introduction', 'Literature Review', 'Methodology', 'Results', 'Discussion', 'Conclusion']
        }),
        mode: 'cors',
        credentials: 'omit'  // Don't send credentials for cross-origin requests with wildcard
      });
      
      if (!response.ok) {
        console.error(`Server responded with status: ${response.status}, ${response.statusText}`);
        throw new Error(`Server responded with status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.status === 'success') {
        setPaperSections(data.sections);
        setPlagiarismScore(data.plagiarism_score || 0);
        setReadabilityScore(data.readability_score || 0);
        setWordCount(data.word_count || 0);
      } else {
        setError(data.message || 'An error occurred while generating the paper');
      }
    } catch (error) {
      console.error('Error generating paper:', error);
      setError('Server error: Could not connect to the generation service');
    } finally {
      setLoading(false);
    }
  };

  const generatePdf = async () => {
    if (Object.keys(paperSections).length === 0) return;

    try {
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage();
      const { width, height } = page.getSize();
      
      // Add content to PDF
      page.drawText('Generated Academic Paper', { 
        x: 50, 
        y: height - 50,
        size: 20
      });

      // Convert sections to PDF content
      let yPosition = height - 100;
      Object.entries(paperSections).forEach(([section, content]) => {
        // Add section title
        page.drawText(section.toUpperCase(), {
          x: 50,
          y: yPosition,
          size: 14
        });
        
        yPosition -= 30;
        
        // Add content (simplified - in a real app you'd handle pagination)
        const paragraphs = content.split('\n');
        paragraphs.forEach(paragraph => {
          if (yPosition < 50) {
            // Add new page if needed
            const newPage = pdfDoc.addPage();
            yPosition = newPage.getSize().height - 50;
          }
          
          page.drawText(paragraph.substring(0, 50) + '...', {
            x: 50,
            y: yPosition,
            size: 10,
            maxWidth: width - 100
          });
          
          yPosition -= 20;
        });
        
        yPosition -= 20;
      });
      
      // Save the PDF
      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      
      // Create download link
      const a = document.createElement('a');
      a.href = url;
      a.download = `${topic.replace(/\s+/g, '_')}_paper.pdf`;
      a.click();
      
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error generating PDF:', error);
      setError('Failed to generate PDF');
    }
  };

  const handleDocxExport = () => {
    if (Object.keys(paperSections).length === 0) return;
    
    // Create text content
    let content = '';
    Object.entries(paperSections).forEach(([section, text]) => {
      content += `${section.toUpperCase()}\n\n${text}\n\n`;
    });
    
    // Create blob and download
    const blob = new Blob([content], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${topic.replace(/\s+/g, '_')}_paper.docx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    const count = Object.values(paperSections).reduce((acc, content) => 
      acc + (content ? content.split(/\s+/).length : 0), 0);
    setWordCount(count);
  }, [paperSections]);

  const [darkMode] = useState(false);

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
                  onChange={(e) => setWordLimit(parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  disabled={loading}
                />
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                  <span>1,000</span>
                  <span>3,000</span>
                  <span>5,000</span>
                </div>
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
                        {section}
                      </h3>
                      <div className="prose dark:prose-invert prose-indigo max-w-none">
                        {content.split('\n').map((paragraph, i) => (
                          <p key={i} className="mb-4 text-gray-700 dark:text-gray-300">{paragraph}</p>
                        ))}
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
          </div>
        </div>
      </main>
      
      <CommonFooter />
    </div>
  );
};

export default App;