import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth, UserButton } from '@clerk/clerk-react';
import {
  Crown,
  Menu,
  X,
  Settings,
  Scroll,
  BookOpen,
  Star,
  Sparkles,
} from 'lucide-react';

import crest from '../../assets/crest.svg';

// Royal Logo Component (crest + wordmark)
const RoyalLogo = ({ className = '' }: { className?: string }) => (
  <div className={`flex items-center gap-3 ${className}`} aria-hidden>
    <div className="relative w-10 h-10 flex-shrink-0">
      <img src={crest} alt="Crest" className="w-10 h-10 object-contain" />
      <motion.div
        aria-hidden
        className="absolute inset-0 rounded-full bg-gold-500/10"
        animate={{ scale: [1, 1.06, 1], opacity: [0.5, 0.9, 0.5] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
    <span className="font-display text-2xl font-bold text-royal-gradient select-none">Cite<span className="text-gold-500">AI</span></span>
  </div>
);

const NavLink = ({
  to,
  children,
  icon: Icon,
  isActive = false,
  onClick = () => {},
}: {
  to: string;
  children: React.ReactNode;
  icon?: any;
  isActive?: boolean;
  onClick?: () => void;
}) => (
  <Link
    to={to}
    onClick={onClick}
    className={`relative px-4 py-2 rounded-lg font-serif font-medium transition-all duration-300 flex items-center gap-2 group
      ${isActive ? 'text-gold-500 bg-gold-500/8' : 'text-parchment-200 hover:text-gold-400 hover:bg-gold-500/5'}`}
  >
    {Icon && <Icon className="w-4 h-4" />}
    {children}
    {isActive && (
      <motion.div
        className="absolute -bottom-1 left-2 right-2 h-0.5 bg-gold-500 rounded"
        layoutId="activeNav"
        initial={false}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      />
    )}
  </Link>
);

const MobileMenu = ({
  isOpen,
  onClose,
  currentPath,
  isSignedIn,
}: {
  isOpen: boolean;
  onClose: () => void;
  currentPath: string;
  isSignedIn: boolean;
}) => (
  <AnimatePresence>
    {isOpen && (
      <>
        <motion.div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        />

        <motion.aside
          className="fixed top-0 right-0 h-full w-80 bg-gradient-to-b from-royal-navy to-royal-purple backdrop-blur-lg border-l border-gold-500/30 z-50 p-6"
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
          <div className="flex justify-between items-center mb-8">
            <RoyalLogo />
            <button
              onClick={onClose}
              aria-label="Close menu"
              className="p-2 rounded-lg bg-gold-500/10 text-gold-500 hover:bg-gold-500/20 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <nav className="space-y-4">
            <NavLink to="/" isActive={currentPath === '/'} onClick={onClose}>
              Home
            </NavLink>
            <NavLink to="/features" icon={Star} isActive={currentPath === '/features'} onClick={onClose}>
              Features
            </NavLink>
            <NavLink to="/generate" icon={Scroll} isActive={currentPath === '/generate'} onClick={onClose}>
              Generate Paper
            </NavLink>
            <NavLink to="/dashboard" icon={BookOpen} isActive={currentPath === '/dashboard'} onClick={onClose}>
              Dashboard
            </NavLink>

            <div className="border-t border-gold-500/20 pt-4 mt-6">
              {isSignedIn ? (
                <div className="space-y-3">
                  <NavLink to="/settings" icon={Settings} isActive={currentPath === '/settings'} onClick={onClose}>
                    Settings
                  </NavLink>
                  <div className="flex items-center gap-3 px-4 py-2">
                    <UserButton
                      appearance={{
                        elements: { avatarBox: 'w-8 h-8 border-2 border-gold-500/30' },
                      }}
                    />
                    <span className="text-parchment-200 font-serif">Profile</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <Link to="/sign-in" onClick={onClose}>
                    <button className="w-full btn-outline-royal text-sm">Sign In</button>
                  </Link>
                  <Link to="/sign-up" onClick={onClose}>
                    <button className="w-full btn-royal text-sm">Get Started</button>
                  </Link>
                </div>
              )}
            </div>
          </nav>
        </motion.aside>
      </>
    )}
  </AnimatePresence>
);

export const DashboardNavbar = () => {
  const auth = useAuth();
  const isSignedIn = !!auth?.isSignedIn;
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <motion.header
        className={`fixed top-0 left-0 right-0 z-30 transition-all duration-300 ${
          isScrolled ? 'backdrop-royal shadow-royal border-b border-gold-500/20' : 'bg-transparent'
        }`}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        <div className="container-royal">
          <div className="flex items-center justify-between h-20">
            <Link to="/" className="hover-lift">
              <RoyalLogo />
            </Link>

            <nav className="hidden lg:flex items-center space-x-2">
              <NavLink to="/" isActive={location.pathname === '/'}>
                Home
              </NavLink>
              <NavLink to="/features" icon={Star} isActive={location.pathname === '/features'}>
                Features
              </NavLink>
              <NavLink to="/generate" icon={Scroll} isActive={location.pathname === '/generate'}>
                Generate
              </NavLink>
              <NavLink to="/dashboard" icon={BookOpen} isActive={location.pathname === '/dashboard'}>
                Dashboard
              </NavLink>
            </nav>

            <div className="flex items-center gap-4">
              <div className="hidden lg:flex items-center gap-3">
                {isSignedIn ? (
                  <div className="flex items-center gap-3">
                    <Link to="/settings">
                      <button className="btn-ghost-royal">
                        <Settings className="w-4 h-4" />
                      </button>
                    </Link>
                    <UserButton
                      appearance={{
                        elements: {
                          avatarBox: 'w-10 h-10 border-2 border-gold-500/30 hover:border-gold-500/60 transition-colors',
                        },
                      }}
                    />
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <Link to="/sign-in">
                      <button className="btn-ghost-royal">Sign In</button>
                    </Link>
                    <Link to="/sign-up">
                      <button className="btn-royal">
                        <Sparkles className="w-4 h-4 mr-2" />
                        Get Started
                      </button>
                    </Link>
                  </div>
                )}
              </div>

              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="lg:hidden p-2 rounded-lg bg-gold-500/10 text-gold-500 hover:bg-gold-500/20 transition-colors"
                aria-label="Open menu"
              >
                <Menu className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      </motion.header>

      <MobileMenu
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        currentPath={location.pathname}
        isSignedIn={isSignedIn}
      />
    </>
  );
};

export const LandingHeader = () => {
  const auth = useAuth();
  const isSignedIn = !!auth?.isSignedIn;
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <motion.header
        className={`fixed top-0 left-0 right-0 z-30 transition-all duration-300 ${
          isScrolled ? 'backdrop-royal shadow-royal' : 'bg-gradient-to-b from-royal-midnight/80 to-transparent'
        }`}
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      >
        <div className="container-royal">
          <div className="flex items-center justify-between h-20">
            <Link to="/" className="hover-lift">
              <RoyalLogo />
            </Link>

            <nav className="hidden lg:flex items-center space-x-6">
              <Link to="/features" className="text-parchment-200 hover:text-gold-400 font-serif transition-colors">
                Features
              </Link>
            </nav>

            <div className="flex items-center gap-4">
              <div className="hidden lg:flex items-center gap-3">
                {isSignedIn ? (
                  <div className="flex items-center gap-3">
                    <Link to="/dashboard">
                      <button className="btn-ghost-royal">Dashboard</button>
                    </Link>
                    <UserButton />
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <Link to="/sign-in">
                      <button className="btn-ghost-royal">Sign In</button>
                    </Link>
                    <Link to="/sign-up">
                      <button className="btn-royal">
                        <Crown className="w-4 h-4 mr-2" /> Begin Journey
                      </button>
                    </Link>
                  </div>
                )}
              </div>

              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="lg:hidden p-2 rounded-lg bg-gold-500/10 text-gold-500 hover:bg-gold-500/20 transition-colors"
                aria-label="Open menu"
              >
                <Menu className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      </motion.header>

      <MobileMenu isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} currentPath={'/'} isSignedIn={isSignedIn} />
    </>
  );
};
