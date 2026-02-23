import { Link } from 'react-router-dom';
import { ArrowRight, FileText, Sparkles, BookOpen, Shield, Zap } from 'lucide-react';
import { LandingHeader } from './navigation/Navigation';

const features = [
  {
    icon: Sparkles,
    title: 'AI-Powered Writing',
    description: 'Generate comprehensive research papers with advanced AI algorithms.'
  },
  {
    icon: BookOpen,
    title: 'Smart Citations',
    description: 'Automatic citation generation in APA, MLA, Chicago, and more.'
  },
  {
    icon: Shield,
    title: 'Plagiarism Check',
    description: 'Built-in plagiarism detection ensures originality.'
  },
  {
    icon: Zap,
    title: 'Fast & Efficient',
    description: 'Generate quality papers in minutes, not hours.'
  }
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-900">
      <LandingHeader />

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4" />
            AI-Powered Research
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 dark:text-white mb-6 leading-tight">
            Generate Research Papers
            <br />
            <span className="text-blue-600">With AI Precision</span>
          </h1>

          <p className="text-lg text-slate-600 dark:text-slate-400 mb-10 max-w-2xl mx-auto">
            Create comprehensive academic papers with proper citations and formatting in minutes.
            Perfect for students, researchers, and professionals.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/sign-up">
              <button className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg flex items-center gap-2 transition-colors">
                Get Started Free
                <ArrowRight className="w-4 h-4" />
              </button>
            </Link>
            <Link to="/features">
              <button className="px-8 py-3 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium rounded-lg transition-colors">
                Learn More
              </button>
            </Link>
          </div>

          {/* Stats */}
          <div className="flex items-center justify-center gap-8 mt-16 pt-8 border-t border-slate-200 dark:border-slate-800">
            <div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">50k+</div>
              <div className="text-sm text-slate-500">Papers Generated</div>
            </div>
            <div className="h-8 w-px bg-slate-200 dark:bg-slate-700" />
            <div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">4.9/5</div>
              <div className="text-sm text-slate-500">User Rating</div>
            </div>
            <div className="h-8 w-px bg-slate-200 dark:bg-slate-700" />
            <div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">10k+</div>
              <div className="text-sm text-slate-500">Active Users</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-slate-50 dark:bg-slate-800/50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
              Everything You Need
            </h2>
            <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              Powerful features to help you create professional research papers with ease.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature) => (
              <div key={feature.title} className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mb-8">
            Join thousands of researchers using CiteAI to create better papers.
          </p>
          <Link to="/sign-up">
            <button className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg inline-flex items-center gap-2">
              Create Your First Paper
              <ArrowRight className="w-4 h-4" />
            </button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            <span className="font-semibold text-slate-900 dark:text-white">CiteAI</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-slate-600 dark:text-slate-400">
            <Link to="/privacy" className="hover:text-slate-900 dark:hover:text-white">Privacy</Link>
            <Link to="/terms" className="hover:text-slate-900 dark:hover:text-white">Terms</Link>
          </div>
          <p className="text-sm text-slate-500">© 2024 CiteAI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}