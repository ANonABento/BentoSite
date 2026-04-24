'use client';

/**
 * ThemeProvider - Context provider for UnifiedGrid themes
 *
 * Provides theme configuration to all child components.
 */

import { createContext, useContext, useMemo, type ReactNode } from 'react';
import type { ThemeConfig, GridTheme } from '../UnifiedGrid.types';
import { THEMES } from '../UnifiedGrid.constants';

interface ThemeContextValue {
  theme: ThemeConfig;
  themeName: GridTheme;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function useGridTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useGridTheme must be used within a GridThemeProvider');
  }
  return context;
}

export function GridThemeProvider({
  theme,
  children,
}: {
  theme: GridTheme;
  children: ReactNode;
}) {
  const value = useMemo(
    () => ({
      theme: THEMES[theme],
      themeName: theme,
    }),
    [theme]
  );

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}
