// CMS Admin API Client
// Admin-only API calls for CMS management

import api from './client';

export interface CMSPage {
  id: number;
  slug: string;
  title: string;
  metaDescription: string | null;
  metaKeywords: string | null;
  isPublished: boolean;
  publishedAt: string | null;
  createdBy: number;
  createdAt: string;
  updatedAt: string;
}

export interface CMSBlock {
  id: number;
  pageId: number;
  blockKey: string;
  blockType: string;
  displayOrder: number;
  isEnabled: boolean;
  content: any;
  settings: any;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePagePayload {
  slug: string;
  title: string;
  metaDescription?: string;
  metaKeywords?: string;
  isPublished?: boolean;
}

export interface UpdatePagePayload {
  slug?: string;
  title?: string;
  metaDescription?: string;
  metaKeywords?: string;
  isPublished?: boolean;
}

export interface CreateBlockPayload {
  pageId: number;
  blockType: string;
  blockKey: string;
  displayOrder: number;
  content: any;
  settings?: any;
  isEnabled?: boolean;
}

export interface UpdateBlockPayload {
  blockType?: string;
  blockKey?: string;
  displayOrder?: number;
  content?: any;
  settings?: any;
  isEnabled?: boolean;
}

// ============================================================================
// PAGE MANAGEMENT
// ============================================================================

/**
 * Fetch all CMS pages
 */
export async function fetchCMSPages(): Promise<CMSPage[]> {
  const response = await api.get<CMSPage[]>('/cms/pages');
  return response.data;
}

/**
 * Fetch a single page by ID
 */
export async function fetchCMSPage(pageId: number): Promise<CMSPage> {
  const response = await api.get<CMSPage>(`/cms/pages/${pageId}`);
  return response.data;
}

/**
 * Create a new CMS page
 */
export async function createCMSPage(payload: CreatePagePayload): Promise<CMSPage> {
  const response = await api.post<CMSPage>('/cms/pages', payload);
  return response.data;
}

/**
 * Update a CMS page
 */
export async function updateCMSPage(pageId: number, payload: UpdatePagePayload): Promise<CMSPage> {
  const response = await api.patch<CMSPage>(`/cms/pages/${pageId}`, payload);
  return response.data;
}

/**
 * Delete a CMS page
 */
export async function deleteCMSPage(pageId: number): Promise<void> {
  await api.delete(`/cms/pages/${pageId}`);
}

// ============================================================================
// BLOCK MANAGEMENT
// ============================================================================

/**
 * Fetch blocks for a page
 */
export async function fetchPageBlocks(pageId: number): Promise<CMSBlock[]> {
  const response = await api.get<CMSBlock[]>(`/cms/blocks`, {
    params: { pageId }
  });
  return response.data;
}

/**
 * Fetch a single block by ID
 */
export async function fetchCMSBlock(blockId: number): Promise<CMSBlock> {
  const response = await api.get<CMSBlock>(`/cms/blocks/${blockId}`);
  return response.data;
}

/**
 * Create a new block
 */
export async function createCMSBlock(payload: CreateBlockPayload): Promise<CMSBlock> {
  const response = await api.post<CMSBlock>('/cms/blocks', payload);
  return response.data;
}

/**
 * Update a block
 */
export async function updateCMSBlock(blockId: number, payload: UpdateBlockPayload): Promise<CMSBlock> {
  const response = await api.patch<CMSBlock>(`/cms/blocks/${blockId}`, payload);
  return response.data;
}

/**
 * Delete a block
 */
export async function deleteCMSBlock(blockId: number): Promise<void> {
  await api.delete(`/cms/blocks/${blockId}`);
}

/**
 * Reorder blocks on a page
 */
export async function reorderCMSBlocks(
  pageId: number,
  blockOrders: Array<{ blockId: number; displayOrder: number }>
): Promise<CMSBlock[]> {
  const response = await api.post<CMSBlock[]>('/cms/blocks/reorder', {
    pageId,
    blockOrders
  });
  return response.data;
}
