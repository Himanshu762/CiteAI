import { motion } from 'framer-motion';
import { Wand2, LibraryBig, BarChart4, ClipboardSignature, CheckCircle, ArrowRight } from 'lucide-react';
import { SignIn, useAuth } from '@clerk/clerk-react';
import { useNavigate, Link } from 'react-router-dom';
import { LandingHeader } from "./navigation/Navigation";
import CommonFooter from "./Footer";

// ActionCard component for authenticated users
const ActionCard = ({ 
  title, 
  description, 
  icon, 
  link 
}: { 
  title: string; 
  description: string; 
  icon: React.ReactNode; 
  link: string 
}) => {
  const navigate = useNavigate();
  
  return (
    <motion.div
      whileHover={{ y: -5, boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}
      className="bg-neutral dark:bg-primary-800 rounded-xl p-6 shadow-sm cursor-pointer transition-all hover:shadow-md"
      onClick={() => navigate(link)}
    >
      <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10 text-accent">
        {icon}
      </div>
      <h3 className="mb-2 text-xl font-bold text-primary dark:text-neutral">{title}</h3>
      <p className="text-secondary dark:text-neutral/80">{description}</p>
      <div className="mt-4 text-accent font-medium">
        Get Started →
      </div>
    </motion.div>
  );
};

export default function LandingPage() {
  const { isSignedIn } = useAuth();
  const navigate = useNavigate();

  const handleStartGenerating = () => {
    if (isSignedIn) {
      navigate('/generate');
    } else {
      navigate('/sign-in');
    }
  };

  return (
    <div className="flex flex-col min-h-screen w-screen bg-gray-50 dark:bg-gray-900 overflow-x-hidden">
      <LandingHeader />
      
      {/* Hero Section */}
      <motion.section 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full py-16 md:py-28 bg-gradient-to-br from-primary to-primary-800 dark:from-primary-900 dark:to-primary-950"
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            animate={{ rotate: [0, -1, 1, 0] }}
            transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
            className="mx-auto max-w-5xl px-4 text-center"
          >
            <div className="flex items-center justify-center mb-6">
              <span className="text-6xl md:text-8xl font-bold text-neutral">Cite</span>
              <span className="text-6xl md:text-8xl font-bold text-accent">AI</span>
            </div>
            <p className="mt-6 text-xl md:text-2xl text-neutral/80 max-w-3xl mx-auto font-light">
              Next-generation academic paper generation with built-in quality control
            </p>
            
            <motion.button
              onClick={handleStartGenerating}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="mt-10 bg-accent hover:bg-accent-600 text-primary font-bold px-10 py-4 rounded-lg text-lg md:text-xl shadow-lg hover:shadow-xl transition-all flex items-center mx-auto"
            >
              {isSignedIn ? 'Start Generating' : 'Get Started Now'}
              <ArrowRight className="ml-2 h-5 w-5" />
            </motion.button>
          </motion.div>
        </div>
      </motion.section>

      {/* Features Grid */}
      <section className="w-full py-16 md:py-24 bg-neutral dark:bg-primary-800">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 text-primary dark:text-neutral">
            Powerful Features
          </h2>
          <p className="text-lg text-center mb-12 text-primary/70 dark:text-neutral/70 max-w-3xl mx-auto">
            Everything you need to create high-quality academic papers with ease
          </p>
          <div className="max-w-7xl mx-auto">
            <FeaturesGrid />
          </div>
        </div>
      </section>

      {/* Auth Section */}
      {!isSignedIn ? (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full py-16 md:py-24 bg-gradient-to-tr from-primary-800 to-primary-900 dark:from-primary-900 dark:to-primary-950"
        >
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-12">
              <div className="md:w-1/2 text-neutral">
                <h2 className="text-3xl md:text-4xl font-bold mb-6">Begin Your Academic Journey</h2>
                <p className="text-xl mb-6 text-neutral/80">
                  Join thousands of researchers who are enhancing their academic writing with AI-powered tools. 
                  Sign up today and experience the future of academic research.
                </p>
                <ul className="space-y-3 mb-8">
                  {[
                    'Generate complete papers in minutes',
                    'Access a vast library of academic resources',
                    'Ensure quality with built-in plagiarism checks',
                    'Collaborate with peers in real-time'
                  ].map((item, index) => (
                    <li key={index} className="flex items-start">
                      <CheckCircle className="h-6 w-6 text-accent mr-2 flex-shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="md:w-1/2 max-w-md w-full">
                <div className="bg-neutral dark:bg-primary-800 p-6 md:p-8 rounded-2xl shadow-xl w-full">
                  <h3 className="text-2xl font-bold mb-6 text-primary dark:text-neutral text-center">Get Started</h3>
                  <div className="space-y-4 mb-8">
                    <Link 
                      to="/sign-in" 
                      className="flex items-center justify-center w-full bg-accent hover:bg-accent-600 text-primary font-medium py-3 px-6 rounded-lg transition-colors"
                    >
                      Sign In
                    </Link>
                    <Link 
                      to="/sign-up" 
                      className="flex items-center justify-center w-full bg-primary-700 hover:bg-primary-600 text-neutral font-medium py-3 px-6 rounded-lg border border-primary-600 transition-colors"
                    >
                      Create Account
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.section>
      ) : (
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="w-full py-16 md:py-24 bg-gradient-to-tr from-primary-50 to-accent-50 dark:from-primary-900 dark:to-primary-800"
        >
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center mb-12 text-primary dark:text-neutral">
              Quick Actions
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <ActionCard 
                title="Generate Paper" 
                description="Create a new academic paper with AI assistance"
                icon={<Wand2 className="w-6 h-6 text-accent" />}
                link="/generate"
              />
              <ActionCard 
                title="Library" 
                description="Access your saved papers and drafts"
                icon={<LibraryBig className="w-6 h-6 text-accent" />}
                link="/library"
              />
              <ActionCard 
                title="Dashboard" 
                description="View your activity and statistics"
                icon={<BarChart4 className="w-6 h-6 text-accent" />}
                link="/dashboard"
              />
            </div>
          </div>
        </motion.section>
      )}
      
      <CommonFooter />
    </div>
  );
}

const FeaturesGrid = () => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 px-4">
    {[
      { 
        icon: Wand2, 
        title: 'AI-Powered Generation', 
        text: 'Smart paper drafting with real-time suggestions and academic formatting' 
      },
      { 
        icon: LibraryBig, 
        title: 'Research Library', 
        text: 'Organized document storage with version control and search capabilities' 
      },
      { 
        icon: BarChart4, 
        title: 'Quality Analytics', 
        text: 'Plagiarism checks, writing quality metrics, and improvement suggestions' 
      },
      { 
        icon: ClipboardSignature, 
        title: 'Collaboration', 
        text: 'Team editing with comment threads and real-time collaborative editing' 
      },
    ].map((feature, idx) => (
      <motion.div
        key={idx}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: idx * 0.15 }}
        whileHover={{ y: -8, boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}
        className="bg-white dark:bg-primary-700 p-6 rounded-xl border border-neutral-200 dark:border-primary-600 transition-all duration-300 shadow-md h-full"
      >
        <div className="bg-accent/10 text-accent p-3 rounded-lg inline-block mb-4">
          <feature.icon className="w-6 h-6" />
        </div>
        <h3 className="text-lg md:text-xl font-semibold mb-3 text-primary dark:text-neutral">{feature.title}</h3>
        <p className="text-primary/70 dark:text-neutral/70 text-sm md:text-base">{feature.text}</p>
      </motion.div>
    ))}
  </div>
);