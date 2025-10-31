// Theme Provider Context
// Manages global theme state, CSS injection, and theme mode switching

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getActiveTheme } from '../api/theme';
import type { Theme, DesignTokens } from '../types/theme';

interface ThemeContextValue {
  theme: Theme | null;
  isLoading: boolean;
  error: Error | null;
  themeMode: 'light' | 'dark' | 'system';
  spacingPreset: 'compact' | 'normal' | 'spacious';
  setThemeMode: (mode: 'light' | 'dark' | 'system') => void;
  setSpacingPreset: (preset: 'compact' | 'normal' | 'spacious') => void;
  refreshTheme: () => Promise<void>;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const THEME_MODE_KEY = 'luxia-theme-mode';
const SPACING_PRESET_KEY = 'luxia-spacing-preset';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();

  // Theme mode state (light/dark/system)
  const [themeMode, setThemeModeState] = useState<'light' | 'dark' | 'system'>(() => {
    if (typeof window === 'undefined') return 'system';
    const stored = localStorage.getItem(THEME_MODE_KEY) as 'light' | 'dark' | 'system' | null;
    return stored && ['light', 'dark', 'system'].includes(stored) ? stored : 'system';
  });

  // Spacing preset state (compact/normal/spacious)
  const [spacingPreset, setSpacingPresetState] = useState<'compact' | 'normal' | 'spacious'>(() => {
    if (typeof window === 'undefined') return 'normal';
    const stored = localStorage.getItem(SPACING_PRESET_KEY) as 'compact' | 'normal' | 'spacious' | null;
    return stored && ['compact', 'normal', 'spacious'].includes(stored) ? stored : 'normal';
  });

  // Fetch active theme with React Query
  const { data: theme, isLoading, error } = useQuery<Theme, Error>({
    queryKey: ['active-theme'],
    queryFn: getActiveTheme,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    refetchOnWindowFocus: false,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000)
  });

  // Apply theme CSS to document
  useEffect(() => {
    if (!theme) return;

    const styleId = 'luxia-theme-variables';
    let styleElement = document.getElementById(styleId) as HTMLStyleElement;

    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = styleId;
      // Add data attribute for debugging
      styleElement.setAttribute('data-theme-source', 'dynamic');
      // Append to the END of head to ensure it overrides defaults
      document.head.appendChild(styleElement);
    }

    // Use CSS from backend or generate if not provided
    let cssContent = theme.css || generateCSSFromTokens(theme.tokens);

    // Add compatibility layer to map semantic variable names to expected frontend names
    cssContent = addCompatibilityLayer(cssContent);

    styleElement.textContent = cssContent;

    // Log for debugging
    console.log('[Theme] Applied theme:', theme.name, theme.displayName);
  }, [theme]);

  // Apply theme mode (light/dark/system)
  useEffect(() => {
    const root = document.documentElement;

    if (themeMode === 'system') {
      // Remove explicit theme attribute, let @media (prefers-color-scheme) handle it
      root.removeAttribute('data-theme');
    } else {
      root.setAttribute('data-theme', themeMode);
    }

    // Persist to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem(THEME_MODE_KEY, themeMode);
    }
  }, [themeMode]);

  // Apply spacing preset
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-spacing', spacingPreset);

    // Persist to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem(SPACING_PRESET_KEY, spacingPreset);
    }
  }, [spacingPreset]);

  // Listen for system theme changes when in 'system' mode
  useEffect(() => {
    if (typeof window === 'undefined' || themeMode !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = () => {
      // Force a re-render to update components that depend on system theme
      queryClient.invalidateQueries({ queryKey: ['active-theme'] });
    };

    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
    // Legacy browsers
    else if (mediaQuery.addListener) {
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }
  }, [themeMode, queryClient]);

  // Handlers
  const setThemeMode = useCallback((mode: 'light' | 'dark' | 'system') => {
    setThemeModeState(mode);
  }, []);

  const setSpacingPreset = useCallback((preset: 'compact' | 'normal' | 'spacious') => {
    setSpacingPresetState(preset);
  }, []);

  const refreshTheme = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ['active-theme'] });
  }, [queryClient]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme: theme || null,
      isLoading,
      error: error as Error | null,
      themeMode,
      spacingPreset,
      setThemeMode,
      setSpacingPreset,
      refreshTheme
    }),
    [theme, isLoading, error, themeMode, spacingPreset, setThemeMode, setSpacingPreset, refreshTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

/**
 * Hook to use theme context
 */
export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

/**
 * Helper function to generate CSS from design tokens
 * Converts nested token structure to flat CSS custom properties
 */
function generateCSSFromTokens(tokens: DesignTokens): string {
  const cssVars: string[] = [':root {'];

  const flatten = (obj: Record<string, any>, prefix: string = '') => {
    for (const [key, value] of Object.entries(obj)) {
      const cssKey = prefix ? `${prefix}-${key}` : key;

      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        if ('value' in value) {
          // W3C Design Token format with 'value' property
          cssVars.push(`  --${cssKey}: ${value.value};`);
        } else {
          // Nested object
          flatten(value, cssKey);
        }
      } else if (typeof value === 'string') {
        // Direct string value
        cssVars.push(`  --${cssKey}: ${value};`);
      }
    }
  };

  flatten(tokens);
  cssVars.push('}');

  return cssVars.join('\n');
}

/**
 * Adds compatibility layer to map backend semantic variable names
 * to frontend expected variable names
 */
function addCompatibilityLayer(css: string): string {
  // Append compatibility mappings to the end of the :root block
  const closingBrace = css.lastIndexOf('}');

  if (closingBrace === -1) return css;

  const compatibilityMappings = `
  /* Compatibility layer: Map semantic names to expected frontend names */
  --color-text-primary: var(--color-semantic-text-primary);
  --color-text-secondary: var(--color-semantic-text-secondary);
  --color-text-tertiary: var(--color-semantic-text-tertiary);
  --color-text-inverse: var(--color-semantic-text-inverse);

  --color-background-primary: var(--color-semantic-background-primary);
  --color-background-secondary: var(--color-semantic-background-secondary);
  --color-background-elevated: var(--color-semantic-background-elevated);

  --color-border-default: var(--color-semantic-border-default);
  --color-border-strong: var(--color-semantic-border-strong);

  --color-interactive-default: var(--color-semantic-interactive-default);
  --color-interactive-hover: var(--color-semantic-interactive-hover);
  --color-interactive-active: var(--color-semantic-interactive-active);
  --color-interactive-disabled: var(--color-semantic-interactive-disabled);

  --color-feedback-success: var(--color-semantic-feedback-success);
  --color-feedback-error: var(--color-semantic-feedback-error);
  --color-feedback-warning: var(--color-semantic-feedback-warning);
  --color-feedback-info: var(--color-semantic-feedback-info);

  /* Surface layers (using background colors as fallback) */
  --color-surface-base: var(--color-semantic-background-secondary);
  --color-surface-elevated: var(--color-semantic-background-elevated);
  --color-surface-overlay: var(--color-semantic-background-elevated);
`;

  return css.slice(0, closingBrace) + compatibilityMappings + css.slice(closingBrace);
}
