import { motion } from 'framer-motion';
import {
  Sparkles, BookOpen, Search, FileText, Shield, Bot, Database,
  Wand2, Zap, CheckCircle, ArrowRight, Cpu
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { DashboardNavbar } from '../components/navigation/Navigation';

const FeatureCard = ({
  icon: Icon,
  title,
  description,
  gradient,
  delay = 0
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  gradient: string;
  delay?: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.5, delay }}
    className="group relative bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600"
  >
    <div className={`absolute inset-0 ${gradient} opacity-0 group-hover:opacity-5 rounded-2xl transition-opacity`} />
    <div className={`mb-4 inline-flex h-14 w-14 items-center justify-center rounded-xl ${gradient} text-white shadow-lg`}>
      <Icon size={26} />
    </div>
    <h3 className="mb-2 text-xl font-bold text-slate-900 dark:text-white">{title}</h3>
    <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{description}</p>
  </motion.div>
);

const features = [
  {
    icon: Sparkles,
    title: "AI-Powered Paper Generation",
    description: "Generate comprehensive research papers with advanced AI. Choose from multiple models including Llama, Gemini, and DeepSeek.",
    gradient: "bg-gradient-to-br from-purple-600 to-blue-600",
  },
  {
    icon: BookOpen,
    title: "Smart Reference Discovery",
    description: "Search Semantic Scholar for relevant academic papers. Click 'Use in Paper' to include them in your generation context.",
    gradient: "bg-gradient-to-br from-blue-600 to-cyan-600",
  },
  {
    icon: Database,
    title: "Dataset Integration",
    description: "Find datasets from Hugging Face and Kaggle. Analyze structure and add to your paper for data-driven Results sections.",
    gradient: "bg-gradient-to-br from-emerald-600 to-teal-600",
  },
  {
    icon: Shield,
    title: "AI Plagiarism Detection",
    description: "Unlimited AI-powered originality checking with on-the-fly auto-fix. Paraphrase flagged passages instantly.",
    gradient: "bg-gradient-to-br from-amber-500 to-orange-600",
  },
  {
    icon: Bot,
    title: "AI Humanizer",
    description: "Reduce AI detection patterns with 3 levels: Light, Moderate, or Strong. Make your text sound naturally written.",
    gradient: "bg-gradient-to-br from-pink-600 to-rose-600",
  },
  {
    icon: Cpu,
    title: "Model Selector",
    description: "Choose your preferred AI model with live online/offline status. Each model has unique strengths for different paper types.",
    gradient: "bg-gradient-to-br from-indigo-600 to-violet-600",
  },
  {
    icon: FileText,
    title: "Multi-Format Export",
    description: "Export your papers to PDF, DOCX, LaTeX, or Markdown. Professional formatting with proper citations.",
    gradient: "bg-gradient-to-br from-slate-600 to-slate-800",
  },
  {
    icon: Wand2,
    title: "Research-First Workflow",
    description: "Select references and datasets first, then generate. Your research context informs the AI for better papers.",
    gradient: "bg-gradient-to-br from-cyan-600 to-blue-600",
  },
  {
    icon: Zap,
    title: "Real-Time Streaming",
    description: "Watch your paper generate in real-time with word-by-word streaming. No waiting for batch generation.",
    gradient: "bg-gradient-to-br from-yellow-500 to-amber-600",
  },
];

export default function Features() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-800">
      <DashboardNavbar />

      <main className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Hero Section */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm font-medium mb-6">
              <Sparkles size={16} />
              Powered by Free AI Models
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 dark:text-white mb-6">
              Everything You Need for{' '}
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Academic Excellence
              </span>
            </h1>
            <p className="text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto leading-relaxed">
              CiteAI combines cutting-edge AI with a research-first workflow.
              Find sources, select datasets, choose your model, and generate papers that cite real research.
            </p>
          </motion.div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-20">
            {features.map((feature, index) => (
              <FeatureCard
                key={feature.title}
                {...feature}
                delay={index * 0.1}
              />
            ))}
          </div>

          {/* Workflow Section */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-8 md:p-12 text-white mb-20"
          >
            <h2 className="text-3xl font-bold mb-8 text-center">Research-First Workflow</h2>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
              {[
                { step: 1, label: "Find References", icon: Search },
                { step: 2, label: "Add Datasets", icon: Database },
                { step: 3, label: "Choose Model", icon: Cpu },
                { step: 4, label: "Generate Paper", icon: Sparkles },
                { step: 5, label: "Check Quality", icon: Shield },
              ].map((item, i) => (
                <div key={item.step} className="flex items-center">
                  <div className="flex flex-col items-center text-center flex-1">
                    <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mb-3">
                      <item.icon size={28} />
                    </div>
                    <span className="text-sm font-medium opacity-80">Step {item.step}</span>
                    <span className="font-bold">{item.label}</span>
                  </div>
                  {i < 4 && (
                    <ArrowRight className="hidden md:block opacity-50 mx-2" size={24} />
                  )}
                </div>
              ))}
            </div>
          </motion.div>

          {/* Stats Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-20"
          >
            {[
              { value: "5+", label: "Free AI Models" },
              { value: "∞", label: "Plagiarism Checks" },
              { value: "3", label: "Humanize Levels" },
              { value: "4+", label: "Export Formats" },
            ].map((stat) => (
              <div key={stat.label} className="text-center p-6 bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700">
                <div className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                  {stat.value}
                </div>
                <div className="text-slate-600 dark:text-slate-400 font-medium">
                  {stat.label}
                </div>
              </div>
            ))}
          </motion.div>

          {/* CTA Section */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="text-center bg-slate-100 dark:bg-slate-800/50 rounded-3xl p-12"
          >
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-6" />
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
              Ready to Transform Your Research?
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-400 mb-8 max-w-2xl mx-auto">
              Start generating academic papers with AI assistance, unlimited plagiarism checking, and smart humanization.
            </p>
            <Link
              to="/generate"
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all hover:scale-105"
            >
              <Sparkles size={20} />
              Start Generating
              <ArrowRight size={20} />
            </Link>
          </motion.div>
        </div>
      </main>
    </div>
  );
}