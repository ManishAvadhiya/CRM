export type ThemeMode = 'light' | 'dark';

const THEME_KEY = 'crm-theme';

function canUseDom() {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
}

export function getStoredTheme(): ThemeMode | null {
  if (!canUseDom()) return null;
  const value = window.localStorage.getItem(THEME_KEY);
  return value === 'light' || value === 'dark' ? value : null;
}

export function getCurrentTheme(): ThemeMode {
  if (!canUseDom()) return 'light';
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
}

export function applyTheme(theme: ThemeMode) {
  if (!canUseDom()) return;
  if (theme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}

export function setTheme(theme: ThemeMode) {
  if (!canUseDom()) return;
  applyTheme(theme);
  window.localStorage.setItem(THEME_KEY, theme);
}

export function initializeTheme() {
  if (!canUseDom()) return;
  const stored = getStoredTheme();
  const theme: ThemeMode = stored ?? 'light';
  setTheme(theme);
}
