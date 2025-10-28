// CMS API Client
// Fetch CMS page content from backend

import type { CMSPageResponse } from '../types/cms';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

/**
 * Fetch published page content by slug
 */
export async function fetchPage(slug: string): Promise<CMSPageResponse> {
  const response = await fetch(`${API_BASE_URL}/api/cms/pages/${slug}/public`);

  if (!response.ok) {
    throw new Error(`Failed to fetch page: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Fetch homepage content
 */
export async function fetchHomePage(): Promise<CMSPageResponse> {
  return fetchPage('home');
}

/**
 * Fetch published footer settings
 */
export async function fetchPublicFooterSettings(): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/api/cms/footer`);

  if (!response.ok) {
    throw new Error(`Failed to fetch footer settings: ${response.statusText}`);
  }

  return response.json();
}
