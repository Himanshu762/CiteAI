export type Theme = 'light' | 'dark' | 'system';

const KEY = 'site-theme';

export function getStoredTheme(): Theme | null {
  try {
    const s = localStorage.getItem(KEY);
    if (!s) return null;
    return s as Theme;
  } catch {
    return null;
  }
}

export function persistTheme(t: Theme) {
  try { localStorage.setItem(KEY, t); } catch {}
}

export function resolveTheme(t: Theme): 'light'|'dark' {
  if (t === 'system') {
    if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark';
    return 'light';
  }
  return t;
}

export function applyTheme(t: 'light'|'dark') {
  const root = document.documentElement;
  if (t === 'dark') {
    root.classList.add('dark');
    root.dataset.theme = 'dark';
  } else {
    root.classList.remove('dark');
    root.dataset.theme = 'light';
  }
}
