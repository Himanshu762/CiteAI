import React, { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';
import { getStoredTheme, persistTheme, resolveTheme, applyTheme } from '../lib/theme';

export default function ThemeToggle({ className = '' }: { className?: string }) {
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>(() => getStoredTheme() ?? 'system');

  useEffect(() => {
    const resolved = resolveTheme(theme);
    applyTheme(resolved);
    persistTheme(theme);
  }, [theme]);

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <button
        aria-label="Toggle theme"
        onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
        className="p-2 rounded-md bg-transparent hover:bg-gold-500/8 transition-colors"
      >
        {theme === 'dark' ? <Sun className="w-5 h-5 text-parchment" /> : <Moon className="w-5 h-5 text-gold-500" />}
      </button>
      <select
        aria-label="Theme select"
        value={theme}
        onChange={(e) => setTheme(e.target.value as any)}
        className="bg-transparent text-sm text-parchment/80"
      >
        <option value="light">Light</option>
        <option value="dark">Dark</option>
        <option value="system">System</option>
      </select>
    </div>
  );
}
