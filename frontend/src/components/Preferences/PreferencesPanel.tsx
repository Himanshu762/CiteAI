import React, { useEffect, useState } from 'react';

const MODELS = [
  { id: 'openai/gpt-oss-120b:free', label: 'openai/gpt-oss-120b (free)' },
  { id: 'openai/gpt-oss-20b:free', label: 'openai/gpt-oss-20b (free)' },
  { id: 'deepseek/deepseek-r1-0528:free', label: 'deepseek/deepseek-r1-0528 (free)' },
  { id: 'microsoft/mai-ds-r1:free', label: 'microsoft/mai-ds-r1 (free)' },
];

export default function PreferencesPanel() {
  const [themePref, setThemePref] = useState<'system'|'light'|'dark'>(() => {
    try {
      return (localStorage.getItem('site-theme-pref') as any) || 'system';
    } catch { return 'system'; }
  });
  const [model, setModel] = useState(() => {
    try { return localStorage.getItem('site-model') || MODELS[0].id; } catch { return MODELS[0].id; }
  });

  useEffect(() => {
    try { localStorage.setItem('site-theme-pref', themePref); } catch {}
    // apply theme
    const root = document.documentElement;
    if (themePref === 'system') {
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.toggle('dark', prefersDark);
      root.dataset.theme = prefersDark ? 'dark' : 'light';
    } else {
      root.classList.toggle('dark', themePref === 'dark');
      root.dataset.theme = themePref === 'dark' ? 'dark' : 'light';
    }
  }, [themePref]);

  useEffect(() => {
    try { localStorage.setItem('site-model', model); } catch {}
  }, [model]);

  return (
    <div className="bg-card border-2 border-border rounded-lg p-6 lg:p-8 shadow-lg mt-6">
      <h3 className="text-xl font-semibold font-serif mb-4">Preferences</h3>

      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">Theme Preference</label>
        <div className="flex items-center space-x-3">
          <label className="inline-flex items-center space-x-2">
            <input type="radio" name="themePref" value="system" checked={themePref === 'system'} onChange={() => setThemePref('system')} />
            <span>System</span>
          </label>
          <label className="inline-flex items-center space-x-2">
            <input type="radio" name="themePref" value="light" checked={themePref === 'light'} onChange={() => setThemePref('light')} />
            <span>Light</span>
          </label>
          <label className="inline-flex items-center space-x-2">
            <input type="radio" name="themePref" value="dark" checked={themePref === 'dark'} onChange={() => setThemePref('dark')} />
            <span>Dark</span>
          </label>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Model</label>
        <select value={model} onChange={(e) => setModel(e.target.value)} className="w-full p-2 rounded-md border border-border bg-input">
          {MODELS.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
        </select>
        <p className="text-xs text-muted-ink mt-2">Model selection persists locally and will be used by generation requests.</p>
      </div>
    </div>
  )
}
