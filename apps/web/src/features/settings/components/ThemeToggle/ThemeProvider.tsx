/**
 * Theme Provider Component
 *
 * Manages theme state with localStorage persistence.
 * Applies theme to document root element.
 */

import { useEffect, useState, type ReactNode } from 'react';

import { ThemeContext, STORAGE_KEY, type Theme } from './ThemeContext';

/* ----------------------------------------------------------------------------
   Provider
   ---------------------------------------------------------------------------- */

interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: Theme;
}

export function ThemeProvider({ children, defaultTheme = 'system' }: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(() => {
    // Check localStorage on initial load
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
      if (stored && ['light', 'dark', 'system'].includes(stored)) {
        return stored;
      }
    }
    return defaultTheme;
  });

  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');

  // Update theme on document and resolve system theme
  useEffect(() => {
    const root = document.documentElement;

    const updateTheme = () => {
      let resolved: 'light' | 'dark';

      if (theme === 'system') {
        resolved = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        root.removeAttribute('data-theme');
      } else {
        resolved = theme;
        root.setAttribute('data-theme', theme);
      }

      setResolvedTheme(resolved);
    };

    updateTheme();

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (theme === 'system') {
        updateTheme();
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, [theme]);

  // Persist theme to localStorage
  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem(STORAGE_KEY, newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
