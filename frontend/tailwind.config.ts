import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Theme-aware colors using CSS variables with fallbacks
        primary: 'var(--color-brand-primary, #8bba9c)',
        secondary: 'var(--color-brand-secondary, #e8c7c8)',
        accent: 'var(--color-brand-accent, #f7ede2)',

        // Background colors
        'bg-primary': 'var(--color-background-primary, #ffffff)',
        'bg-secondary': 'var(--color-background-secondary, #f7ede2)',
        'bg-elevated': 'var(--color-background-elevated, #ffffff)',

        // Text colors
        'text-primary': 'var(--color-text-primary, #0c0f1d)',
        'text-secondary': 'var(--color-text-secondary, #64748b)',
        'text-tertiary': 'var(--color-text-tertiary, #94a3b8)',
        'text-inverse': 'var(--color-text-inverse, #ffffff)',
        'on-primary': 'var(--color-text-on-primary, var(--color-text-inverse, #ffffff))',
        'on-secondary': 'var(--color-text-on-secondary, var(--color-text-primary, #0c0f1d))',
        'on-accent': 'var(--color-text-on-accent, var(--color-text-inverse, #ffffff))',
        'on-interactive': 'var(--color-text-on-interactive, var(--color-text-inverse, #ffffff))',
        'on-success': 'var(--color-text-on-success, var(--color-text-inverse, #ffffff))',
        'on-warning': 'var(--color-text-on-warning, var(--color-text-inverse, #ffffff))',
        'on-error': 'var(--color-text-on-error, var(--color-text-inverse, #ffffff))',
        'on-info': 'var(--color-text-on-info, var(--color-text-inverse, #ffffff))',

        // Border colors
        'border-default': 'var(--color-border-default, #e2e8f0)',
        'border-strong': 'var(--color-border-strong, #cbd5e1)',

        // Interactive colors
        'interactive-default': 'var(--color-interactive-default, #8bba9c)',
        'interactive-hover': 'var(--color-interactive-hover, #7aa88a)',
        'interactive-active': 'var(--color-interactive-active, #699678)',
        'interactive-disabled': 'var(--color-interactive-disabled, #cbd5e1)',

        // Feedback colors
        success: 'var(--color-feedback-success, #10b981)',
        warning: 'var(--color-feedback-warning, #f59e0b)',
        error: 'var(--color-feedback-error, #ef4444)',
        info: 'var(--color-feedback-info, #3b82f6)',

        // Surface layers for visual hierarchy
        'surface-base': 'var(--color-surface-base, #f7ede2)',
        'surface-elevated': 'var(--color-surface-elevated, #ffffff)',
        'surface-overlay': 'var(--color-surface-overlay, #ffffff)',

        // Legacy color aliases (for backward compatibility)
        midnight: 'var(--color-text-primary, #0c0f1d)',
        champagne: 'var(--color-background-secondary, #f7ede2)',
        blush: 'var(--color-brand-secondary, #e8c7c8)',
        jade: 'var(--color-brand-primary, #8bba9c)'
      },
      fontFamily: {
        display: 'var(--typography-fontFamily-display, "Playfair Display", serif)',
        body: 'var(--typography-fontFamily-body, "Source Sans Pro", sans-serif)',
        mono: 'var(--typography-fontFamily-mono, "Fira Code", monospace)'
      },
      fontSize: {
        xs: 'var(--typography-fontSize-xs, 0.75rem)',
        sm: 'var(--typography-fontSize-sm, 0.875rem)',
        base: 'var(--typography-fontSize-base, 1rem)',
        lg: 'var(--typography-fontSize-lg, 1.125rem)',
        xl: 'var(--typography-fontSize-xl, 1.25rem)',
        '2xl': 'var(--typography-fontSize-2xl, 1.5rem)',
        '3xl': 'var(--typography-fontSize-3xl, 1.875rem)',
        '4xl': 'var(--typography-fontSize-4xl, 2.25rem)',
        '5xl': 'var(--typography-fontSize-5xl, 3rem)'
      },
      borderRadius: {
        sm: 'var(--border-radius-sm, 0.25rem)',
        DEFAULT: 'var(--border-radius-md, 0.5rem)',
        md: 'var(--border-radius-md, 0.5rem)',
        lg: 'var(--border-radius-lg, 0.75rem)',
        xl: 'var(--border-radius-xl, 1rem)',
        '2xl': 'var(--border-radius-2xl, 1.5rem)',
        full: 'var(--border-radius-full, 9999px)'
      },
      boxShadow: {
        sm: 'var(--shadow-sm, 0 1px 2px 0 rgba(0, 0, 0, 0.05))',
        DEFAULT: 'var(--shadow-md, 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06))',
        md: 'var(--shadow-md, 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06))',
        lg: 'var(--shadow-lg, 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05))',
        xl: 'var(--shadow-xl, 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04))'
      }
    }
  },
  plugins: []
};

export default config;
