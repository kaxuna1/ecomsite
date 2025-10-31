import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PaintBrushIcon,
  CheckCircleIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  SparklesIcon,
  EyeIcon,
  ClockIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  DocumentDuplicateIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import {
  getAllThemes,
  activateTheme,
  deleteTheme,
  createTheme,
  getThemePresets,
  applyThemePreset,
  type Theme,
  type ThemeListResponse,
  type CreateThemeInput,
  type ThemePreset
} from '../../api/theme';
import { useTheme } from '../../context/ThemeContext';
import ThemeEditorModal from '../../components/admin/ThemeEditorModal';
import ThemePreviewModal from '../../components/admin/ThemePreviewModal';

export default function AdminThemes() {
  const queryClient = useQueryClient();
  const { theme: activeTheme, refreshTheme } = useTheme();
  const [selectedTheme, setSelectedTheme] = useState<Theme | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Fetch all themes (including inactive)
  const { data: themesData, isLoading } = useQuery<ThemeListResponse>({
    queryKey: ['admin-themes'],
    queryFn: () => getAllThemes(true),
    staleTime: 2 * 60 * 1000 // 2 minutes
  });

  // Fetch theme presets
  const { data: presets = [], isLoading: isLoadingPresets } = useQuery<ThemePreset[]>({
    queryKey: ['theme-presets'],
    queryFn: () => getThemePresets(),
    staleTime: 5 * 60 * 1000 // 5 minutes
  });

  // Activate theme mutation
  const activateMutation = useMutation({
    mutationFn: (themeId: number) => activateTheme(themeId),
    onSuccess: async () => {
      // Invalidate both admin and public theme queries
      await queryClient.invalidateQueries({ queryKey: ['admin-themes'] });
      await queryClient.invalidateQueries({ queryKey: ['active-theme'] });
      await refreshTheme();
      toast.success('Theme activated successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to activate theme');
    }
  });

  // Delete theme mutation
  const deleteMutation = useMutation({
    mutationFn: (themeId: number) => deleteTheme(themeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-themes'] });
      toast.success('Theme deleted successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete theme');
    }
  });

  const handleActivateTheme = (themeId: number) => {
    activateMutation.mutate(themeId);
  };

  const handleDeleteTheme = (theme: Theme) => {
    if (theme.isSystemTheme) {
      toast.error('Cannot delete system theme');
      return;
    }
    if (theme.isActive) {
      toast.error('Cannot delete active theme');
      return;
    }
    if (confirm(`Are you sure you want to delete "${theme.displayName}"?`)) {
      deleteMutation.mutate(theme.id!);
    }
  };

  const handleEditTheme = (theme: Theme) => {
    setSelectedTheme(theme);
    setShowEditor(true);
  };

  const handlePreviewTheme = (theme: Theme) => {
    setSelectedTheme(theme);
    setShowPreview(true);
  };

  //Export theme as JSON
  const handleExportTheme = (theme: Theme) => {
    const exportData = {
      name: theme.name,
      displayName: theme.displayName,
      description: theme.description,
      tokens: theme.tokens,
      version: theme.version,
      exportedAt: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${theme.name}-theme.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`Theme "${theme.displayName}" exported successfully!`);
  };

  // Import theme from JSON
  const handleImportTheme = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e: any) => {
      const file = e.target?.files?.[0];
      if (!file) return;

      try {
        const text = await file.text();
        const importedTheme = JSON.parse(text);

        // Validate structure
        if (!importedTheme.name || !importedTheme.tokens) {
          toast.error('Invalid theme file format');
          return;
        }

        // Create theme with imported data
        const newName = `${importedTheme.name}-imported-${Date.now()}`;
        const newDisplayName = `${importedTheme.displayName} (Imported)`;

        const themeInput: CreateThemeInput = {
          name: newName,
          displayName: newDisplayName,
          description: importedTheme.description || 'Imported theme',
          tokens: importedTheme.tokens
        };

        await createTheme(themeInput);
        await queryClient.invalidateQueries({ queryKey: ['admin-themes'] });
        toast.success(`Theme "${newDisplayName}" imported successfully!`);
      } catch (error: any) {
        console.error('Import error:', error);
        toast.error('Failed to import theme: ' + (error.message || 'Invalid file'));
      }
    };
    input.click();
  };

  // Duplicate existing theme
  const handleDuplicateTheme = async (theme: Theme) => {
    try {
      const newName = `${theme.name}-copy-${Date.now()}`;
      const newDisplayName = `${theme.displayName} (Copy)`;

      const themeInput: CreateThemeInput = {
        name: newName,
        displayName: newDisplayName,
        description: theme.description ? `${theme.description} (Copy)` : 'Duplicated theme',
        tokens: theme.tokens
      };

      await createTheme(themeInput);
      await queryClient.invalidateQueries({ queryKey: ['admin-themes'] });
      toast.success(`Theme "${newDisplayName}" created successfully!`);
    } catch (error: any) {
      console.error('Duplicate error:', error);
      toast.error('Failed to duplicate theme');
    }
  };

  // Apply preset theme
  const handleApplyPreset = async (preset: ThemePreset) => {
    try {
      const customName = prompt(`Enter a name for your new theme based on "${preset.displayName}":`, `My ${preset.displayName}`);
      if (!customName) return; // User cancelled

      const newName = `${preset.name}-custom-${Date.now()}`;

      const themeInput: CreateThemeInput = {
        name: newName,
        displayName: customName,
        description: preset.description || `Based on ${preset.displayName} preset`,
        tokens: preset.tokens as any
      };

      await createTheme(themeInput);
      await queryClient.invalidateQueries({ queryKey: ['admin-themes'] });
      toast.success(`Theme "${customName}" created from preset!`);
    } catch (error: any) {
      console.error('Apply preset error:', error);
      toast.error('Failed to create theme from preset');
    }
  };

  // Helper to extract primary color for preview
  const getPrimaryColor = (theme: Theme): string => {
    return theme.tokens?.color?.brand?.primary || '#8bba9c';
  };

  const getSecondaryColor = (theme: Theme): string => {
    return theme.tokens?.color?.brand?.secondary || '#e8c7c8';
  };

  const getAccentColor = (theme: Theme): string => {
    return theme.tokens?.color?.brand?.accent || '#d4a574';
  };

  // Helper to extract colors from presets
  const getPresetPrimaryColor = (preset: ThemePreset): string => {
    const tokens = preset.tokens as any;
    return tokens?.color?.brand?.primary || '#8bba9c';
  };

  const getPresetSecondaryColor = (preset: ThemePreset): string => {
    const tokens = preset.tokens as any;
    return tokens?.color?.brand?.secondary || '#e8c7c8';
  };

  const getPresetAccentColor = (preset: ThemePreset): string => {
    const tokens = preset.tokens as any;
    return tokens?.color?.brand?.accent || '#d4a574';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blush"></div>
      </div>
    );
  }

  const themes = themesData?.themes || [];
  const activeThemeInfo = themesData?.activeTheme;

  return (
    <>
      <Helmet>
        <title>Theme Management — Luxia Admin</title>
      </Helmet>

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl text-champagne">Theme Management</h1>
            <p className="mt-1 text-sm text-champagne/70">
              Customize your store's visual identity with themes
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleImportTheme}
              className="flex items-center gap-2 px-5 py-3 bg-white/10 text-champagne border border-white/20 rounded-xl font-semibold hover:bg-white/20 transition-colors"
            >
              <ArrowUpTrayIcon className="h-5 w-5" />
              Import Theme
            </button>
            <button
              onClick={() => {
                setSelectedTheme(null);
                setShowEditor(true);
              }}
              className="flex items-center gap-2 px-6 py-3 bg-blush text-midnight rounded-xl font-semibold hover:bg-blush/90 transition-colors"
            >
              <PlusIcon className="h-5 w-5" />
              Create Theme
            </button>
          </div>
        </div>

        {/* Active Theme Banner */}
        {activeThemeInfo && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-6"
          >
            <div className="flex items-start gap-4">
              <div className="rounded-xl bg-emerald-500/20 p-3">
                <CheckCircleIcon className="h-6 w-6 text-emerald-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-emerald-400 mb-1">
                  Active Theme
                </h3>
                <p className="text-sm text-champagne/80">
                  <span className="font-semibold">{activeThemeInfo.name}</span> is currently powering your storefront
                </p>
              </div>
              {activeTheme && (
                <div className="flex gap-2">
                  <div
                    className="h-10 w-10 rounded-lg border-2 border-white/20"
                    style={{ backgroundColor: getPrimaryColor(activeTheme) }}
                    title="Primary Color"
                  />
                  <div
                    className="h-10 w-10 rounded-lg border-2 border-white/20"
                    style={{ backgroundColor: getSecondaryColor(activeTheme) }}
                    title="Secondary Color"
                  />
                  <div
                    className="h-10 w-10 rounded-lg border-2 border-white/20"
                    style={{ backgroundColor: getAccentColor(activeTheme) }}
                    title="Accent Color"
                  />
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* My Themes Grid */}
        <div>
          <h2 className="text-2xl font-display text-champagne mb-4">My Themes</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence mode="popLayout">
              {themes.map((theme) => (
              <motion.div
                key={theme.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
                className={`rounded-2xl border-2 transition-all ${
                  theme.isActive
                    ? 'border-emerald-500 bg-emerald-500/5'
                    : 'border-white/10 bg-white/5 hover:border-white/20'
                }`}
              >
                {/* Color Preview */}
                <div className="h-32 rounded-t-2xl overflow-hidden relative">
                  <div className="absolute inset-0 flex">
                    <div
                      className="flex-1"
                      style={{ backgroundColor: getPrimaryColor(theme) }}
                    />
                    <div
                      className="flex-1"
                      style={{ backgroundColor: getSecondaryColor(theme) }}
                    />
                    <div
                      className="flex-1"
                      style={{ backgroundColor: getAccentColor(theme) }}
                    />
                  </div>

                  {/* Status Badge */}
                  {theme.isActive && (
                    <div className="absolute top-3 right-3">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500 text-white text-xs font-semibold">
                        <CheckCircleIcon className="h-4 w-4" />
                        Active
                      </span>
                    </div>
                  )}
                  {theme.isSystemTheme && !theme.isActive && (
                    <div className="absolute top-3 right-3">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-500 text-white text-xs font-semibold">
                        <SparklesIcon className="h-4 w-4" />
                        System
                      </span>
                    </div>
                  )}
                </div>

                {/* Theme Info */}
                <div className="p-6 space-y-4">
                  <div>
                    <h3 className="text-lg font-display text-champagne mb-1">
                      {theme.displayName}
                    </h3>
                    {theme.description && (
                      <p className="text-sm text-champagne/60 line-clamp-2">
                        {theme.description}
                      </p>
                    )}
                  </div>

                  {/* Meta Info */}
                  <div className="flex items-center gap-4 text-xs text-champagne/50">
                    <div className="flex items-center gap-1">
                      <ClockIcon className="h-4 w-4" />
                      v{theme.version || 1}
                    </div>
                    {theme.updatedAt && (
                      <div>
                        Updated {new Date(theme.updatedAt).toLocaleDateString()}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="space-y-2 pt-2 border-t border-white/10">
                    {/* Primary Actions Row */}
                    <div className="flex gap-2">
                      {!theme.isActive && (
                        <button
                          onClick={() => handleActivateTheme(theme.id!)}
                          disabled={activateMutation.isPending}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg hover:bg-emerald-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                        >
                          <CheckCircleIcon className="h-4 w-4" />
                          Activate
                        </button>
                      )}
                      <button
                        onClick={() => handlePreviewTheme(theme)}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-white/10 text-champagne border border-white/20 rounded-lg hover:bg-white/20 transition-colors text-sm font-medium"
                      >
                        <EyeIcon className="h-4 w-4" />
                        Preview
                      </button>
                      {theme.isActive && (
                        <button
                          onClick={() => handleEditTheme(theme)}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blush/20 text-blush border border-blush/30 rounded-lg hover:bg-blush/30 transition-colors text-sm font-medium"
                        >
                          <PencilIcon className="h-4 w-4" />
                          Edit
                        </button>
                      )}
                      {!theme.isActive && !theme.isSystemTheme && (
                        <button
                          onClick={() => handleDeleteTheme(theme)}
                          disabled={deleteMutation.isPending}
                          className="px-4 py-2 bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-lg hover:bg-rose-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Delete theme"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      )}
                    </div>

                    {/* Secondary Actions Row - Export & Duplicate */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleExportTheme(theme)}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-lg hover:bg-blue-500/20 transition-colors text-sm"
                        title="Export theme as JSON"
                      >
                        <ArrowDownTrayIcon className="h-4 w-4" />
                        Export
                      </button>
                      <button
                        onClick={() => handleDuplicateTheme(theme)}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-lg hover:bg-purple-500/20 transition-colors text-sm"
                        title="Create a copy of this theme"
                      >
                        <DocumentDuplicateIcon className="h-4 w-4" />
                        Duplicate
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Theme Presets Section */}
        {!isLoadingPresets && presets.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-display text-champagne">Theme Presets</h2>
              <p className="text-sm text-champagne/60">
                Professional pre-built themes ready to use
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence>
                {presets.map((preset) => (
                  <motion.div
                    key={preset.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.2 }}
                    className="rounded-2xl border-2 border-white/10 bg-white/5 hover:border-blush/30 transition-all overflow-hidden"
                  >
                    {/* Color Preview */}
                    <div className="h-32 relative">
                      <div className="absolute inset-0 flex">
                        <div
                          className="flex-1"
                          style={{ backgroundColor: getPresetPrimaryColor(preset) }}
                        />
                        <div
                          className="flex-1"
                          style={{ backgroundColor: getPresetSecondaryColor(preset) }}
                        />
                        <div
                          className="flex-1"
                          style={{ backgroundColor: getPresetAccentColor(preset) }}
                        />
                      </div>

                      {/* Category Badge */}
                      {preset.isFeatured && (
                        <div className="absolute top-3 right-3">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-yellow-500 text-midnight text-xs font-semibold">
                            <SparklesIcon className="h-4 w-4" />
                            Featured
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Preset Info */}
                    <div className="p-6 space-y-4">
                      <div>
                        <h3 className="text-lg font-display text-champagne mb-1">
                          {preset.displayName}
                        </h3>
                        <p className="text-sm text-champagne/60 line-clamp-2">
                          {preset.description}
                        </p>
                      </div>

                      {/* Meta Info */}
                      <div className="flex items-center gap-2 text-xs text-champagne/50">
                        <span className="px-2 py-1 rounded-md bg-white/10 capitalize">
                          {preset.category}
                        </span>
                      </div>

                      {/* Action */}
                      <button
                        onClick={() => handleApplyPreset(preset)}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blush/20 text-blush border border-blush/30 rounded-lg hover:bg-blush/30 transition-colors text-sm font-medium"
                      >
                        <SparklesIcon className="h-4 w-4" />
                        Use This Theme
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* Empty State */}
        {themes.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="rounded-full bg-white/5 p-6 mb-4">
              <PaintBrushIcon className="h-12 w-12 text-champagne/40" />
            </div>
            <h3 className="text-xl font-display text-champagne mb-2">No themes yet</h3>
            <p className="text-champagne/60 text-center max-w-md mb-6">
              Create your first custom theme to personalize your store's appearance
            </p>
            <button
              onClick={() => {
                setSelectedTheme(null);
                setShowEditor(true);
              }}
              className="flex items-center gap-2 px-6 py-3 bg-blush text-midnight rounded-xl font-semibold hover:bg-blush/90 transition-colors"
            >
              <PlusIcon className="h-5 w-5" />
              Create Your First Theme
            </button>
          </div>
        )}
      </div>

      {/* Theme Editor Modal */}
      <ThemeEditorModal
        isOpen={showEditor}
        onClose={() => setShowEditor(false)}
        theme={selectedTheme}
      />

      {/* Theme Preview Modal */}
      <ThemePreviewModal
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        theme={selectedTheme}
        onActivate={selectedTheme && !selectedTheme.isActive ? () => {
          handleActivateTheme(selectedTheme.id!);
          setShowPreview(false);
        } : undefined}
      />
    </>
  );
}
