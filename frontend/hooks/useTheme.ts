import { useState, useEffect } from 'react';

export type Theme = 'light' | 'dark';

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.classList.remove('light', 'dark');
  root.classList.add(theme);
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>('dark');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    chrome.storage.local.get(['theme'], (result) => {
      const stored = (result.theme as Theme) || 'dark';
      setThemeState(stored);
      applyTheme(stored);
      setLoaded(true);
    });
  }, []);

  const setTheme = (next: Theme) => {
    setThemeState(next);
    applyTheme(next);
    chrome.storage.local.set({ theme: next });
  };

  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');

  return { theme, loaded, setTheme, toggleTheme };
}
