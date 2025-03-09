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

// NavIconLink Component
interface NavIconLinkProps {
  to: string;
  icon: React.ReactNode;
  label: string;
}

export const NavIconLink = ({ to, icon, label }: NavIconLinkProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isActive = location.pathname.startsWith(to);
  
  return (
    <button
      onClick={() => navigate(to)}
      className={`block p-3 rounded-lg transition-colors ${
        isActive 
          ? "bg-accent/10 text-accent dark:bg-accent/10" 
          : "text-primary hover:text-accent hover:bg-neutral dark:text-neutral dark:hover:text-accent dark:hover:bg-primary-800"
      }`}
      title={label}
      aria-current={isActive ? "page" : undefined}
    >
      {icon}
    </button>
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
            <div className="hidden md:flex items-center space-x-6">
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
  const navigate = useNavigate();
  const location = useLocation();
  const [showTooltip, setShowTooltip] = useState<string | null>(null);
  
  // Helper to determine if current path matches
  const isCurrentPath = (path: string) => location.pathname.startsWith(path);
  
  // Tooltip component
  const Tooltip = ({ content, visible }: { content: string; visible: boolean }) => (
    <div className={`absolute left-16 w-auto p-2 min-w-max rounded-md shadow-md text-neutral bg-primary-800 text-xs font-bold transition-all duration-150 ${visible ? 'opacity-100 visible' : 'opacity-0 invisible'}`}>
      {content}
    </div>
  );

  // Fixed navigation options
  const renderFixedNavigation = () => (
    <>
      <NavIconLink to="/dashboard" icon={<Home size={20} />} label="Dashboard" />
      
      <div className="relative">
        <NavIconLink to="/generate" icon={<FilePlus size={20} />} label="New Paper" />
      </div>
      
      <div className="relative">
        <NavIconLink to="/library" icon={<Library size={20} />} label="Library" />
      </div>
      
      <div className="relative">
        <NavIconLink to="/quality" icon={<ShieldCheck size={20} />} label="Quality" />
      </div>
      
      <div className="border-t border-neutral-200 dark:border-primary-700 pt-6">
        <NavIconLink to="/settings" icon={<Settings size={20} />} label="Settings" />
      </div>
    </>
  );

  // Context-specific options for the Generator page
  const renderGeneratorOptions = () => (
    <div className="border-t border-neutral-200 dark:border-primary-700 pt-4 mt-4 space-y-3">
      <ActionButton
        icon={<ClipboardList size={20} />}
        tooltipId="templates"
        tooltipContent="Choose Template"
        onClick={() => navigate('/generate/templates')}
      />
      
      <ActionButton
        icon={<Quote size={20} />}
        tooltipId="citations"
        tooltipContent="Citation Style"
        onClick={() => navigate('/generate/citations')}
      />
      
      <ActionButton
        icon={<Sparkles size={20} className="text-accent" />}
        tooltipId="generate"
        tooltipContent="Generate Content"
        onClick={() => document.getElementById('generate-content-btn')?.click()}
        highlighted={true}
      />
    </div>
  );

  // Context-specific options for the Library page
  const renderLibraryOptions = () => (
    <div className="border-t border-neutral-200 dark:border-primary-700 pt-4 mt-4 space-y-3">
      <ActionButton
        icon={<FolderPlus size={20} />}
        tooltipId="create-folder"
        tooltipContent="New Folder"
        onClick={() => document.getElementById('create-folder-btn')?.click()}
      />
      
      <ActionButton
        icon={<Upload size={20} />}
        tooltipId="import"
        tooltipContent="Import Paper"
        onClick={() => document.getElementById('import-paper-btn')?.click()}
      />
      
      <ActionButton
        icon={<SortDesc size={20} />}
        tooltipId="sort"
        tooltipContent="Sort Papers"
        onClick={() => document.getElementById('sort-papers-btn')?.click()}
      />
    </div>
  );

  // Context-specific options for the Quality page
  const renderQualityOptions = () => (
    <div className="border-t border-neutral-200 dark:border-primary-700 pt-4 mt-4 space-y-3">
      <ActionButton
        icon={<Search size={20} />}
        tooltipId="plagiarism"
        tooltipContent="Plagiarism Check"
        onClick={() => navigate('/quality/plagiarism')}
      />
      
      <ActionButton
        icon={<CheckCircle size={20} />}
        tooltipId="grammar"
        tooltipContent="Grammar Check"
        onClick={() => navigate('/quality/grammar')}
      />
      
      <ActionButton
        icon={<BookOpen size={20} />}
        tooltipId="citation-check"
        tooltipContent="Citation Check"
        onClick={() => navigate('/quality/citations')}
      />
    </div>
  );

  // Sidebar Action Button
  const ActionButton = ({ 
    icon, 
    tooltipId, 
    tooltipContent,
    onClick,
    highlighted = false 
  }: { 
    icon: React.ReactNode;
    tooltipId: string;
    tooltipContent: string;
    onClick: () => void;
    highlighted?: boolean;
  }) => {
    const [isLoading, setIsLoading] = useState(false);
    
    const handleClick = async () => {
      setIsLoading(true);
      try {
        await onClick();
      } finally {
        // Add a small delay for better UX even if the action is instant
        setTimeout(() => setIsLoading(false), 500);
      }
    };
    
    return (
      <button 
        className={`w-full flex items-center justify-center p-3 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-1 ${
          highlighted 
            ? 'bg-accent/10 text-accent'
            : 'text-primary hover:text-accent hover:bg-neutral dark:text-neutral dark:hover:text-accent dark:hover:bg-primary-800'
        }`}
        onMouseEnter={() => setShowTooltip(tooltipId)}
        onMouseLeave={() => setShowTooltip(null)}
        onClick={handleClick}
        disabled={isLoading}
        aria-label={tooltipContent}
      >
        {isLoading ? (
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-accent"></div>
        ) : (
          icon
        )}
        <Tooltip content={tooltipContent} visible={showTooltip === tooltipId} />
      </button>
    );
  };

  return (
    <div className="fixed left-6 top-1/2 -translate-y-1/2 bg-neutral dark:bg-primary rounded-2xl shadow-xl p-4 space-y-1 z-40">
      {/* Always show fixed navigation */}
      {renderFixedNavigation()}
      
      {/* Show context-specific options based on current page */}
      {isCurrentPath('/generate') && renderGeneratorOptions()}
      {isCurrentPath('/library') && renderLibraryOptions()}
      {isCurrentPath('/quality') && renderQualityOptions()}
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