import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { 
  ArrowRight, Moon, Sun, FilePlus, Library, ShieldCheck, 
  Settings, User, Home, LogOut, ClipboardList, Quote, FolderPlus, 
  Upload, SortDesc, CheckCircle, BookOpen, Search, Sparkles
} from 'lucide-react';
import { UserButton, useUser } from '@clerk/clerk-react';
import { Logo } from '../ui/components';

// Theme Toggle Component
export const ThemeToggle = () => {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme') as 'light' | 'dark';
      if (savedTheme) {
        return savedTheme;
      }
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  return (
    <button
      onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
      className="p-2 rounded-lg bg-neutral hover:bg-neutral-200 dark:bg-primary dark:hover:bg-primary-700 transition-colors"
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
    >
      {theme === 'light' ? 
        <Moon className="h-5 w-5 text-primary" /> : 
        <Sun className="h-5 w-5 text-accent" />
      }
    </button>
  );
};

// NavLink Component
interface NavLinkProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  className?: string;
}

export const NavLink = ({ to, icon, label, className = '' }: NavLinkProps) => {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate(to)}
      className={`flex items-center space-x-2 text-primary hover:text-accent dark:text-neutral dark:hover:text-accent transition-colors ${className}`}
    >
      {icon}
      <span className="font-medium">{label}</span>
    </button>
  );
};

// Icon-only navigation link component (without tooltip functionality)
const NavIconLink = ({
  to,
  icon,
  label,
  badge,
  className = '',
  isActive
}: {
  to: string;
  icon: React.ReactNode;
  label: string;
  badge?: number;
  className?: string;
  isActive?: boolean;
}) => {
  const location = useLocation();
  const active = isActive !== undefined ? isActive : location.pathname.startsWith(to);
  
  return (
    <Link
      to={to}
      className={`relative p-3 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-1 ${
        active 
          ? 'text-accent' 
          : 'text-primary hover:text-accent hover:bg-neutral dark:text-neutral dark:hover:text-accent dark:hover:bg-primary-800'
      } ${className}`}
      aria-label={label}
    >
      {icon}
      
      {badge !== undefined && badge > 0 && (
        <span className="absolute top-0 right-0 flex items-center justify-center h-5 w-5 text-xs bg-red-500 text-white rounded-full">
          {badge > 99 ? '99+' : badge}
        </span>
      )}
    </Link>
  );
};

