import React from 'react';
import { Logo } from '../components/ui/components';
import ThemeToggle from '../components/ThemeToggle';

export default function LogoDemo() {
  return (
    <div className="flex flex-col w-full min-h-screen bg-background text-foreground">
      <div className="container-royal px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-display font-bold text-parchment-100">Logo Variations</h1>
          <ThemeToggle />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Standard Logo */}
          <div className="royal-card p-6 rounded-xl shadow-royal h-full">
            <h2 className="text-lg font-semibold mb-4 text-parchment-100">Standard Logo</h2>
            <div className="flex justify-center items-center h-32 bg-parchment rounded-lg">
              <Logo className="transform scale-150" />
            </div>
            <div className="mt-4 text-sm text-parchment-200">
              <p>Default logo with detailed book shape and circuit pattern</p>
            </div>
          </div>
          
          {/* Minimal Logo */}
          <div className="royal-card p-6 rounded-xl shadow-royal h-full">
            <h2 className="text-lg font-semibold mb-4 text-parchment-100">Minimal Logo</h2>
            <div className="flex justify-center items-center h-32 bg-parchment rounded-lg">
              <Logo minimal className="transform scale-150" />
            </div>
            <div className="mt-4 text-sm text-parchment-200">
              <p>Simplified geometric design for smaller spaces</p>
            </div>
          </div>
          
          {/* Animated Logo */}
          <div className="royal-card p-6 rounded-xl shadow-royal h-full">
            <h2 className="text-lg font-semibold mb-4 text-parchment-100">Animated Logo (Hover)</h2>
            <div className="flex justify-center items-center h-32 bg-parchment rounded-lg">
              <Logo animated className="transform scale-150" />
            </div>
            <div className="mt-4 text-sm text-parchment-200">
              <p>Hover to see animation effects</p>
            </div>
          </div>
          
          {/* Animated Minimal Logo */}
          <div className="royal-card p-6 rounded-xl shadow-royal h-full">
            <h2 className="text-lg font-semibold mb-4 text-parchment-100">Animated Minimal Logo</h2>
            <div className="flex justify-center items-center h-32 bg-parchment rounded-lg">
              <Logo minimal animated className="transform scale-150" />
            </div>
            <div className="mt-4 text-sm text-parchment-200">
              <p>Minimal design with hover animations</p>
            </div>
          </div>
        </div>
        
        {/* Size Variations */}
        <div className="mt-12 royal-card p-6 rounded-xl shadow-royal w-full">
          <h2 className="text-lg font-semibold mb-4 text-parchment-100">Size Variations</h2>
          <div className="flex flex-wrap items-end gap-8 justify-center">
            <div className="text-center">
              <Logo className="transform scale-50" />
              <p className="mt-2 text-sm text-parchment-200">Small</p>
            </div>
            <div className="text-center">
              <Logo />
              <p className="mt-2 text-sm text-parchment-200">Medium</p>
            </div>
            <div className="text-center">
              <Logo className="transform scale-150" />
              <p className="mt-2 text-sm text-parchment-200">Large</p>
            </div>
          </div>
        </div>
        
        {/* Usage Examples */}
        <div className="mt-12 royal-card p-6 rounded-xl shadow-royal w-full">
          <h2 className="text-lg font-semibold mb-4 text-parchment-100">Usage Examples</h2>

          <div className="mb-6">
            <h3 className="text-md font-medium mb-2 text-parchment-200">Header</h3>
            <div className="bg-royal-gradient p-4 rounded-lg flex items-center">
              <Logo className="mr-auto" />
              <div className="flex space-x-4 text-parchment-200">
                <span>Features</span>
                <span>Pricing</span>
                <span>Docs</span>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="text-md font-medium mb-2 text-parchment-200">Footer</h3>
            <div className="bg-parchment p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <Logo minimal />
                <div className="text-sm text-parchment-700">
                  © 2024 CiteAI. All rights reserved.
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-8 text-center text-parchment-200">
          <p>Implementation based on CiteAI logo design specification</p>
        </div>
      </div>
    </div>
  );
}
