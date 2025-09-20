import React from 'react';
import { motion } from 'framer-motion';
import { LandingHeader } from './navigation/Navigation';
import CommonFooter from './Footer';
import {
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
    <div className="flex flex-col min-h-screen w-full bg-background text-foreground overflow-x-hidden">
      <LandingHeader />
      
      {/* Hero Section */}
      <section className="w-full py-16 md:py-24 bg-royal-gradient">
        <div className="container-royal">
          <div className="max-w-4xl mx-auto text-center">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-4xl md:text-5xl lg:text-6xl font-display font-bold mb-6 text-royal-gradient"
            >
              Powerful Academic Tools
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-lg md:text-xl text-parchment-200 mb-10"
            >
              Everything you need to create high-quality academic papers with built-in quality control
            </motion.p>
          </div>
        </div>
      </section>
      
      {/* Features Detail Section */}
      <section className="w-full py-16">
        <div className="container-royal">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-display font-bold text-center mb-16 text-parchment-100">
              What Makes CiteAI Different
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <FeatureCard 
                icon={<FileText className="h-10 w-10 text-gold-500" />}
                title="Academic Paper Generation"
                description="Create well-structured, fully-referenced academic papers with our advanced AI models that understand scholarly writing."
              />
              
              <FeatureCard 
                icon={<BookMarked className="h-10 w-10 text-gold-500" />}
                title="Automatic Citations"
                description="Automatically generate and format citations in APA, MLA, Chicago, and other academic styles with perfect accuracy."
              />
              
              <FeatureCard 
                icon={<Bookmark className="h-10 w-10 text-gold-500" />}
                title="Reference Management"
                description="Easily manage, organize, and format all your references across multiple papers and projects."
              />
              
              <FeatureCard 
                icon={<Sparkles className="h-10 w-10 text-gold-500" />}
                title="Quality Assurance"
                description="Built-in checks for academic integrity, factual accuracy, and writing style to ensure your paper meets high standards."
              />
              
              <FeatureCard 
                icon={<RefreshCw className="h-10 w-10 text-gold-500" />}
                title="Revision Assistance"
                description="Get intelligent suggestions for improving your paper's structure, clarity, and arguments."
              />
              
              <FeatureCard 
                icon={<Zap className="h-10 w-10 text-gold-500" />}
                title="Rapid Drafting"
                description="Transform your research notes and ideas into well-structured drafts in minutes, not hours."
              />
            </div>
          </div>
        </div>
      </section>
      
      {/* Benefits Section */}
      <section className="w-full py-16 md:py-24">
        <div className="container-royal">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-display font-bold text-center mb-12 text-parchment-100">
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
    className="royal-card p-6 rounded-xl shadow-royal hover:shadow-gold-glow transition-all"
  >
    <div className="mb-4">{icon}</div>
    <h3 className="text-xl font-display font-semibold mb-3 text-parchment-100">{title}</h3>
    <p className="text-parchment-200">{description}</p>
  </motion.div>
);

const BenefitItem = ({ text }: { text: string }) => (
  <motion.div 
    initial={{ opacity: 0, x: -20 }}
    whileInView={{ opacity: 1, x: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.5 }}
    className="flex items-start bg-parchment p-4 rounded-lg shadow-inner"
  >
    <Check className="h-6 w-6 text-gold-500 mr-3 mt-0.5" />
    <p className="text-parchment-900">{text}</p>
  </motion.div>
);
