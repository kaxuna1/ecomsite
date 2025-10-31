import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  XMarkIcon,
  SwatchIcon,
  DocumentTextIcon,
  Square3Stack3DIcon,
  EyeIcon,
  CheckIcon,
  Square2StackIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import ColorPicker from './ColorPicker';
import SaveButton from './SaveButton';
import {
  createTheme,
  updateTheme,
  getFonts,
  type Theme,
  type CreateThemeInput,
  type UpdateThemeInput,
  type FontLibraryItem,
  type DesignTokens
} from '../../api/theme';

interface ThemeEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme?: Theme | null; // null = create new, Theme = edit existing
}

type TabType = 'colors' | 'typography' | 'spacing' | 'borders';

// Default theme tokens for new themes
const DEFAULT_TOKENS: DesignTokens = {
  color: {
    brand: {
      primary: '#8BBA9C',
      secondary: '#E8C7C8',
      accent: '#D4A574'
    },
    semantic: {
      background: {
        primary: '#FFFFFF',
        secondary: '#F8F9FA',
        elevated: '#FFFFFF'
      },
      text: {
        primary: '#1A1A1A',
        secondary: '#6B7280',
        tertiary: '#9CA3AF',
        inverse: '#FFFFFF'
      },
      border: {
        default: '#E5E7EB',
        strong: '#D1D5DB'
      },
      interactive: {
        default: '#8BBA9C',
        hover: '#7AA98B',
        active: '#699879',
        disabled: '#D1D5DB'
      },
      feedback: {
        success: '#10B981',
        warning: '#F59E0B',
        error: '#EF4444',
        info: '#3B82F6'
      }
    }
  },
  typography: {
    fontFamily: {
      display: '"Playfair Display", serif',
      body: '"Inter", sans-serif',
      mono: '"Fira Code", monospace'
    },
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
      '4xl': '2.25rem',
      '5xl': '3rem'
    },
    fontWeight: {
      light: '300',
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700'
    },
    lineHeight: {
      tight: '1.25',
      normal: '1.5',
      relaxed: '1.75'
    },
    letterSpacing: {
      tight: '-0.025em',
      normal: '0',
      wide: '0.025em',
      wider: '0.05em'
    }
  },
  spacing: {
    preset: 'normal',
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '3rem',
    '3xl': '4rem'
  },
  border: {
    width: {
      thin: '1px',
      medium: '2px',
      thick: '4px'
    },
    radius: {
      sm: '0.25rem',
      md: '0.5rem',
      lg: '0.75rem',
      xl: '1rem',
      '2xl': '1.5rem',
      full: '9999px'
    }
  },
  shadow: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
  }
};

