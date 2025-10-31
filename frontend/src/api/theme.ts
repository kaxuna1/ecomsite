// Theme API Client
// RESTful client for theme management

import api from './client';
import type {
  Theme,
  ThemePreset,
  FontLibraryItem,
  CreateThemeInput,
  UpdateThemeInput,
  ThemeListResponse,
  ActiveThemeResponse,
  DesignTokens
} from '../types/theme';

// Re-export types for convenience
export type {
  Theme,
  ThemePreset,
  FontLibraryItem,
  CreateThemeInput,
  UpdateThemeInput,
  ThemeListResponse,
  ActiveThemeResponse,
  DesignTokens
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

/**
 * Get active theme (public endpoint, no auth required)
 */
export async function getActiveTheme(): Promise<Theme> {
  // Use fetch directly for public endpoint to avoid auth headers
  const response = await fetch(`${API_BASE_URL}/api/themes/active`);

  if (!response.ok) {
    throw new Error(`Failed to fetch active theme: ${response.statusText}`);
  }

  const data = await response.json();
  return data.data.theme;
}

/**
 * Get all themes (admin only)
 */
export async function getAllThemes(includeInactive: boolean = false): Promise<ThemeListResponse> {
  const response = await api.get('/themes', {
    params: { include_inactive: includeInactive }
  });
  return response.data.data;
}

/**
 * Get theme by ID (admin only)
 */
export async function getThemeById(id: number): Promise<Theme> {
  const response = await api.get(`/themes/${id}`);
  return response.data.data.theme;
}

/**
 * Create new theme (admin only)
 */
export async function createTheme(input: CreateThemeInput): Promise<Theme> {
  const response = await api.post('/themes', input);
  return response.data.data.theme;
}

/**
 * Update theme (admin only)
 */
export async function updateTheme(id: number, updates: UpdateThemeInput): Promise<Theme> {
  const response = await api.put(`/themes/${id}`, updates);
  return response.data.data.theme;
}

/**
 * Activate theme (admin only)
 */
export async function activateTheme(id: number): Promise<void> {
  await api.patch(`/themes/${id}/activate`);
}

/**
 * Deactivate theme (admin only)
 */
export async function deactivateTheme(id: number): Promise<void> {
  await api.patch(`/themes/${id}/deactivate`);
}

/**
 * Delete theme (admin only)
 */
export async function deleteTheme(id: number): Promise<void> {
  await api.delete(`/themes/${id}`);
}

/**
 * Get theme change history (admin only)
 */
export async function getThemeHistory(
  id: number,
  page: number = 1,
  limit: number = 20
): Promise<any[]> {
  const response = await api.get(`/themes/${id}/history`, {
    params: { page, limit }
  });
  return response.data.data.history;
}

/**
 * Get theme presets (admin only)
 */
export async function getThemePresets(category?: string): Promise<ThemePreset[]> {
  const response = await api.get('/themes/presets/list', {
    params: category ? { category } : undefined
  });
  return response.data.data.presets;
}

/**
 * Get fonts library (public endpoint)
 */
export async function getFonts(category?: string): Promise<FontLibraryItem[]> {
  const response = await fetch(
    `${API_BASE_URL}/api/themes/fonts${category ? `?category=${category}` : ''}`
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch fonts: ${response.statusText}`);
  }

  const data = await response.json();
  return data.data.fonts;
}
