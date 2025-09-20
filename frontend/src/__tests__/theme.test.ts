import { resolveTheme, applyTheme } from '../lib/theme';

// Basic non-framework test: verify resolveTheme returns 'dark' or 'light'
console.log('resolveTheme(system) =>', resolveTheme('system'));
console.log('resolveTheme(light) =>', resolveTheme('light'));
console.log('resolveTheme(dark) =>', resolveTheme('dark'));

// Test applyTheme by toggling and reading documentElement dataset if in browser env
if (typeof document !== 'undefined') {
  applyTheme('dark');
  console.log('applied dataset:', document.documentElement.dataset.theme);
  applyTheme('light');
  console.log('applied dataset:', document.documentElement.dataset.theme);
}

console.log('theme tests completed');
