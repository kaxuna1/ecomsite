import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Theme System - CSS Variables (dynamically injected by ThemeContext)
        // Brand Colors
        'primary': 'var(--color-brand-primary, #8bba9c)',
        'secondary': 'var(--color-brand-secondary, #e8c7c8)',
        'accent': 'var(--color-brand-accent, #0f172a)',

        // Background Colors
        'bg-primary': 'var(--color-background-primary, #ffffff)',
        'bg-secondary': 'var(--color-background-secondary, #f9fafb)',
        'bg-elevated': 'var(--color-background-elevated, #ffffff)',

        // Text Colors
        'text-primary': 'var(--color-text-primary, #111827)',
        'text-secondary': 'var(--color-text-secondary, #4b5563)',
        'text-tertiary': 'var(--color-text-tertiary, #9ca3af)',
        'text-inverse': 'var(--color-text-inverse, #ffffff)',

        // Border Colors
        'border-default': 'var(--color-border-default, #e5e7eb)',
        'border-strong': 'var(--color-border-strong, #d1d5db)',

        // Interactive Colors
        'interactive-default': 'var(--color-interactive-default, #8bba9c)',
        'interactive-hover': 'var(--color-interactive-hover, #7aa88a)',
        'interactive-active': 'var(--color-interactive-active, #6a967a)',
        'interactive-disabled': 'var(--color-interactive-disabled, #d1d5db)',

        // Feedback Colors
        'feedback-success': 'var(--color-feedback-success, #10b981)',
        'feedback-warning': 'var(--color-feedback-warning, #f59e0b)',
        'feedback-error': 'var(--color-feedback-error, #ef4444)',
        'feedback-info': 'var(--color-feedback-info, #3b82f6)',

        // Legacy color names (backward compatibility - will be removed in future)
        'midnight': 'var(--color-text-primary, #0c0f1d)',
        'champagne': 'var(--color-background-secondary, #f7ede2)',
        'blush': 'var(--color-brand-secondary, #e8c7c8)',
        'jade': 'var(--color-brand-primary, #0f7b6c)'
      },
      fontFamily: {
        display: 'var(--typography-fontFamily-display, "Playfair Display", serif)',
        body: 'var(--typography-fontFamily-body, "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif)',
        mono: 'var(--typography-fontFamily-mono, "Fira Code", "Courier New", monospace)'
      },
      fontSize: {
        'xs': 'var(--typography-fontSize-xs, 0.75rem)',
        'sm': 'var(--typography-fontSize-sm, 0.875rem)',
        'base': 'var(--typography-fontSize-base, 1rem)',
        'lg': 'var(--typography-fontSize-lg, 1.125rem)',
        'xl': 'var(--typography-fontSize-xl, 1.25rem)',
        '2xl': 'var(--typography-fontSize-2xl, 1.5rem)',
        '3xl': 'var(--typography-fontSize-3xl, 1.875rem)',
        '4xl': 'var(--typography-fontSize-4xl, 2.25rem)',
        '5xl': 'var(--typography-fontSize-5xl, 3rem)',
      },
      borderRadius: {
        'sm': 'var(--border-radius-sm, 0.25rem)',
        'DEFAULT': 'var(--border-radius-md, 0.5rem)',
        'md': 'var(--border-radius-md, 0.5rem)',
        'lg': 'var(--border-radius-lg, 0.75rem)',
        'xl': 'var(--border-radius-xl, 1rem)',
        '2xl': 'var(--border-radius-2xl, 1.5rem)',
        'full': 'var(--border-radius-full, 9999px)',
      },
      boxShadow: {
        'sm': 'var(--shadow-sm, 0 1px 2px 0 rgba(0, 0, 0, 0.05))',
        'DEFAULT': 'var(--shadow-md, 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06))',
        'md': 'var(--shadow-md, 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06))',
        'lg': 'var(--shadow-lg, 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05))',
        'xl': 'var(--shadow-xl, 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04))',
      },
      spacing: {
        'xs': 'var(--spacing-xs, 0.25rem)',
        'sm': 'var(--spacing-sm, 0.5rem)',
        'md': 'var(--spacing-md, 1rem)',
        'lg': 'var(--spacing-lg, 1.5rem)',
        'xl': 'var(--spacing-xl, 2rem)',
        '2xl': 'var(--spacing-2xl, 3rem)',
        '3xl': 'var(--spacing-3xl, 4rem)',
      }
    }
  },
  plugins: []
};

export default config;
