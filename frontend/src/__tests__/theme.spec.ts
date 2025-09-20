import { describe, it, expect } from 'vitest';
import { resolveTheme } from '../lib/theme';

describe('theme helpers', () => {
  it('resolves explicit themes', () => {
    expect(resolveTheme('light')).toBe('light');
    expect(resolveTheme('dark')).toBe('dark');
  });

  it('resolves system to either light or dark depending on env', () => {
    const t = resolveTheme('system');
    expect(['light', 'dark']).toContain(t);
  });
});
