import { SignInButton } from "@clerk/clerk-react"
import { motion } from "framer-motion"
import { Logo } from "../ui/components"
import { ArrowRight, BookOpen, Sparkles } from "lucide-react"

const PaperPreviewAnimation = () => (
  <div className="h-64 parchment-bg rounded-xl shadow-royal border border-gold-500/10 overflow-hidden relative">
    <div className="absolute inset-0 bg-gradient-to-r from-gold-500/6 to-transparent"></div>
    <div className="p-6">
      <div className="w-3/4 h-6 bg-parchment-200 rounded mb-4"></div>
      <div className="w-full h-4 bg-parchment-200 rounded mb-3"></div>
      <div className="w-full h-4 bg-parchment-200 rounded mb-3"></div>
      <div className="w-2/3 h-4 bg-parchment-200 rounded mb-6"></div>
      <div className="w-full h-12 bg-parchment-200 rounded mb-6"></div>
      <div className="w-full h-4 bg-parchment-200 rounded mb-3"></div>
      <div className="w-full h-4 bg-parchment-200 rounded"></div>
    </div>
  </div>
)

const SocialProofBadges = () => (
  <div className="flex gap-4 justify-center mt-6">
    <div className="bg-parchment-50 rounded-full px-4 py-2 text-parchment-900 text-sm backdrop-blur-sm">
      50,000+ Papers Generated
    </div>
    <div className="bg-parchment-50 rounded-full px-4 py-2 text-parchment-900 text-sm backdrop-blur-sm">
      4.9/5 Researcher Rating
    </div>
  </div>
)

export const HeroSection = () => (
  <header className="min-h-screen relative bg-royal-gradient overflow-hidden">
    <nav className="flex justify-between items-center p-6 container-royal">
      <div className="flex items-center ml-3">
        <Logo className="h-8 w-8" />
      </div>
      <SignInButton>
        <button className="px-6 py-2 rounded-lg glass-royal text-parchment-100 hover:shadow-gold-glow transition-all font-medium">
          Sign In
        </button>
      </SignInButton>
    </nav>

    <motion.div 
      className="hero-content text-center pt-24 px-4 container-royal max-w-5xl mx-auto relative z-10"
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
    >
      <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-parchment-100 mb-6">
        Transform Your Academic Research
      </h1>
      <p className="text-xl text-parchment-200 mb-12 max-w-3xl mx-auto">
        Generate comprehensive research papers powered by AI while maintaining academic integrity and excellence.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
        <div className="md:text-right">
          <PaperPreviewAnimation />
        </div>
        <div className="flex flex-col justify-center items-start text-left">
          <div className="mb-6">
            <div className="flex items-center mb-3">
              <div className="bg-gold-500/10 p-2 rounded-full mr-3">
                <Sparkles size={20} className="text-gold-500" />
              </div>
              <h3 className="text-xl font-bold text-parchment-100">AI-Powered Generation</h3>
            </div>
            <p className="text-parchment-200">Advanced algorithms trained on academic papers ensure quality and accuracy.</p>
          </div>
          
          <div className="mb-6">
            <div className="flex items-center mb-3">
              <div className="bg-gold-500/10 p-2 rounded-full mr-3">
                <BookOpen size={20} className="text-gold-500" />
              </div>
              <h3 className="text-xl font-bold text-parchment-100">Perfect Citations</h3>
            </div>
            <p className="text-parchment-200">Automatic citation generation in any academic style you need.</p>
          </div>
          
          <SignInButton>
            <button 
              className="btn-royal font-display mt-4 flex items-center"
              aria-label="Get Started"
            >
              Get Started
              <ArrowRight size={18} className="ml-2" />
            </button>
          </SignInButton>
        </div>
      </div>

      <SocialProofBadges />
    </motion.div>

    {/* Decorative corners */}
    <div className="absolute inset-0 opacity-10 pointer-events-none" aria-hidden>
      {/* subtle ornamental SVGs could be layered here */}
    </div>
  </header>
)
