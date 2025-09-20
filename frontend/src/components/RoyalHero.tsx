import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Crown, 
  Scroll, 
  Feather, 
  BookOpen, 
  Sparkles, 
  ArrowRight, 
  Award,
  ChevronDown
} from 'lucide-react';
import { Link } from 'react-router-dom';

// Ornamental SVG Components
const CrestOrnament = () => (
  <svg className="w-20 h-20 text-gold-500" viewBox="0 0 100 100" fill="currentColor">
    <path d="M50 5L60 25H80L65 40L70 60L50 50L30 60L35 40L20 25H40L50 5Z" />
    <circle cx="50" cy="50" r="15" fill="none" stroke="currentColor" strokeWidth="2"/>
    <path d="M35 35L50 50L65 35M35 65L50 50L65 65" stroke="currentColor" strokeWidth="1.5"/>
  </svg>
);

const FloralDivider = () => (
  <svg className="w-64 h-8 text-gold-600/60" viewBox="0 0 256 32" fill="currentColor">
    <path d="M0 16h60l8-8 8 8h60l8-8 8 8h60l8-8 8 8h60l8-8 8 8H256" 
          stroke="currentColor" strokeWidth="1" fill="none"/>
    <circle cx="76" cy="16" r="3"/>
    <circle cx="128" cy="16" r="4"/>
    <circle cx="180" cy="16" r="3"/>
  </svg>
);

// Typewriter Effect Component
const TypewriterText = ({ texts, className = "" }: { texts: string[], className?: string }) => {
  const [currentTextIndex, setCurrentTextIndex] = useState(0);
  const [currentText, setCurrentText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => {
      const fullText = texts[currentTextIndex];
      
      if (!isDeleting) {
        setCurrentText(fullText.substring(0, currentText.length + 1));
        
        if (currentText === fullText) {
          setTimeout(() => setIsDeleting(true), 2000);
        }
      } else {
        setCurrentText(fullText.substring(0, currentText.length - 1));
        
        if (currentText === '') {
          setIsDeleting(false);
          setCurrentTextIndex((prev) => (prev + 1) % texts.length);
        }
      }
    }, isDeleting ? 50 : 100);

    return () => clearTimeout(timeout);
  }, [currentText, isDeleting, currentTextIndex, texts]);

  return (
    <span className={className}>
      {currentText}
      <span className="animate-pulse text-gold-500">|</span>
    </span>
  );
};

// Floating Animation Wrapper
const FloatingElement = ({ children, delay = 0, className = "" }: { 
  children: React.ReactNode, 
  delay?: number,
  className?: string 
}) => (
  <motion.div
    className={className}
    initial={{ opacity: 0, y: 20 }}
    animate={{ 
      opacity: 1, 
      y: [0, -10, 0],
    }}
    transition={{
      duration: 4,
      delay,
      repeat: Infinity,
      ease: "easeInOut"
    }}
  >
    {children}
  </motion.div>
);

// Particle Background Component
const ParticleBackground = () => {
  const particles = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 3 + 1,
    duration: Math.random() * 20 + 10,
    delay: Math.random() * 5,
  }));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full bg-gold-500/20"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
          }}
          animate={{
            y: [-20, -100],
            opacity: [0, 1, 0],
            scale: [0, 1, 0],
          }}
          transition={{
            duration: particle.duration,
            delay: particle.delay,
            repeat: Infinity,
            ease: "easeOut",
          }}
        />
      ))}
    </div>
  );
};

