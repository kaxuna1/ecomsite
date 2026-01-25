// CMS API Client
// Fetch CMS page content from backend

import type { CMSPageResponse, GlobalBlock, PageType } from '../types/cms';
import api from './client';
import { API_BASE_URL } from '../utils/apiBaseUrl';

// ============================================================================
// GLOBAL BLOCKS (Promotions/Announcements)
// ============================================================================

export interface GlobalBlocksContext {
  path?: string;
  pageType?: PageType;
  cmsSlug?: string;
}

/**
 * Fetch global blocks for a location (header/footer)
 * These are promotional banners managed via CMS
 */
export async function fetchGlobalBlocks(
  location: 'header' | 'footer',
  lang?: string,
  context?: GlobalBlocksContext
): Promise<GlobalBlock[]> {
  const url = new URL(`${API_BASE_URL}/api/cms/global-blocks`);
  url.searchParams.set('location', location);
  
  if (lang) {
    url.searchParams.set('lang', lang);
  }
  if (context?.path) {
    url.searchParams.set('path', context.path);
  }
  if (context?.pageType) {
    url.searchParams.set('pageType', context.pageType);
  }
  if (context?.cmsSlug) {
    url.searchParams.set('cmsSlug', context.cmsSlug);
  }

  const response = await fetch(url.toString());

  if (!response.ok) {
    // Return empty array on error to fallback gracefully
    console.warn(`Failed to fetch global blocks: ${response.statusText}`);
    return [];
  }

  return response.json();
}

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
