import React from 'react';
import { motion } from 'framer-motion';
import { LandingHeader } from './navigation/Navigation';
import { CommonFooter } from './Footer';
import { 
  BookOpen, 
  FileText, 
  BookMarked, 
  Bookmark, 
  Check, 
  Sparkles,
  RefreshCw,
  Zap
} from 'lucide-react';

export default function FeaturesPage() {
  return (
    <div className="flex flex-col min-h-screen w-screen bg-gray-50 dark:bg-gray-900 overflow-x-hidden">
      <LandingHeader />
      
      {/* Hero Section */}
      <section className="w-full py-16 md:py-24 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-gray-900 dark:to-indigo-950">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent"
            >
              Powerful Academic Tools
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-lg md:text-xl text-gray-700 dark:text-gray-300 mb-10"
            >
              Everything you need to create high-quality academic papers with built-in quality control
            </motion.p>
          </div>
        </div>
      </section>
      
      {/* Features Detail Section */}
      <section className="w-full py-16 bg-white dark:bg-gray-800">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-16 text-gray-800 dark:text-white">
              What Makes ScholarForge Different
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <FeatureCard 
                icon={<FileText className="h-10 w-10 text-indigo-600" />}
                title="Academic Paper Generation"
                description="Create well-structured, fully-referenced academic papers with our advanced AI models that understand scholarly writing."
              />
              
              <FeatureCard 
                icon={<BookMarked className="h-10 w-10 text-indigo-600" />}
                title="Automatic Citations"
                description="Automatically generate and format citations in APA, MLA, Chicago, and other academic styles with perfect accuracy."
              />
              
              <FeatureCard 
                icon={<Bookmark className="h-10 w-10 text-indigo-600" />}
                title="Reference Management"
                description="Easily manage, organize, and format all your references across multiple papers and projects."
              />
              
              <FeatureCard 
                icon={<Sparkles className="h-10 w-10 text-indigo-600" />}
                title="Quality Assurance"
                description="Built-in checks for academic integrity, factual accuracy, and writing style to ensure your paper meets high standards."
              />
              
              <FeatureCard 
                icon={<RefreshCw className="h-10 w-10 text-indigo-600" />}
                title="Revision Assistance"
                description="Get intelligent suggestions for improving your paper's structure, clarity, and arguments."
              />
              
              <FeatureCard 
                icon={<Zap className="h-10 w-10 text-indigo-600" />}
                title="Rapid Drafting"
                description="Transform your research notes and ideas into well-structured drafts in minutes, not hours."
              />
            </div>
          </div>
        </div>
      </section>
      
      {/* Benefits Section */}
      <section className="w-full py-16 md:py-24 bg-gradient-to-br from-gray-50 to-indigo-50 dark:from-gray-900 dark:to-indigo-950">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12 text-gray-800 dark:text-white">
              Benefits for Researchers
            </h2>
            
            <div className="space-y-6">
              <BenefitItem text="Save hours of time on formatting and citations" />
              <BenefitItem text="Ensure academic integrity with built-in quality controls" />
              <BenefitItem text="Improve the clarity and structure of your writing" />
              <BenefitItem text="Focus on your research rather than formatting" />
              <BenefitItem text="Get help overcoming writer's block and generating ideas" />
              <BenefitItem text="Create publication-ready papers faster than ever" />
            </div>
          </div>
        </div>
      </section>
      
      <CommonFooter />
    </div>
  );
}

// Helper components
const FeatureCard = ({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.5 }}
    className="bg-gray-50 dark:bg-gray-700 p-6 rounded-xl shadow-sm hover:shadow-md transition-all"
  >
    <div className="mb-4">{icon}</div>
    <h3 className="text-xl font-semibold mb-3 text-gray-800 dark:text-white">{title}</h3>
    <p className="text-gray-600 dark:text-gray-300">{description}</p>
  </motion.div>
);

const BenefitItem = ({ text }: { text: string }) => (
  <motion.div 
    initial={{ opacity: 0, x: -20 }}
    whileInView={{ opacity: 1, x: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.5 }}
    className="flex items-start bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm"
  >
    <Check className="h-6 w-6 text-green-500 mr-3 mt-0.5" />
    <p className="text-gray-700 dark:text-gray-200">{text}</p>
  </motion.div>
); 