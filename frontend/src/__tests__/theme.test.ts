import { describe, it, expect, beforeEach } from 'vitest';
import { applyTheme, getStoredTheme, persistTheme } from '../lib/theme';

describe('applyTheme', () => {
  beforeEach(() => {
    document.documentElement.className = '';
    delete document.documentElement.dataset.theme;
  });

  it('adds the dark class and data attribute', () => {
    applyTheme('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(document.documentElement.dataset.theme).toBe('dark');
  });

  it('removes the dark class when switching to light', () => {
    applyTheme('dark');
    applyTheme('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(document.documentElement.dataset.theme).toBe('light');
  });
});

describe('theme persistence', () => {
  beforeEach(() => localStorage.clear());

  it('returns null when nothing is stored', () => {
    expect(getStoredTheme()).toBeNull();
  });

  it('round-trips a stored theme', () => {
    persistTheme('dark');
    expect(getStoredTheme()).toBe('dark');
  });
});