export default function RoyalHero() {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const heroVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 1.2,
        staggerChildren: 0.3,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: "easeOut",
      },
    },
  };

  const typewriterTexts = [
    "Scholarly Excellence",
    "Academic Prestige", 
    "Research Mastery",
    "Literary Brilliance"
  ];

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Layers */}
      <div className="absolute inset-0 bg-gradient-to-br from-royal-midnight via-royal-navy to-royal-purple -z-10 pointer-events-none" />

      {/* Animated Background Pattern */}
      <div 
        className="absolute inset-0 opacity-10 -z-10 pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23d4af37' fill-opacity='0.1'%3E%3Cpolygon points='50 0 60 40 100 50 60 60 50 100 40 60 0 50 40 40'/%3E%3C/g%3E%3C/svg%3E")`,
          transform: `translateY(${scrollY * 0.1}px)`,
        }}
      />
      
      {/* Particle System */}
      <ParticleBackground />
      
      {/* Radial Gradients */}
      <div className="absolute top-20 left-20 w-96 h-96 bg-gradient-radial from-gold-500/20 to-transparent rounded-full blur-3xl -z-10 pointer-events-none" />
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-gradient-radial from-royal-purple/30 to-transparent rounded-full blur-3xl -z-10 pointer-events-none" />

      {/* Main Content */}
      <motion.div
        className="relative z-10 container-royal text-center"
        variants={heroVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Crown Icon with Animation */}
        <motion.div 
          className="flex justify-center mb-8"
          variants={itemVariants}
        >
          <FloatingElement delay={0}>
            <div className="relative">
              <Crown className="w-16 h-16 text-gold-500 drop-shadow-lg" />
              <motion.div
                className="absolute inset-0 rounded-full bg-gold-500/20"
                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ duration: 3, repeat: Infinity }}
              />
            </div>
          </FloatingElement>
        </motion.div>

        {/* Ornamental Crest */}
        <motion.div 
          className="flex justify-center mb-6"
          variants={itemVariants}
        >
          <FloatingElement delay={0.2}>
            <CrestOrnament />
          </FloatingElement>
        </motion.div>

        {/* Main Heading */}
        <motion.div variants={itemVariants}>
          <h1 className="font-display text-6xl md:text-8xl lg:text-9xl font-bold mb-6">
            <span className="block text-royal-gradient text-glow">
              CiteAI
            </span>
            <span className="block text-parchment-100 leading-tight">
              <TypewriterText 
                texts={typewriterTexts}
                className="text-gold-500 animate-text-glow"
              />
            </span>
            <span className="block text-parchment-100/90 text-5xl md:text-6xl lg:text-7xl mt-2">
              Archive
            </span>
          </h1>
        </motion.div>

        {/* Floral Divider */}
        <motion.div 
          className="flex justify-center my-8"
          variants={itemVariants}
        >
          <FloatingElement delay={0.4}>
            <FloralDivider />
          </FloatingElement>
        </motion.div>

        {/* Subtitle */}
        <motion.div variants={itemVariants}>
          <p className="font-serif text-xl md:text-2xl lg:text-3xl text-parchment-200 max-w-4xl mx-auto mb-12 leading-relaxed">
            Where artificial intelligence meets scholarly tradition to craft 
            <span className="text-gold-500 font-semibold"> magnificent academic manuscripts </span>
            worthy of the greatest minds in history.
          </p>
        </motion.div>

        {/* Feature Highlights */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto mb-16"
          variants={itemVariants}
        >
          {[
            { icon: Scroll, title: "Ancient Wisdom", desc: "Classical formatting meets modern AI" },
            { icon: Feather, title: "Elegant Prose", desc: "Sophisticated language generation" },
            { icon: Award, title: "Scholarly Excellence", desc: "Research-grade citations & structure" }
          ].map((feature, index) => (
            <FloatingElement key={index} delay={0.6 + index * 0.2}>
              <div className="royal-card p-6 text-center hover-lift">
                <feature.icon className="w-12 h-12 text-gold-500 mx-auto mb-4" />
                <h3 className="font-display text-xl font-semibold text-parchment-100 mb-2">
                  {feature.title}
                </h3>
                <p className="text-parchment-300 text-sm leading-relaxed">
                  {feature.desc}
                </p>
              </div>
            </FloatingElement>
          ))}
        </motion.div>

        {/* Call to Action */}
        <motion.div variants={itemVariants}>
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <Link to="/generate" className="group">
              <button className="btn-royal text-xl px-12 py-4 font-display">
                <span className="flex items-center gap-3">
                  <Sparkles className="w-6 h-6" />
                  Begin Your Masterpiece
                  <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                </span>
              </button>
            </Link>
            
            <Link to="/features" className="group">
              <button className="btn-outline-royal text-lg px-8 py-3 font-serif">
                <span className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  Explore Features
                </span>
              </button>
            </Link>
          </div>
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div 
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
          variants={itemVariants}
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <div className="flex flex-col items-center text-parchment-300">
            <span className="text-sm font-serif mb-2">Discover More</span>
            <ChevronDown className="w-6 h-6 animate-bounce" />
          </div>
        </motion.div>
      </motion.div>

      {/* Decorative Corner Elements */}
      <div className="absolute top-8 left-8 opacity-30 -z-10 pointer-events-none">
        <svg className="w-24 h-24 text-gold-600" viewBox="0 0 100 100" fill="currentColor">
          <path d="M0 0h20v20L0 20V0zM80 0h20v20h-20V0zM0 80h20v20H0V80zM80 80h20v20H80V80z" fillOpacity="0.6"/>
          <path d="M10 0v100M0 10h100M90 0v100M0 90h100" stroke="currentColor" strokeWidth="0.5" fill="none"/>
        </svg>
      </div>
      
      <div className="absolute top-8 right-8 opacity-30 rotate-90 -z-10 pointer-events-none">
        <svg className="w-24 h-24 text-gold-600" viewBox="0 0 100 100" fill="currentColor">
          <path d="M0 0h20v20L0 20V0zM80 0h20v20h-20V0zM0 80h20v20H0V80zM80 80h20v20H80V80z" fillOpacity="0.6"/>
          <path d="M10 0v100M0 10h100M90 0v100M0 90h100" stroke="currentColor" strokeWidth="0.5" fill="none"/>
        </svg>
      </div>
      
      <div className="absolute bottom-8 left-8 opacity-30 rotate-180 -z-10 pointer-events-none">
        <svg className="w-24 h-24 text-gold-600" viewBox="0 0 100 100" fill="currentColor">
          <path d="M0 0h20v20L0 20V0zM80 0h20v20h-20V0zM0 80h20v20H0V80zM80 80h20v20H80V80z" fillOpacity="0.6"/>
          <path d="M10 0v100M0 10h100M90 0v100M0 90h100" stroke="currentColor" strokeWidth="0.5" fill="none"/>
        </svg>
      </div>
      
      <div className="absolute bottom-8 right-8 opacity-30 rotate-270 -z-10 pointer-events-none">
        <svg className="w-24 h-24 text-gold-600" viewBox="0 0 100 100" fill="currentColor">
          <path d="M0 0h20v20L0 20V0zM80 0h20v20h-20V0zM0 80h20v20H0V80zM80 80h20v20H80V80z" fillOpacity="0.6"/>
          <path d="M10 0v100M0 10h100M90 0v100M0 90h100" stroke="currentColor" strokeWidth="0.5" fill="none"/>
        </svg>
      </div>
    </section>
  );
}
