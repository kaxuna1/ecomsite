// CMS API Client
// Fetch CMS page content from backend

import type { CMSPageResponse } from '../types/cms';
import api from './client';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

/**
 * Fetch published page content by slug
 */
export async function fetchPage(slug: string, lang?: string): Promise<CMSPageResponse> {
  const url = new URL(`${API_BASE_URL}/api/cms/pages/${slug}/public`);
  if (lang) {
    url.searchParams.set('lang', lang);
  }

  const response = await fetch(url.toString());

  if (!response.ok) {
    throw new Error(`Failed to fetch page: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Fetch homepage content
 */
export async function fetchHomePage(lang?: string): Promise<CMSPageResponse> {
  return fetchPage('home', lang);
}

/**
 * Fetch published footer settings
 */
export async function fetchPublicFooterSettings(lang?: string): Promise<any> {
  const url = new URL(`${API_BASE_URL}/api/cms/footer`);
  if (lang) {
    url.searchParams.set('lang', lang);
  }

  const response = await fetch(url.toString());

  if (!response.ok) {
    throw new Error(`Failed to fetch footer settings: ${response.statusText}`);
  }

  return response.json();
}

// ============================================================================
// ADMIN TRANSLATION SYNCHRONIZATION
// ============================================================================

/**
 * Sync all block translations for a page with base content
 * Preserves translatable text, syncs structure/media/styles from base
 */
export async function syncPageBlockTranslations(pageId: number): Promise<{ message: string; updatedCount: number }> {
  const response = await api.post(`/cms/admin/pages/${pageId}/sync-translations`);
  return response.data;
}

/**
 * Sync a specific block translation with base content
 */
export async function syncBlockTranslation(
  blockId: number,
  languageCode: string
): Promise<{ message: string; translation: any }> {
  const response = await api.post(`/cms/admin/blocks/${blockId}/sync-translation/${languageCode}`);
  return response.data;
}