export default function ThemeEditorModal({ isOpen, onClose, theme }: ThemeEditorModalProps) {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabType>('colors');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [previewEnabled, setPreviewEnabled] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [description, setDescription] = useState('');
  const [tokens, setTokens] = useState<DesignTokens>(DEFAULT_TOKENS);

  // Fetch fonts
  const { data: fonts = [] } = useQuery<FontLibraryItem[]>({
    queryKey: ['theme-fonts'],
    queryFn: () => getFonts(),
    staleTime: 10 * 60 * 1000 // 10 minutes
  });

  // Initialize form from theme or defaults
  useEffect(() => {
    if (isOpen) {
      if (theme) {
        // Edit existing theme
        setName(theme.name);
        setDisplayName(theme.displayName);
        setDescription(theme.description || '');
        setTokens(theme.tokens);
      } else {
        // Create new theme
        setName('');
        setDisplayName('');
        setDescription('');
        setTokens(DEFAULT_TOKENS);
      }
      setHasUnsavedChanges(false);
      setPreviewEnabled(false);
      setActiveTab('colors');
    }
  }, [isOpen, theme]);

  // Track unsaved changes
  useEffect(() => {
    if (isOpen && theme) {
      const changed =
        name !== theme.name ||
        displayName !== theme.displayName ||
        description !== (theme.description || '') ||
        JSON.stringify(tokens) !== JSON.stringify(theme.tokens);
      setHasUnsavedChanges(changed);
    } else if (isOpen && !theme) {
      const changed =
        name !== '' ||
        displayName !== '' ||
        description !== '' ||
        JSON.stringify(tokens) !== JSON.stringify(DEFAULT_TOKENS);
      setHasUnsavedChanges(changed);
    }
  }, [isOpen, theme, name, displayName, description, tokens]);

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

  // Apply live preview
  useEffect(() => {
    if (!isOpen || !previewEnabled) {
      // Remove preview CSS
      const existingStyle = document.getElementById('theme-preview-variables');
      if (existingStyle) {
        existingStyle.remove();
      }
      return;
    }

    // Inject preview CSS
    const css = generateCSS(tokens);
    let styleElement = document.getElementById('theme-preview-variables') as HTMLStyleElement;

    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = 'theme-preview-variables';
      document.head.appendChild(styleElement);
    }

    styleElement.textContent = css;

    // Cleanup on unmount
    return () => {
      const el = document.getElementById('theme-preview-variables');
      if (el) el.remove();
    };
  }, [isOpen, previewEnabled, tokens, generateCSS]);

  // Create theme mutation
  const createMutation = useMutation({
    mutationFn: (input: CreateThemeInput) => createTheme(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-themes'] });
      toast.success('Theme created successfully!');
      handleClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create theme');
    }
  });

  // Update theme mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: number; updates: UpdateThemeInput }) =>
      updateTheme(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-themes'] });
      queryClient.invalidateQueries({ queryKey: ['active-theme'] });
      toast.success('Theme updated successfully!');
      handleClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update theme');
    }
  });

  // Handle close with unsaved changes check
  const handleClose = () => {
    if (hasUnsavedChanges) {
      if (!confirm('You have unsaved changes. Are you sure you want to close?')) {
        return;
      }
    }
    // Remove preview CSS
    setPreviewEnabled(false);
    const existingStyle = document.getElementById('theme-preview-variables');
    if (existingStyle) existingStyle.remove();
    onClose();
  };

  // Handle save
  const handleSave = () => {
    // Validation
    if (!displayName.trim()) {
      toast.error('Theme name is required');
      return;
    }

    if (!tokens.color.brand.primary) {
      toast.error('Primary brand color is required');
      return;
    }

    // Generate name from displayName if creating new theme
    const themeName = theme ? name : displayName.toLowerCase().replace(/\s+/g, '-');

    if (theme) {
      // Update existing theme
      updateMutation.mutate({
        id: theme.id!,
        updates: {
          displayName,
          description: description || undefined,
          tokens
        }
      });
    } else {
      // Create new theme
      createMutation.mutate({
        name: themeName,
        displayName,
        description: description || undefined,
        tokens
      });
    }
  };

  // Color update handlers
  const updateColor = (path: string, value: string) => {
    setTokens((prev: DesignTokens) => {
      const newTokens = { ...prev };
      const keys = path.split('.');
      let current: any = newTokens;

      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]];
      }

      current[keys[keys.length - 1]] = value;
      return newTokens;
    });
  };

  // Font update handler
  const updateFont = (category: 'display' | 'body' | 'mono', fontFamily: string) => {
    setTokens((prev: DesignTokens) => ({
      ...prev,
      typography: {
        ...prev.typography,
        fontFamily: {
          ...prev.typography.fontFamily,
          [category]: fontFamily
        }
      }
    }));
  };

  // Spacing preset handler
  const updateSpacingPreset = (preset: 'compact' | 'normal' | 'spacious') => {
    setTokens((prev: DesignTokens) => ({
      ...prev,
      spacing: {
        ...prev.spacing,
        preset
      }
    }));
  };

  // Individual spacing value handler
  const updateSpacingValue = (size: string, value: string) => {
    setTokens((prev: DesignTokens) => ({
      ...prev,
      spacing: {
        ...prev.spacing,
        [size]: value
      }
    }));
  };

  // Typography update handlers
  const updateFontSize = (size: string, value: string) => {
    setTokens((prev: DesignTokens) => ({
      ...prev,
      typography: {
        ...prev.typography,
        fontSize: {
          ...prev.typography.fontSize,
          [size]: value
        }
      }
    }));
  };

  const updateFontWeight = (weight: string, value: string) => {
    setTokens((prev: DesignTokens) => ({
      ...prev,
      typography: {
        ...prev.typography,
        fontWeight: {
          ...prev.typography.fontWeight,
          [weight]: value
        }
      }
    }));
  };

  const updateLineHeight = (height: string, value: string) => {
    setTokens((prev: DesignTokens) => ({
      ...prev,
      typography: {
        ...prev.typography,
        lineHeight: {
          ...prev.typography.lineHeight,
          [height]: value
        }
      }
    }));
  };

  // Border & shadow update handlers
  const updateBorderRadius = (size: string, value: string) => {
    setTokens((prev: DesignTokens) => ({
      ...prev,
      border: {
        ...prev.border,
        radius: {
          ...prev.border.radius,
          [size]: value
        }
      }
    }));
  };

  const updateShadow = (size: string, value: string) => {
    setTokens((prev: DesignTokens) => ({
      ...prev,
      shadow: {
        ...prev.shadow,
        [size]: value
      }
    }));
  };

  if (!isOpen) return null;

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-midnight border border-white/20 rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-white/10">
          <div>
            <h2 className="text-2xl font-display text-champagne">
              {theme ? 'Edit Theme' : 'Create New Theme'}
            </h2>
            <p className="text-sm text-champagne/60 mt-1">
              Customize colors, typography, and spacing
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Preview Toggle */}
            <button
              onClick={() => setPreviewEnabled(!previewEnabled)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all ${
                previewEnabled
                  ? 'border-emerald-500 bg-emerald-500/20 text-emerald-400'
                  : 'border-white/20 text-champagne/60 hover:border-white/40 hover:text-champagne'
              }`}
            >
              <EyeIcon className="h-5 w-5" />
              <span className="text-sm font-medium">
                {previewEnabled ? 'Preview Active' : 'Enable Preview'}
              </span>
            </button>
            <button
              onClick={handleClose}
              className="rounded-lg p-2 text-champagne/60 hover:bg-white/10 hover:text-champagne transition-colors"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Basic Info */}
        <div className="px-8 py-6 border-b border-white/10 bg-white/5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="displayName" className="block text-sm font-semibold text-champagne mb-2">
                Theme Name <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="My Custom Theme"
                className="w-full px-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-champagne placeholder-champagne/40 focus:outline-none focus:border-blush focus:ring-2 focus:ring-blush/20"
                required
              />
            </div>
            <div>
              <label htmlFor="description" className="block text-sm font-semibold text-champagne mb-2">
                Description
              </label>
              <input
                type="text"
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="A beautiful theme for..."
                className="w-full px-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-champagne placeholder-champagne/40 focus:outline-none focus:border-blush focus:ring-2 focus:ring-blush/20"
              />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 px-8 pt-6 border-b border-white/10">
          {[
            { id: 'colors', label: 'Colors', icon: SwatchIcon },
            { id: 'typography', label: 'Typography', icon: DocumentTextIcon },
            { id: 'borders', label: 'Borders & Shadows', icon: Square2StackIcon },
            { id: 'spacing', label: 'Spacing', icon: Square3Stack3DIcon }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`relative flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'text-champagne'
                    : 'text-champagne/50 hover:text-champagne/80'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="activeEditorTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-blush"
                    transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto px-8 py-6">
          <AnimatePresence mode="wait">
            {/* Colors Tab */}
            {activeTab === 'colors' && (
              <motion.div
                key="colors"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-8"
              >
                {/* Brand Colors */}
                <div>
                  <h3 className="text-lg font-display text-champagne mb-4 flex items-center gap-2">
                    <SwatchIcon className="h-5 w-5" />
                    Brand Colors
                  </h3>
                  <div className="space-y-6">
                    <ColorPicker
                      label="Primary Color"
                      value={tokens.color.brand.primary}
                      onChange={(value) => updateColor('color.brand.primary', value)}
                      description="Main brand color used for primary actions and highlights"
                      required
                    />
                    <ColorPicker
                      label="Secondary Color"
                      value={tokens.color.brand.secondary}
                      onChange={(value) => updateColor('color.brand.secondary', value)}
                      description="Supporting brand color for accents and secondary elements"
                      required
                    />
                    <ColorPicker
                      label="Accent Color"
                      value={tokens.color.brand.accent}
                      onChange={(value) => updateColor('color.brand.accent', value)}
                      description="Additional accent color for special emphasis"
                      required
                    />
                  </div>
                </div>

                {/* Background Colors */}
                <div className="border-t border-white/10 pt-8">
                  <h3 className="text-lg font-display text-champagne mb-4">Background Colors</h3>
                  <p className="text-sm text-champagne/60 mb-6">
                    Set the background colors for different surfaces and elevation levels
                  </p>
                  <div className="space-y-6">
                    <ColorPicker
                      label="Primary Background"
                      value={tokens.color.semantic.background.primary}
                      onChange={(value) => updateColor('color.semantic.background.primary', value)}
                      description="Main background color for the page"
                    />
                    <ColorPicker
                      label="Secondary Background"
                      value={tokens.color.semantic.background.secondary}
                      onChange={(value) => updateColor('color.semantic.background.secondary', value)}
                      description="Alternate background for sections and cards"
                    />
                    <ColorPicker
                      label="Elevated Background"
                      value={tokens.color.semantic.background.elevated}
                      onChange={(value) => updateColor('color.semantic.background.elevated', value)}
                      description="Background for elevated elements like modals and dropdowns"
                    />
                  </div>
                </div>

                {/* Text Colors */}
                <div className="border-t border-white/10 pt-8">
                  <h3 className="text-lg font-display text-champagne mb-4">Text Colors</h3>
                  <p className="text-sm text-champagne/60 mb-6">
                    Configure text colors for different hierarchy levels
                  </p>
                  <div className="space-y-6">
                    <ColorPicker
                      label="Primary Text"
                      value={tokens.color.semantic.text.primary}
                      onChange={(value) => updateColor('color.semantic.text.primary', value)}
                      description="Main text color for headings and body text"
                    />
                    <ColorPicker
                      label="Secondary Text"
                      value={tokens.color.semantic.text.secondary}
                      onChange={(value) => updateColor('color.semantic.text.secondary', value)}
                      description="Text color for labels and supporting text"
                    />
                    <ColorPicker
                      label="Tertiary Text"
                      value={tokens.color.semantic.text.tertiary}
                      onChange={(value) => updateColor('color.semantic.text.tertiary', value)}
                      description="Muted text color for hints and placeholders"
                    />
                    <ColorPicker
                      label="Inverse Text"
                      value={tokens.color.semantic.text.inverse}
                      onChange={(value) => updateColor('color.semantic.text.inverse', value)}
                      description="Text color for dark backgrounds (usually white)"
                    />
                  </div>
                </div>

                {/* Border Colors */}
                <div className="border-t border-white/10 pt-8">
                  <h3 className="text-lg font-display text-champagne mb-4">Border Colors</h3>
                  <p className="text-sm text-champagne/60 mb-6">
                    Set border colors for inputs, cards, and dividers
                  </p>
                  <div className="space-y-6">
                    <ColorPicker
                      label="Default Border"
                      value={tokens.color.semantic.border.default}
                      onChange={(value) => updateColor('color.semantic.border.default', value)}
                      description="Standard border color for UI elements"
                    />
                    <ColorPicker
                      label="Strong Border"
                      value={tokens.color.semantic.border.strong}
                      onChange={(value) => updateColor('color.semantic.border.strong', value)}
                      description="Emphasized border for focused or active states"
                    />
                  </div>
                </div>

                {/* Interactive Colors */}
                <div className="border-t border-white/10 pt-8">
                  <h3 className="text-lg font-display text-champagne mb-4">Interactive Colors</h3>
                  <p className="text-sm text-champagne/60 mb-6">
                    Configure colors for interactive elements and their states
                  </p>
                  <div className="space-y-6">
                    <ColorPicker
                      label="Default Interactive"
                      value={tokens.color.semantic.interactive.default}
                      onChange={(value) => updateColor('color.semantic.interactive.default', value)}
                      description="Default color for links and interactive elements"
                    />
                    <ColorPicker
                      label="Hover State"
                      value={tokens.color.semantic.interactive.hover}
                      onChange={(value) => updateColor('color.semantic.interactive.hover', value)}
                      description="Color when hovering over interactive elements"
                    />
                    <ColorPicker
                      label="Active State"
                      value={tokens.color.semantic.interactive.active}
                      onChange={(value) => updateColor('color.semantic.interactive.active', value)}
                      description="Color when clicking or selecting interactive elements"
                    />
                    <ColorPicker
                      label="Disabled State"
                      value={tokens.color.semantic.interactive.disabled}
                      onChange={(value) => updateColor('color.semantic.interactive.disabled', value)}
                      description="Color for disabled or unavailable interactive elements"
                    />
                  </div>
                </div>

                {/* Feedback Colors */}
                <div className="border-t border-white/10 pt-8">
                  <h3 className="text-lg font-display text-champagne mb-4">Feedback Colors</h3>
                  <p className="text-sm text-champagne/60 mb-6">
                    Set colors for success, warning, error, and info messages
                  </p>
                  <div className="space-y-6">
                    <ColorPicker
                      label="Success Color"
                      value={tokens.color.semantic.feedback.success}
                      onChange={(value) => updateColor('color.semantic.feedback.success', value)}
                      description="Color for success messages and positive feedback"
                    />
                    <ColorPicker
                      label="Warning Color"
                      value={tokens.color.semantic.feedback.warning}
                      onChange={(value) => updateColor('color.semantic.feedback.warning', value)}
                      description="Color for warnings and caution messages"
                    />
                    <ColorPicker
                      label="Error Color"
                      value={tokens.color.semantic.feedback.error}
                      onChange={(value) => updateColor('color.semantic.feedback.error', value)}
                      description="Color for errors and critical messages"
                    />
                    <ColorPicker
                      label="Info Color"
                      value={tokens.color.semantic.feedback.info}
                      onChange={(value) => updateColor('color.semantic.feedback.info', value)}
                      description="Color for informational messages and tips"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* Typography Tab */}
            {activeTab === 'typography' && (
              <motion.div
                key="typography"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-8"
              >
                {/* Font Families */}
                <div>
                  <h3 className="text-lg font-display text-champagne mb-4">Font Families</h3>
                  <div className="space-y-6">
                    {/* Display Font */}
                    <div>
                      <label className="block text-sm font-semibold text-champagne mb-3">
                        Display Font (Headings)
                      </label>
                      <select
                        value={tokens.typography.fontFamily.display}
                        onChange={(e) => updateFont('display', e.target.value)}
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-champagne focus:outline-none focus:border-blush focus:ring-2 focus:ring-blush/20"
                      >
                        {fonts.filter((f) => ['serif', 'display'].includes(f.category)).map((font) => (
                          <option key={font.id} value={`"${font.name}", ${font.category}`}>
                            {font.displayName}
                          </option>
                        ))}
                      </select>
                      <p className="text-sm text-champagne/60 mt-2">
                        Used for headlines and display text
                      </p>
                    </div>

                    {/* Body Font */}
                    <div>
                      <label className="block text-sm font-semibold text-champagne mb-3">
                        Body Font
                      </label>
                      <select
                        value={tokens.typography.fontFamily.body}
                        onChange={(e) => updateFont('body', e.target.value)}
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-champagne focus:outline-none focus:border-blush focus:ring-2 focus:ring-blush/20"
                      >
                        {fonts.filter((f) => f.category === 'sans-serif').map((font) => (
                          <option key={font.id} value={`"${font.name}", sans-serif`}>
                            {font.displayName}
                          </option>
                        ))}
                      </select>
                      <p className="text-sm text-champagne/60 mt-2">
                        Used for body text and UI elements
                      </p>
                    </div>

                    {/* Mono Font */}
                    <div>
                      <label className="block text-sm font-semibold text-champagne mb-3">
                        Monospace Font
                      </label>
                      <select
                        value={tokens.typography.fontFamily.mono}
                        onChange={(e) => updateFont('mono', e.target.value)}
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-champagne focus:outline-none focus:border-blush focus:ring-2 focus:ring-blush/20"
                      >
                        {fonts.filter((f) => f.category === 'monospace').map((font) => (
                          <option key={font.id} value={`"${font.name}", monospace`}>
                            {font.displayName}
                          </option>
                        ))}
                      </select>
                      <p className="text-sm text-champagne/60 mt-2">
                        Used for code and technical text
                      </p>
                    </div>
                  </div>
                </div>

                {/* Font Sizes */}
                <div className="border-t border-white/10 pt-8">
                  <h3 className="text-lg font-display text-champagne mb-4">Font Sizes</h3>
                  <p className="text-sm text-champagne/60 mb-6">
                    Customize the type scale for different text sizes
                  </p>
                  <div className="grid grid-cols-2 gap-6">
                    {Object.entries(tokens.typography.fontSize).map(([key, value]) => (
                      <div key={key}>
                        <label className="block text-sm font-medium text-champagne mb-2">
                          {key.toUpperCase()} - {value}
                        </label>
                        <input
                          type="range"
                          min="0.5"
                          max="8"
                          step="0.125"
                          value={parseFloat(value)}
                          onChange={(e) => updateFontSize(key, `${e.target.value}rem`)}
                          className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer accent-blush"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Font Weights */}
                <div className="border-t border-white/10 pt-8">
                  <h3 className="text-lg font-display text-champagne mb-4">Font Weights</h3>
                  <p className="text-sm text-champagne/60 mb-6">
                    Set font weight values for different emphasis levels
                  </p>
                  <div className="grid grid-cols-2 gap-6">
                    {Object.entries(tokens.typography.fontWeight).map(([key, value]) => (
                      <div key={key}>
                        <label className="block text-sm font-medium text-champagne mb-2 capitalize">
                          {key}
                        </label>
                        <select
                          value={value}
                          onChange={(e) => updateFontWeight(key, e.target.value)}
                          className="w-full px-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-champagne focus:outline-none focus:border-blush focus:ring-2 focus:ring-blush/20"
                        >
                          <option value="100">100 - Thin</option>
                          <option value="200">200 - Extra Light</option>
                          <option value="300">300 - Light</option>
                          <option value="400">400 - Normal</option>
                          <option value="500">500 - Medium</option>
                          <option value="600">600 - Semibold</option>
                          <option value="700">700 - Bold</option>
                          <option value="800">800 - Extra Bold</option>
                          <option value="900">900 - Black</option>
                        </select>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Line Heights */}
                <div className="border-t border-white/10 pt-8">
                  <h3 className="text-lg font-display text-champagne mb-4">Line Heights</h3>
                  <p className="text-sm text-champagne/60 mb-6">
                    Adjust line spacing for optimal readability
                  </p>
                  <div className="grid grid-cols-3 gap-6">
                    {Object.entries(tokens.typography.lineHeight).map(([key, value]) => (
                      <div key={key}>
                        <label className="block text-sm font-medium text-champagne mb-2 capitalize">
                          {key} - {value}
                        </label>
                        <input
                          type="range"
                          min="1"
                          max="2.5"
                          step="0.05"
                          value={parseFloat(value)}
                          onChange={(e) => updateLineHeight(key, e.target.value)}
                          className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer accent-blush"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Borders & Shadows Tab */}
            {activeTab === 'borders' && (
              <motion.div
                key="borders"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-8"
              >
                {/* Border Radius */}
                <div>
                  <h3 className="text-lg font-display text-champagne mb-4">Border Radius</h3>
                  <p className="text-sm text-champagne/60 mb-6">
                    Set rounded corners for buttons, cards, and UI elements
                  </p>
                  <div className="grid grid-cols-2 gap-6">
                    {Object.entries(tokens.border.radius).map(([key, value]) => (
                      <div key={key}>
                        <label className="block text-sm font-medium text-champagne mb-2">
                          {key.toUpperCase()} - {value}
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="3"
                          step="0.125"
                          value={key === 'full' ? 9999 : parseFloat(value)}
                          onChange={(e) => updateBorderRadius(key, key === 'full' ? '9999px' : `${e.target.value}rem`)}
                          disabled={key === 'full'}
                          className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer accent-blush disabled:opacity-50"
                        />
                        <div className="mt-3 h-12 rounded-[--border] border-2 border-white/40 bg-white/10" style={{ '--border': value } as React.CSSProperties}></div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Shadow Presets */}
                <div className="border-t border-white/10 pt-8">
                  <h3 className="text-lg font-display text-champagne mb-4">Shadow Presets</h3>
                  <p className="text-sm text-champagne/60 mb-6">
                    Configure drop shadows for elevation and depth
                  </p>
                  <div className="space-y-6">
                    {Object.entries(tokens.shadow).map(([key, value]) => (
                      <div key={key}>
                        <label className="block text-sm font-medium text-champagne mb-3 capitalize">
                          {key.toUpperCase()} Shadow
                        </label>
                        <div className="flex items-center gap-4">
                          <div className="flex-1">
                            <input
                              type="text"
                              value={value}
                              onChange={(e) => updateShadow(key, e.target.value)}
                              placeholder="0 4px 6px rgba(0,0,0,0.1)"
                              className="w-full px-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-champagne placeholder-champagne/40 focus:outline-none focus:border-blush focus:ring-2 focus:ring-blush/20 font-mono text-sm"
                            />
                          </div>
                          <div
                            className="w-20 h-20 rounded-xl bg-white/10 border border-white/20"
                            style={{ boxShadow: value }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Spacing Tab */}
            {activeTab === 'spacing' && (
              <motion.div
                key="spacing"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-8"
              >
                {/* Spacing Preset */}
                <div>
                  <h3 className="text-lg font-display text-champagne mb-4">Spacing Preset</h3>
                  <p className="text-sm text-champagne/60 mb-6">
                    Choose the overall spacing density for your theme
                  </p>
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { value: 'compact', label: 'Compact', description: 'Tight spacing for dense layouts' },
                      { value: 'normal', label: 'Normal', description: 'Balanced spacing (recommended)' },
                      { value: 'spacious', label: 'Spacious', description: 'Generous spacing for breathing room' }
                    ].map((preset) => (
                      <button
                        key={preset.value}
                        onClick={() => updateSpacingPreset(preset.value as any)}
                        className={`relative flex flex-col items-center p-6 rounded-xl border-2 transition-all ${
                          tokens.spacing.preset === preset.value
                            ? 'border-blush bg-blush/10 text-blush'
                            : 'border-white/20 text-champagne/60 hover:border-white/40'
                        }`}
                      >
                        {tokens.spacing.preset === preset.value && (
                          <div className="absolute top-3 right-3">
                            <CheckIcon className="h-5 w-5 text-blush" />
                          </div>
                        )}
                        <div className="text-3xl mb-3">
                          {preset.value === 'compact' && '📏'}
                          {preset.value === 'normal' && '📐'}
                          {preset.value === 'spacious' && '📊'}
                        </div>
                        <div className="font-semibold mb-1">{preset.label}</div>
                        <div className="text-xs opacity-70 text-center">{preset.description}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Individual Spacing Values */}
                <div className="border-t border-white/10 pt-8">
                  <h3 className="text-lg font-display text-champagne mb-4">Custom Spacing Values</h3>
                  <p className="text-sm text-champagne/60 mb-6">
                    Fine-tune individual spacing values for precise control
                  </p>
                  <div className="grid grid-cols-2 gap-6">
                    {Object.entries(tokens.spacing)
                      .filter(([key]) => key !== 'preset')
                      .map(([key, value]) => (
                        <div key={key}>
                          <label className="block text-sm font-medium text-champagne mb-2">
                            {key.toUpperCase()} - {value}
                          </label>
                          <input
                            type="range"
                            min="0"
                            max="8"
                            step="0.25"
                            value={parseFloat(value)}
                            onChange={(e) => updateSpacingValue(key, `${e.target.value}rem`)}
                            className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer accent-blush"
                          />
                        </div>
                      ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-8 py-6 border-t border-white/10 bg-white/5">
          <div className="text-sm text-champagne/60">
            {hasUnsavedChanges && '• Unsaved changes'}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleClose}
              disabled={isLoading}
              className="px-6 py-2.5 rounded-xl border border-white/20 text-champagne hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <SaveButton
              onClick={handleSave}
              isLoading={isLoading}
              isSuccess={false}
              loadingText="Saving..."
              successText="Saved!"
              disabled={!displayName.trim() || !tokens.color.brand.primary}
            >
              {theme ? 'Update Theme' : 'Create Theme'}
            </SaveButton>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
