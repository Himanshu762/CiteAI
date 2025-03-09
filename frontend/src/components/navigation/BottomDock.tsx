import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FilePlus, Library, ShieldCheck, Settings } from 'lucide-react';

export const BottomDock = () => {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-neutral dark:bg-primary shadow-md z-50 border-t border-neutral-200 dark:border-primary-700">
      <div className="flex items-center justify-around h-16">
        <Link 
          to="/generate" 
          className={`flex flex-col items-center justify-center w-1/4 h-full ${isActive('/generate') ? 'text-blue-500' : 'text-gray-500'}`}
        >
          <FilePlus size={24} />
          <span className="text-xs mt-1">New</span>
        </Link>
        <Link 
          to="/library" 
          className={`flex flex-col items-center justify-center w-1/4 h-full ${isActive('/library') ? 'text-blue-500' : 'text-gray-500'}`}
        >
          <Library size={24} />
          <span className="text-xs mt-1">Library</span>
        </Link>
        <Link 
          to="/quality" 
          className={`flex flex-col items-center justify-center w-1/4 h-full ${isActive('/quality') ? 'text-blue-500' : 'text-gray-500'}`}
        >
          <ShieldCheck size={24} />
          <span className="text-xs mt-1">Quality</span>
        </Link>
        <Link 
          to="/settings" 
          className={`flex flex-col items-center justify-center w-1/4 h-full ${isActive('/settings') ? 'text-blue-500' : 'text-gray-500'}`}
        >
          <Settings size={24} />
          <span className="text-xs mt-1">Settings</span>
        </Link>
      </div>
    </div>
  );
}; 