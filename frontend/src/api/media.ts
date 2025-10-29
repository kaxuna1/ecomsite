// Media API Client
// API functions for media management

import api from './client';

export interface CMSMedia {
  id: number;
  filename: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  width: number | null;
  height: number | null;
  altText: string | null;
  caption: string | null;
  filePath: string;
  uploadedBy: number | null;
  createdAt: string;
  url?: string;
  categoryId?: number | null;
  usageCount?: number;
  isDeleted?: boolean;
  tags?: Array<{ id: number; name: string; slug: string }>;
}

export interface MediaCategory {
  id: number;
  name: string;
  slug: string;
  parentId: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface MediaTag {
  id: number;
  name: string;
  slug: string;
  createdAt: string;
}

export interface MediaFilters {
  search?: string;
  mimeType?: string;
  categoryId?: number;
  minWidth?: number;
  minHeight?: number;
  includeDeleted?: boolean;
  limit?: number;
  offset?: number;
}

export interface MediaUsage {
  media: CMSMedia | null;
  usedInProducts: Array<{
    id: number;
    name: string;
    isFeatured: boolean;
  }>;
  totalUsage: number;
}

export interface UpdateMediaPayload {
  altText?: string;
  caption?: string;
  categoryId?: number | null;
  tags?: string[];
}

export interface ProductMediaLink {
  id: number;
  productId: number;
  mediaId: number;
  isFeatured: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
  // Joined media data
  filename?: string;
  originalName?: string;
  mimeType?: string;
  sizeBytes?: number;
  width?: number | null;
  height?: number | null;
  altText?: string | null;
  caption?: string | null;
  filePath?: string;
  url?: string;
}

/**
 * Get all media with optional filtering
 */
export async function getAllMedia(filters: MediaFilters = {}): Promise<CMSMedia[]> {
  const params = new URLSearchParams();

  if (filters.search) params.append('search', filters.search);
  if (filters.mimeType) params.append('mimeType', filters.mimeType);
  if (filters.categoryId) params.append('categoryId', String(filters.categoryId));
  if (filters.minWidth) params.append('minWidth', String(filters.minWidth));
  if (filters.minHeight) params.append('minHeight', String(filters.minHeight));
  if (filters.includeDeleted) params.append('includeDeleted', 'true');
  if (filters.limit) params.append('limit', String(filters.limit));
  if (filters.offset) params.append('offset', String(filters.offset));

  const response = await api.get(`/admin/media?${params.toString()}`);
  return response.data;
}

/**
 * Get single media by ID
 */
export async function getMediaById(id: number): Promise<CMSMedia> {
  const response = await api.get(`/admin/media/${id}`);
  return response.data;
}

/**
 * Get media usage details
 */
export async function getMediaUsage(id: number): Promise<MediaUsage> {
  const response = await api.get(`/admin/media/${id}/usage`);
  return response.data;
}

/**
 * Upload new media
 */
export async function uploadMedia(
  file: File,
  metadata: {
    altText?: string;
    caption?: string;
    categoryId?: number;
    tags?: string[];
  } = {}
): Promise<CMSMedia> {
  const formData = new FormData();
  formData.append('file', file);

  if (metadata.altText) formData.append('altText', metadata.altText);
  if (metadata.caption) formData.append('caption', metadata.caption);
  if (metadata.categoryId) formData.append('categoryId', String(metadata.categoryId));
  if (metadata.tags) formData.append('tags', JSON.stringify(metadata.tags));

  const response = await api.post('/admin/media', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });

  return response.data;
}

/**
 * Update media metadata
 */
export async function updateMedia(
  id: number,
  data: {
    altText?: string;
    caption?: string;
    categoryId?: number | null;
    tags?: string[];
  }
): Promise<CMSMedia> {
  const response = await api.put(`/admin/media/${id}`, data);
  return response.data;
}

/**
 * Delete media
 */
export async function deleteMedia(id: number): Promise<void> {
  await api.delete(`/admin/media/${id}`);
}

/**
 * Restore deleted media
 */
export async function restoreMedia(id: number): Promise<CMSMedia> {
  const response = await api.post(`/admin/media/${id}/restore`);
  return response.data;
}

/**
 * Get all media categories
 */
export async function getMediaCategories(): Promise<MediaCategory[]> {
  const response = await api.get('/admin/media/categories/list');
  return response.data;
}

/**
 * Get all media tags
 */
export async function getMediaTags(): Promise<MediaTag[]> {
  const response = await api.get('/admin/media/tags/list');
  return response.data;
}

// ============================================================================
// PRODUCT MEDIA APIs
// ============================================================================

/**
 * Get all media for a product
 */
export async function getProductMedia(productId: number): Promise<ProductMediaLink[]> {
  const response = await api.get(`/admin/products/${productId}/media`);
  return response.data;
}

/**
 * Attach existing media to product
 */
export async function attachMediaToProduct(
  productId: number,
  mediaId: number,
  options: {
    isFeatured?: boolean;
    displayOrder?: number;
  } = {}
): Promise<ProductMediaLink> {
  const response = await api.post(`/admin/products/${productId}/media`, {
    mediaId,
    ...options
  });
  return response.data;
}

/**
 * Detach media from product
 */
export async function detachMediaFromProduct(
  productId: number,
  mediaId: number
): Promise<void> {
  await api.delete(`/admin/products/${productId}/media/${mediaId}`);
}

/**
 * Reorder product media
 */
export async function reorderProductMedia(
  productId: number,
  mediaIds: number[]
): Promise<void> {
  await api.put(`/admin/products/${productId}/media/reorder`, { mediaIds });
}

/**
 * Set featured image for product
 */
export async function setFeaturedProductImage(
  productId: number,
  mediaId: number
): Promise<void> {
  await api.put(`/admin/products/${productId}/media/${mediaId}/featured`);
}
