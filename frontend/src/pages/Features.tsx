import React from 'react';
import { DashboardLayout } from '../components/Dashboard/Layout';
import { PageHeader } from '../components/ui/components';
import { Check, BookOpen, Sparkles, Search, FileText, Clock, Shield, Users } from 'lucide-react';

// Feature card component
const FeatureCard = ({ 
  icon, 
  title, 
  description 
}: { 
  icon: React.ReactNode; 
  title: string; 
  description: string 
}) => (
  <div className="bg-neutral dark:bg-primary-800 rounded-xl p-6 shadow-sm transition-all hover:shadow-md">
    <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10 text-accent">
      {icon}
    </div>
    <h3 className="mb-2 text-xl font-bold text-primary dark:text-neutral">{title}</h3>
    <p className="text-secondary dark:text-neutral/80">{description}</p>
  </div>
);

export default function Features() {
  return (
    <DashboardLayout>
      <div className="relative pt-16">
        <PageHeader title="Features" />
        
        {/* Hero section */}
        <div className="mb-16 mt-8">
          <h2 className="text-primary dark:text-neutral text-2xl md:text-3xl font-bold mb-4">
            Empowering Academic Excellence
          </h2>
          <p className="text-secondary text-lg max-w-3xl">
            CiteAI combines cutting-edge AI technology with academic rigor to transform your research and writing experience.
            Our suite of tools is designed to enhance academic workflow while maintaining the highest standards of integrity.
          </p>
        </div>
        
        {/* Features grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          <FeatureCard
            icon={<Sparkles size={24} />}
            title="AI-Powered Paper Generation"
            description="Generate comprehensive research papers with our advanced AI algorithms trained on academic publications."
          />
          
          <FeatureCard
            icon={<BookOpen size={24} />}
            title="Extensive Citation Library"
            description="Access a vast database of academic sources with automatic formatting in various citation styles."
          />
          
          <FeatureCard
            icon={<Search size={24} />}
            title="Intelligent Source Finding"
            description="Discover relevant sources and references using our semantic search technology."
          />
          
          <FeatureCard
            icon={<FileText size={24} />}
            title="Academic Quality Control"
            description="Ensure your papers meet academic standards with our quality assessment tools."
          />
          
          <FeatureCard
            icon={<Clock size={24} />}
            title="Time-Efficient Workflows"
            description="Reduce research and writing time by up to 70% while maintaining academic rigor."
          />
          
          <FeatureCard
            icon={<Shield size={24} />}
            title="Plagiarism Prevention"
            description="Our technology ensures all generated content is original and properly cited."
          />
        </div>
        
        {/* Testimonial section */}
        <div className="bg-primary rounded-xl p-8 text-neutral mb-16">
          <h2 className="text-2xl font-bold mb-8 text-center">Trusted by Academics Worldwide</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-primary-800 p-6 rounded-lg">
              <p className="italic mb-4">"CiteAI has transformed my research process. What used to take weeks now takes days, with better results."</p>
              <p className="font-bold">Dr. Emily Chen</p>
              <p className="text-neutral/70">Professor of Computer Science</p>
            </div>
            <div className="bg-primary-800 p-6 rounded-lg">
              <p className="italic mb-4">"The quality of papers and citations has significantly improved my academic output. A game-changer for researchers."</p>
              <p className="font-bold">Dr. Michael Rodriguez</p>
              <p className="text-neutral/70">Research Fellow, Life Sciences</p>
            </div>
          </div>
        </div>
        
        {/* Feature comparison */}
        <div className="mb-16">
          <h2 className="text-primary dark:text-neutral text-2xl font-bold mb-8">How CiteAI Compares</h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-accent text-primary">
                  <th className="p-4 text-left">Features</th>
                  <th className="p-4 text-center">CiteAI</th>
                  <th className="p-4 text-center">Traditional Methods</th>
                  <th className="p-4 text-center">Other AI Tools</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-neutral-200 dark:border-primary-700">
                  <td className="p-4 font-medium">Academic Rigor</td>
                  <td className="p-4 text-center"><Check className="inline text-accent" /></td>
                  <td className="p-4 text-center"><Check className="inline text-accent" /></td>
                  <td className="p-4 text-center">Limited</td>
                </tr>
                <tr className="border-b border-neutral-200 dark:border-primary-700">
                  <td className="p-4 font-medium">Time Efficiency</td>
                  <td className="p-4 text-center"><Check className="inline text-accent" /></td>
                  <td className="p-4 text-center">Limited</td>
                  <td className="p-4 text-center"><Check className="inline text-accent" /></td>
                </tr>
                <tr className="border-b border-neutral-200 dark:border-primary-700">
                  <td className="p-4 font-medium">Citation Accuracy</td>
                  <td className="p-4 text-center"><Check className="inline text-accent" /></td>
                  <td className="p-4 text-center"><Check className="inline text-accent" /></td>
                  <td className="p-4 text-center">Limited</td>
                </tr>
                <tr className="border-b border-neutral-200 dark:border-primary-700">
                  <td className="p-4 font-medium">Intelligent Source Discovery</td>
                  <td className="p-4 text-center"><Check className="inline text-accent" /></td>
                  <td className="p-4 text-center">No</td>
                  <td className="p-4 text-center">Limited</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        
        {/* CTA section */}
        <div className="bg-accent/10 rounded-xl p-8 text-center mb-8">
          <h2 className="text-2xl font-bold text-primary dark:text-neutral mb-4">Ready to Transform Your Academic Work?</h2>
          <p className="text-secondary dark:text-neutral/80 mb-6 max-w-2xl mx-auto">
            Join thousands of researchers, students, and professors who have enhanced their academic output with CiteAI.
          </p>
          <button className="bg-accent hover:bg-accent-600 text-primary font-medium py-3 px-6 rounded-md transition-colors">
            Get Started Today
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
} 