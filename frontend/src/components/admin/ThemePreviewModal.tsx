import React, { useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon, CheckCircleIcon, ShoppingCartIcon, HeartIcon, StarIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import type { Theme, DesignTokens } from '../../types/theme';

interface ThemePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: Theme | null;
  onActivate?: () => void;
}

export default function ThemePreviewModal({ isOpen, onClose, theme, onActivate }: ThemePreviewModalProps) {
  // Generate CSS from tokens for preview
  const generateCSS = useCallback((designTokens: DesignTokens): string => {
    const cssVars: string[] = [':root {'];

    const flatten = (obj: Record<string, any>, prefix: string = '') => {
      for (const [key, value] of Object.entries(obj)) {
        const cssKey = prefix ? `${prefix}-${key}` : key;

        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          if ('value' in value) {
            cssVars.push(`  --${cssKey}: ${value.value} !important;`);
          } else {
            flatten(value, cssKey);
          }
        } else if (typeof value === 'string') {
          cssVars.push(`  --${cssKey}: ${value} !important;`);
        }
      }
    };

    flatten(designTokens);
    cssVars.push('}');

    return cssVars.join('\n');
  }, []);

  // Apply theme CSS when modal opens
  useEffect(() => {
    if (!isOpen || !theme) {
      // Remove preview CSS when modal closes
      const existingStyle = document.getElementById('theme-full-preview-variables');
      if (existingStyle) {
        existingStyle.remove();
      }
      return;
    }

    // Inject theme CSS
    const css = generateCSS(theme.tokens);
    let styleElement = document.getElementById('theme-full-preview-variables') as HTMLStyleElement;

    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = 'theme-full-preview-variables';
      document.head.appendChild(styleElement);
    }

    styleElement.textContent = css;

    // Cleanup on unmount
    return () => {
      const el = document.getElementById('theme-full-preview-variables');
      if (el) el.remove();
    };
  }, [isOpen, theme, generateCSS]);

  if (!isOpen || !theme) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[60] p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-midnight border border-white/20 rounded-2xl w-full max-w-7xl max-h-[95vh] overflow-hidden flex flex-col shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-white/10 bg-white/5">
          <div>
            <h2 className="text-2xl font-display text-champagne">
              Theme Preview: {theme.displayName}
            </h2>
            <p className="text-sm text-champagne/60 mt-1">
              {theme.description || 'Preview how this theme looks with sample UI components'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {onActivate && !theme.isActive && (
              <button
                onClick={onActivate}
                className="flex items-center gap-2 px-6 py-3 bg-emerald-500 text-white rounded-xl font-semibold hover:bg-emerald-600 transition-colors"
              >
                <CheckCircleIcon className="h-5 w-5" />
                Activate This Theme
              </button>
            )}
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-champagne/60 hover:bg-white/10 hover:text-champagne transition-colors"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Preview Content - Scrollable */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-8 space-y-12">
            {/* Typography Showcase */}
            <section>
              <h3 className="text-xl font-display text-champagne mb-6 pb-2 border-b border-white/10">
                Typography
              </h3>
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-champagne/50 mb-2">Display / Heading 1</p>
                  <h1 className="text-5xl font-display" style={{ color: 'var(--color-semantic-text-primary)' }}>
                    The Quick Brown Fox
                  </h1>
                </div>
                <div>
                  <p className="text-xs text-champagne/50 mb-2">Heading 2</p>
                  <h2 className="text-3xl font-display" style={{ color: 'var(--color-semantic-text-primary)' }}>
                    Jumps Over The Lazy Dog
                  </h2>
                </div>
                <div>
                  <p className="text-xs text-champagne/50 mb-2">Body Text</p>
                  <p className="text-base" style={{ color: 'var(--color-semantic-text-secondary)' }}>
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.
                  </p>
                </div>
                <div>
                  <p className="text-xs text-champagne/50 mb-2">Small Text</p>
                  <p className="text-sm" style={{ color: 'var(--color-semantic-text-tertiary)' }}>
                    This is smaller supporting text that provides additional context or information.
                  </p>
                </div>
              </div>
            </section>

            {/* Color Palette */}
            <section>
              <h3 className="text-xl font-display text-champagne mb-6 pb-2 border-b border-white/10">
                Color Palette
              </h3>
              <div className="grid grid-cols-3 gap-4">
                {/* Brand Colors */}
                <div>
                  <p className="text-xs text-champagne/50 mb-3">Brand Colors</p>
                  <div className="space-y-2">
                    <div className="h-16 rounded-lg" style={{ backgroundColor: 'var(--color-brand-primary)' }}></div>
                    <div className="h-16 rounded-lg" style={{ backgroundColor: 'var(--color-brand-secondary)' }}></div>
                    <div className="h-16 rounded-lg" style={{ backgroundColor: 'var(--color-brand-accent)' }}></div>
                  </div>
                </div>
                {/* Background Colors */}
                <div>
                  <p className="text-xs text-champagne/50 mb-3">Backgrounds</p>
                  <div className="space-y-2">
                    <div className="h-16 rounded-lg border-2" style={{
                      backgroundColor: 'var(--color-semantic-background-primary)',
                      borderColor: 'var(--color-semantic-border-default)'
                    }}></div>
                    <div className="h-16 rounded-lg border-2" style={{
                      backgroundColor: 'var(--color-semantic-background-secondary)',
                      borderColor: 'var(--color-semantic-border-default)'
                    }}></div>
                    <div className="h-16 rounded-lg border-2" style={{
                      backgroundColor: 'var(--color-semantic-background-elevated)',
                      borderColor: 'var(--color-semantic-border-default)'
                    }}></div>
                  </div>
                </div>
                {/* Feedback Colors */}
                <div>
                  <p className="text-xs text-champagne/50 mb-3">Feedback</p>
                  <div className="space-y-2">
                    <div className="h-12 rounded-lg flex items-center justify-center text-sm font-medium" style={{
                      backgroundColor: 'var(--color-semantic-feedback-success)',
                      color: 'var(--color-semantic-text-inverse)'
                    }}>Success</div>
                    <div className="h-12 rounded-lg flex items-center justify-center text-sm font-medium" style={{
                      backgroundColor: 'var(--color-semantic-feedback-warning)',
                      color: 'var(--color-semantic-text-inverse)'
                    }}>Warning</div>
                    <div className="h-12 rounded-lg flex items-center justify-center text-sm font-medium" style={{
                      backgroundColor: 'var(--color-semantic-feedback-error)',
                      color: 'var(--color-semantic-text-inverse)'
                    }}>Error</div>
                    <div className="h-12 rounded-lg flex items-center justify-center text-sm font-medium" style={{
                      backgroundColor: 'var(--color-semantic-feedback-info)',
                      color: 'var(--color-semantic-text-inverse)'
                    }}>Info</div>
                  </div>
                </div>
              </div>
            </section>

            {/* Buttons */}
            <section>
              <h3 className="text-xl font-display text-champagne mb-6 pb-2 border-b border-white/10">
                Buttons
              </h3>
              <div className="flex flex-wrap gap-4">
                <button
                  className="px-6 py-3 rounded-lg font-semibold transition-colors"
                  style={{
                    backgroundColor: 'var(--color-brand-primary)',
                    color: 'var(--color-semantic-text-inverse)',
                    borderRadius: 'var(--border-radius-lg)'
                  }}
                >
                  Primary Button
                </button>
                <button
                  className="px-6 py-3 rounded-lg font-semibold border-2 transition-colors"
                  style={{
                    backgroundColor: 'transparent',
                    color: 'var(--color-brand-primary)',
                    borderColor: 'var(--color-brand-primary)',
                    borderRadius: 'var(--border-radius-lg)'
                  }}
                >
                  Secondary Button
                </button>
                <button
                  className="px-6 py-3 rounded-lg font-semibold transition-colors"
                  style={{
                    backgroundColor: 'var(--color-semantic-interactive-disabled)',
                    color: 'var(--color-semantic-text-tertiary)',
                    borderRadius: 'var(--border-radius-lg)',
                    cursor: 'not-allowed'
                  }}
                  disabled
                >
                  Disabled Button
                </button>
              </div>
            </section>

            {/* Cards */}
            <section>
              <h3 className="text-xl font-display text-champagne mb-6 pb-2 border-b border-white/10">
                Cards & Components
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Product Card Example */}
                <div
                  className="rounded-xl overflow-hidden transition-all hover:scale-105"
                  style={{
                    backgroundColor: 'var(--color-semantic-background-elevated)',
                    borderRadius: 'var(--border-radius-xl)',
                    boxShadow: 'var(--shadow-md)'
                  }}
                >
                  <div className="h-48 flex items-center justify-center" style={{ backgroundColor: 'var(--color-brand-secondary)' }}>
                    <ShoppingCartIcon className="h-16 w-16" style={{ color: 'var(--color-semantic-text-inverse)' }} />
                  </div>
                  <div className="p-4 space-y-2">
                    <h4 className="font-semibold" style={{ color: 'var(--color-semantic-text-primary)' }}>
                      Sample Product
                    </h4>
                    <p className="text-sm" style={{ color: 'var(--color-semantic-text-secondary)' }}>
                      A beautiful product description goes here with details.
                    </p>
                    <div className="flex items-center justify-between pt-2">
                      <span className="text-lg font-bold" style={{ color: 'var(--color-brand-primary)' }}>
                        $49.99
                      </span>
                      <button
                        className="p-2 rounded-full transition-colors"
                        style={{
                          backgroundColor: 'var(--color-brand-primary)',
                          color: 'var(--color-semantic-text-inverse)'
                        }}
                      >
                        <HeartIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Review Card */}
                <div
                  className="rounded-xl p-6 space-y-3"
                  style={{
                    backgroundColor: 'var(--color-semantic-background-secondary)',
                    borderRadius: 'var(--border-radius-xl)',
                    border: '1px solid var(--color-semantic-border-default)'
                  }}
                >
                  <div className="flex items-center gap-2">
                    {[...Array(5)].map((_, i) => (
                      <StarIcon
                        key={i}
                        className="h-5 w-5"
                        style={{
                          color: i < 4 ? 'var(--color-semantic-feedback-warning)' : 'var(--color-semantic-border-default)',
                          fill: i < 4 ? 'var(--color-semantic-feedback-warning)' : 'none'
                        }}
                      />
                    ))}
                  </div>
                  <p className="text-sm" style={{ color: 'var(--color-semantic-text-secondary)' }}>
                    "Excellent product! Highly recommend to anyone looking for quality."
                  </p>
                  <p className="text-xs font-medium" style={{ color: 'var(--color-semantic-text-tertiary)' }}>
                    — Customer Name
                  </p>
                </div>

                {/* Info Card */}
                <div
                  className="rounded-xl p-6"
                  style={{
                    backgroundColor: 'var(--color-semantic-feedback-info)',
                    color: 'var(--color-semantic-text-inverse)',
                    borderRadius: 'var(--border-radius-xl)'
                  }}
                >
                  <h4 className="font-semibold mb-2">
                    Information
                  </h4>
                  <p className="text-sm opacity-90">
                    This is an informational card showing how info feedback colors work in the theme.
                  </p>
                </div>
              </div>
            </section>

            {/* Forms */}
            <section>
              <h3 className="text-xl font-display text-champagne mb-6 pb-2 border-b border-white/10">
                Form Elements
              </h3>
              <div className="max-w-2xl space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-semantic-text-primary)' }}>
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="you@example.com"
                    className="w-full px-4 py-3 rounded-lg transition-colors"
                    style={{
                      backgroundColor: 'var(--color-semantic-background-primary)',
                      border: '2px solid var(--color-semantic-border-default)',
                      color: 'var(--color-semantic-text-primary)',
                      borderRadius: 'var(--border-radius-lg)'
                    }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-semantic-text-primary)' }}>
                    Message
                  </label>
                  <textarea
                    placeholder="Your message here..."
                    rows={4}
                    className="w-full px-4 py-3 rounded-lg transition-colors"
                    style={{
                      backgroundColor: 'var(--color-semantic-background-primary)',
                      border: '2px solid var(--color-semantic-border-default)',
                      color: 'var(--color-semantic-text-primary)',
                      borderRadius: 'var(--border-radius-lg)'
                    }}
                  />
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="preview-checkbox"
                    className="w-5 h-5 rounded cursor-pointer"
                    style={{
                      accentColor: 'var(--color-brand-primary)',
                      borderRadius: 'var(--border-radius-sm)'
                    }}
                  />
                  <label htmlFor="preview-checkbox" className="text-sm cursor-pointer" style={{ color: 'var(--color-semantic-text-secondary)' }}>
                    I agree to the terms and conditions
                  </label>
                </div>
              </div>
            </section>

            {/* Border Radius Examples */}
            <section>
              <h3 className="text-xl font-display text-champagne mb-6 pb-2 border-b border-white/10">
                Border Radius
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {['sm', 'md', 'lg', 'xl'].map((size) => (
                  <div key={size} className="text-center">
                    <div
                      className="h-24 mb-2 flex items-center justify-center font-medium"
                      style={{
                        backgroundColor: 'var(--color-brand-primary)',
                        color: 'var(--color-semantic-text-inverse)',
                        borderRadius: `var(--border-radius-${size})`
                      }}
                    >
                      {size.toUpperCase()}
                    </div>
                    <p className="text-xs" style={{ color: 'var(--color-semantic-text-tertiary)' }}>
                      {size} radius
                    </p>
                  </div>
                ))}
              </div>
            </section>

            {/* Shadows */}
            <section>
              <h3 className="text-xl font-display text-champagne mb-6 pb-2 border-b border-white/10">
                Shadows
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {['sm', 'md', 'lg', 'xl'].map((size) => (
                  <div key={size} className="text-center">
                    <div
                      className="h-24 mb-3 rounded-xl flex items-center justify-center font-medium"
                      style={{
                        backgroundColor: 'var(--color-semantic-background-elevated)',
                        color: 'var(--color-semantic-text-primary)',
                        boxShadow: `var(--shadow-${size})`
                      }}
                    >
                      {size.toUpperCase()}
                    </div>
                    <p className="text-xs" style={{ color: 'var(--color-semantic-text-tertiary)' }}>
                      {size} shadow
                    </p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-4 border-t border-white/10 bg-white/5">
          <p className="text-sm text-center" style={{ color: 'var(--color-semantic-text-tertiary)' }}>
            This preview shows how the theme looks with various UI components. Activate to apply to your entire store.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
