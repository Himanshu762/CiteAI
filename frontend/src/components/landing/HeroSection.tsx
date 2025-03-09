import { SignInButton } from "@clerk/clerk-react"
import { motion } from "framer-motion"
import { Logo } from "../ui/components"
import { ArrowRight, BookOpen, Sparkles } from "lucide-react"

const PaperPreviewAnimation = () => (
  <div className="h-64 bg-primary-800/50 rounded-xl shadow-xl backdrop-blur-sm border border-accent/20 overflow-hidden relative">
    <div className="absolute inset-0 bg-gradient-to-r from-accent/10 to-transparent"></div>
    <div className="p-6">
      <div className="w-3/4 h-6 bg-white/10 rounded mb-4"></div>
      <div className="w-full h-4 bg-white/10 rounded mb-3"></div>
      <div className="w-full h-4 bg-white/10 rounded mb-3"></div>
      <div className="w-2/3 h-4 bg-white/10 rounded mb-6"></div>
      <div className="w-full h-12 bg-white/10 rounded mb-6"></div>
      <div className="w-full h-4 bg-white/10 rounded mb-3"></div>
      <div className="w-full h-4 bg-white/10 rounded"></div>
    </div>
  </div>
)

const SocialProofBadges = () => (
  <div className="flex gap-4 justify-center mt-6">
    <div className="bg-primary-800/50 rounded-full px-4 py-2 text-neutral text-sm backdrop-blur-sm">
      50,000+ Papers Generated
    </div>
    <div className="bg-primary-800/50 rounded-full px-4 py-2 text-neutral text-sm backdrop-blur-sm">
      4.9/5 Researcher Rating
    </div>
  </div>
)

export const HeroSection = () => (
  <header className="min-h-screen bg-gradient-to-br from-primary to-secondary">
    <nav className="flex justify-between p-6">
      <div className="flex items-center ml-3">
        <Logo className="h-8 w-8" />
      </div>
      <SignInButton>
        <button className="px-6 py-2 rounded-lg backdrop-blur-lg bg-accent text-primary hover:bg-accent-600 transition-all font-medium">
          Sign In
        </button>
      </SignInButton>
    </nav>

    <motion.div 
      className="hero-content text-center pt-16 px-4 container mx-auto max-w-5xl"
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
    >
      <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-neutral mb-6">
        Transform Your Academic Research
      </h1>
      <p className="text-xl text-neutral/80 mb-12 max-w-3xl mx-auto">
        Generate comprehensive research papers powered by AI while maintaining academic integrity and excellence.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
        <div className="md:text-right">
          <PaperPreviewAnimation />
        </div>
        <div className="flex flex-col justify-center items-start text-left">
          <div className="mb-6">
            <div className="flex items-center mb-3">
              <div className="bg-accent/20 p-2 rounded-full mr-3">
                <Sparkles size={20} className="text-accent" />
              </div>
              <h3 className="text-xl font-bold text-neutral">AI-Powered Generation</h3>
            </div>
            <p className="text-neutral/80">Advanced algorithms trained on academic papers ensure quality and accuracy.</p>
          </div>
          
          <div className="mb-6">
            <div className="flex items-center mb-3">
              <div className="bg-accent/20 p-2 rounded-full mr-3">
                <BookOpen size={20} className="text-accent" />
              </div>
              <h3 className="text-xl font-bold text-neutral">Perfect Citations</h3>
            </div>
            <p className="text-neutral/80">Automatic citation generation in any academic style you need.</p>
          </div>
          
          <SignInButton>
            <button 
              className="bg-accent hover:bg-accent-600 text-primary font-medium py-4 px-8 rounded-lg transition-colors flex items-center mt-4 group"
              aria-label="Get Started"
            >
              Get Started
              <ArrowRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
            </button>
          </SignInButton>
        </div>
      </div>

      <SocialProofBadges />
    </motion.div>
  </header>
) 