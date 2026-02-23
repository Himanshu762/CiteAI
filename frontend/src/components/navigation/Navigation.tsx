import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Settings, FileText, Sparkles } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { UserMenu } from '../auth/UserMenu';
import { Logo } from '../ui/components';

const NavLink = ({ to, children, isActive = false, onClick }: { to: string; children: React.ReactNode; isActive?: boolean; onClick?: () => void }) => (
  <Link
    to={to}
    onClick={onClick}
    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive
        ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800'
      }`}
  >
    {children}
  </Link>
);

const MobileMenu = ({ isOpen, onClose, currentPath, isSignedIn }: { isOpen: boolean; onClose: () => void; currentPath: string; isSignedIn: boolean }) => {
  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />
      <div className="fixed top-0 right-0 h-full w-80 bg-white dark:bg-slate-900 z-50 p-6 shadow-xl">
        <div className="flex justify-between items-center mb-8">
          <Logo />
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="space-y-2">
          <NavLink to="/" isActive={currentPath === '/'} onClick={onClose}>Home</NavLink>
          <NavLink to="/features" isActive={currentPath === '/features'} onClick={onClose}>Features</NavLink>
          <NavLink to="/generate" isActive={currentPath === '/generate'} onClick={onClose}>Generate</NavLink>
          <NavLink to="/dashboard" isActive={currentPath === '/dashboard'} onClick={onClose}>Dashboard</NavLink>
        </nav>

        <div className="mt-8 pt-8 border-t border-slate-200 dark:border-slate-700">
          {isSignedIn ? (
            <div className="space-y-2">
              <NavLink to="/settings" isActive={currentPath === '/settings'} onClick={onClose}>Settings</NavLink>
            </div>
          ) : (
            <div className="space-y-3">
              <Link to="/sign-in" onClick={onClose}>
                <button className="w-full py-2 px-4 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg">
                  Sign In
                </button>
              </Link>
              <Link to="/sign-up" onClick={onClose}>
                <button className="w-full py-2 px-4 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg">
                  Get Started
                </button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export const DashboardNavbar = () => {
  const { isSignedIn } = useAuth();
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <header className={`fixed top-0 left-0 right-0 z-30 transition-all ${isScrolled ? 'bg-white/80 dark:bg-slate-900/80 backdrop-blur-md shadow-sm border-b border-slate-200 dark:border-slate-800' : 'bg-transparent'
        }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Logo />

            <nav className="hidden md:flex items-center gap-1">
              <NavLink to="/" isActive={location.pathname === '/'}>Home</NavLink>
              <NavLink to="/features" isActive={location.pathname === '/features'}>Features</NavLink>
              <NavLink to="/generate" isActive={location.pathname === '/generate'}>Generate</NavLink>
              <NavLink to="/dashboard" isActive={location.pathname === '/dashboard'}>Dashboard</NavLink>
            </nav>

            <div className="flex items-center gap-3">
              <div className="hidden md:flex items-center gap-3">
                {isSignedIn ? (
                  <>
                    <Link to="/settings">
                      <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
                        <Settings className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                      </button>
                    </Link>
                    <UserMenu />
                  </>
                ) : (
                  <>
                    <Link to="/sign-in">
                      <button className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
                        Sign In
                      </button>
                    </Link>
                    <Link to="/sign-up">
                      <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-2">
                        <Sparkles className="w-4 h-4" />
                        Get Started
                      </button>
                    </Link>
                  </>
                )}
              </div>

              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="md:hidden p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
              >
                <Menu className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

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
  const { isSignedIn } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <header className={`fixed top-0 left-0 right-0 z-30 transition-all ${isScrolled ? 'bg-white/80 dark:bg-slate-900/80 backdrop-blur-md shadow-sm' : 'bg-transparent'
        }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Logo />

            <nav className="hidden md:flex items-center gap-6">
              <Link to="/features" className="text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">
                Features
              </Link>
            </nav>

            <div className="flex items-center gap-3">
              <div className="hidden md:flex items-center gap-3">
                {isSignedIn ? (
                  <>
                    <Link to="/dashboard">
                      <button className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
                        Dashboard
                      </button>
                    </Link>
                    <UserMenu />
                  </>
                ) : (
                  <>
                    <Link to="/sign-in">
                      <button className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
                        Sign In
                      </button>
                    </Link>
                    <Link to="/sign-up">
                      <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg">
                        Get Started
                      </button>
                    </Link>
                  </>
                )}
              </div>

              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="md:hidden p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
              >
                <Menu className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <MobileMenu isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} currentPath="/" isSignedIn={isSignedIn} />
    </>
  );
};
