/**
 * Theme Context and Hook
 *
 * Shared context for theme state.
 */

import { createContext, useContext } from 'react';

/* ----------------------------------------------------------------------------
   Types
   ---------------------------------------------------------------------------- */

export type Theme = 'light' | 'dark' | 'system';

export interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: 'light' | 'dark';
  /** Whether the component has mounted (for SSR hydration safety) */
  mounted: boolean;
}

/* ----------------------------------------------------------------------------
   Context
   ---------------------------------------------------------------------------- */

export const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export const STORAGE_KEY = 'wbot-theme';

/* ----------------------------------------------------------------------------
   Hook
   ---------------------------------------------------------------------------- */

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
