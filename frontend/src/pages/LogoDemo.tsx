import React from 'react';
import { Logo } from '../components/ui/components';
import { ThemeToggle } from '../components/navigation/Navigation';

export default function LogoDemo() {
  return (
    <div className="flex flex-col w-full min-h-screen bg-gradient-to-br from-gray-50 to-indigo-50 dark:from-gray-900 dark:to-indigo-950">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-indigo-700 dark:text-white">Logo Variations</h1>
          <ThemeToggle />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Standard Logo */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md h-full">
            <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">Standard Logo</h2>
            <div className="flex justify-center items-center h-32 bg-gray-100 dark:bg-gray-700 rounded-lg">
              <Logo className="transform scale-150" />
            </div>
            <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
              <p>Default logo with detailed book shape and circuit pattern</p>
            </div>
          </div>
          
          {/* Minimal Logo */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md h-full">
            <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">Minimal Logo</h2>
            <div className="flex justify-center items-center h-32 bg-gray-100 dark:bg-gray-700 rounded-lg">
              <Logo minimal className="transform scale-150" />
            </div>
            <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
              <p>Simplified geometric design for smaller spaces</p>
            </div>
          </div>
          
          {/* Animated Logo */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md h-full">
            <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">Animated Logo (Hover)</h2>
            <div className="flex justify-center items-center h-32 bg-gray-100 dark:bg-gray-700 rounded-lg">
              <Logo animated className="transform scale-150" />
            </div>
            <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
              <p>Hover to see animation effects</p>
            </div>
          </div>
          
          {/* Animated Minimal Logo */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md h-full">
            <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">Animated Minimal Logo</h2>
            <div className="flex justify-center items-center h-32 bg-gray-100 dark:bg-gray-700 rounded-lg">
              <Logo minimal animated className="transform scale-150" />
            </div>
            <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
              <p>Minimal design with hover animations</p>
            </div>
          </div>
        </div>
        
        {/* Size Variations */}
        <div className="mt-12 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md w-full">
          <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">Size Variations</h2>
          <div className="flex flex-wrap items-end gap-8 justify-center">
            <div className="text-center">
              <Logo className="transform scale-50" />
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Small</p>
            </div>
            <div className="text-center">
              <Logo />
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Medium</p>
            </div>
            <div className="text-center">
              <Logo className="transform scale-150" />
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Large</p>
            </div>
          </div>
        </div>
        
        {/* Usage Examples */}
        <div className="mt-12 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md w-full">
          <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">Usage Examples</h2>
          
          <div className="mb-6">
            <h3 className="text-md font-medium mb-2 text-gray-700 dark:text-gray-300">Header</h3>
            <div className="bg-indigo-700 dark:bg-indigo-900 p-4 rounded-lg flex items-center">
              <Logo className="mr-auto" />
              <div className="flex space-x-4 text-white">
                <span>Features</span>
                <span>Pricing</span>
                <span>Docs</span>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="text-md font-medium mb-2 text-gray-700 dark:text-gray-300">Footer</h3>
            <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <Logo minimal />
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  © 2024 CiteAI. All rights reserved.
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-8 text-center text-gray-600 dark:text-gray-400">
          <p>Implementation based on CiteAI logo design specification</p>
        </div>
      </div>
    </div>
  );
} 