// Landing Header Component
export const LandingHeader = () => {
  const navigate = useNavigate();
  const { isSignedIn, user } = useUser();
  
  const handleGetStarted = () => {
    navigate('/sign-in');
  };

  return (
    <header className="w-full bg-gradient-to-r from-primary to-secondary shadow-lg sticky top-0 z-50 overflow-x-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex items-center justify-between py-4">
          <div className="flex items-center space-x-24">
            <Link to="/" className="flex items-center space-x-3">
              <Logo className="h-8 w-8" />
            </Link>
            <div className="hidden md:flex items-center space-x-24">
              <Link to="/features" className="text-neutral hover:text-accent transition">Features</Link>
              
              {isSignedIn && (
                <>
                  <Link to="/generate" className="text-neutral hover:text-accent transition">
                    Generate Paper
                  </Link>
                  <Link to="/library" className="text-neutral hover:text-accent transition">
                    Library
                  </Link>
                  <Link to="/dashboard" className="text-neutral hover:text-accent transition">
                    Dashboard
                  </Link>
                </>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <ThemeToggle />

            {isSignedIn ? (
              <div className="flex items-center">
                <UserButton 
                  afterSignOutUrl="/"
                  appearance={{
                    elements: {
                      userButtonAvatarBox: "w-9 h-9",
                      userButtonTrigger: "focus:shadow-none focus:outline-none",
                      userButtonPopoverCard: "shadow-lg border border-neutral-200 dark:border-primary-700",
                      userButtonPopoverActionButton: "text-sm",
                      userButtonPopoverActionButtonText: "font-normal",
                      userButtonPopoverFooter: "hidden"
                    }
                  }}
                  userProfileUrl="/settings"
                  userProfileMode="navigation"
                />
              </div>
            ) : (
              <button
                onClick={handleGetStarted}
                className="bg-accent hover:bg-accent-600 text-primary font-medium py-2 px-4 rounded-md transition-colors"
              >
                Sign In
              </button>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
};

// Dashboard Sidebar Component
export const DashboardSidebar = () => {
  const location = useLocation();
  
  // Helper to determine if current path matches
  const isCurrentPath = (path: string) => location.pathname.startsWith(path);
  
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-neutral dark:bg-primary shadow-lg border-t border-neutral-200 dark:border-primary-700 p-3 z-40">
      <div className="flex justify-around items-center">
        {/* Main navigation items */}
        <Link 
          to="/dashboard" 
          className={`flex flex-col items-center justify-center p-2 transition-colors ${isCurrentPath('/dashboard') ? 'text-accent' : 'text-gray-500 hover:text-accent'}`}
        >
          <Home size={20} />
          <span className="text-xs mt-1">Dashboard</span>
        </Link>
        
        <Link 
          to="/generate" 
          className={`flex flex-col items-center justify-center p-2 transition-colors ${isCurrentPath('/generate') ? 'text-accent' : 'text-gray-500 hover:text-accent'}`}
        >
          <FilePlus size={20} />
          <span className="text-xs mt-1">New Paper</span>
        </Link>
        
        <Link 
          to="/library" 
          className={`flex flex-col items-center justify-center p-2 transition-colors ${isCurrentPath('/library') ? 'text-accent' : 'text-gray-500 hover:text-accent'}`}
        >
          <Library size={20} />
          <span className="text-xs mt-1">Library</span>
        </Link>
        
        <Link 
          to="/quality" 
          className={`flex flex-col items-center justify-center p-2 transition-colors ${isCurrentPath('/quality') ? 'text-accent' : 'text-gray-500 hover:text-accent'}`}
        >
          <ShieldCheck size={20} />
          <span className="text-xs mt-1">Quality</span>
        </Link>
        
        <Link 
          to="/settings" 
          className={`flex flex-col items-center justify-center p-2 transition-colors ${isCurrentPath('/settings') ? 'text-accent' : 'text-gray-500 hover:text-accent'}`}
        >
          <Settings size={20} />
          <span className="text-xs mt-1">Settings</span>
        </Link>
      </div>
    </div>
  );
};

// Dashboard Navbar Component
export const DashboardNavbar = () => {
  const { user } = useUser();
  const navigate = useNavigate();

  return (
    <nav className="fixed top-0 w-full bg-neutral dark:bg-primary shadow-sm z-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between py-3">
        <div className="flex items-center space-x-8">
          <Link to="/" className="flex items-center space-x-24">
            <Logo className="h-8 w-8" />
          </Link>
          <div className="hidden lg:flex space-x-6">
            <NavLink to="/generate" icon={<FilePlus size={18} />} label="New Paper" />
            <NavLink to="/library" icon={<Library size={18} />} label="Library" />
            <NavLink to="/quality" icon={<ShieldCheck size={18} />} label="Quality" />
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <ThemeToggle />
          <div className="flex items-center">
            <UserButton 
              afterSignOutUrl="/"
              appearance={{
                elements: {
                  userButtonAvatarBox: "w-9 h-9",
                  userButtonTrigger: "focus:shadow-none focus:outline-none",
                  userButtonPopoverCard: "shadow-lg border border-neutral-200 dark:border-primary-700",
                  userButtonPopoverActionButton: "text-sm",
                  userButtonPopoverActionButtonText: "font-normal",
                  userButtonPopoverFooter: "hidden"
                }
              }}
              userProfileUrl="/settings"
              userProfileMode="navigation"
            />
          </div>
        </div>
      </div>
    </nav>
  );
}; 