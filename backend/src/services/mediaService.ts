// Media Service Layer
// Business logic for managing CMS media uploads with S3 storage

import sharp from 'sharp';
import { pool } from '../db/client';
import {
  CMSMedia,
  MediaUploadResponse,
  UpdateMediaPayload,
  MediaQueryFilters
} from '../types/cms';
import {
  uploadImageToS3,
  deleteFromS3,
  getS3Config,
  generateUniqueKey,
  getPublicUrl,
  isS3Configured
} from './storageService';

// Configuration
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
  'image/svg+xml'
];

// ============================================================================
// MEDIA MANAGEMENT
// ============================================================================

/**
 * Get all media with optional filtering
 */
export async function getAllMedia(filters: MediaQueryFilters = {}): Promise<CMSMedia[]> {
  const {
    mimeType,
    uploadedBy,
    minWidth,
    minHeight,
    limit = 100,
    offset = 0,
    includeDeleted = false,
    categoryId,
    search
  } = filters;

  let query = 'SELECT * FROM cms_media WHERE 1=1';
  const params: any[] = [];
  let paramCount = 1;

  // Exclude deleted by default
  if (!includeDeleted) {
    query += ` AND (is_deleted = FALSE OR is_deleted IS NULL)`;
  }

  if (mimeType !== undefined) {
    query += ` AND mime_type = $${paramCount++}`;
    params.push(mimeType);
  }

  if (uploadedBy !== undefined) {
    query += ` AND uploaded_by = $${paramCount++}`;
    params.push(uploadedBy);
  }

  if (minWidth !== undefined) {
    query += ` AND width >= $${paramCount++}`;
    params.push(minWidth);
  }

  if (minHeight !== undefined) {
    query += ` AND height >= $${paramCount++}`;
    params.push(minHeight);
  }

  if (categoryId !== undefined) {
    query += ` AND category_id = $${paramCount++}`;
    params.push(categoryId);
  }

  if (search) {
    query += ` AND (filename ILIKE $${paramCount} OR alt_text ILIKE $${paramCount} OR original_name ILIKE $${paramCount})`;
    params.push(`%${search}%`);
    paramCount++;
  }

  query += ` ORDER BY created_at DESC LIMIT $${paramCount++} OFFSET $${paramCount++}`;
  params.push(limit, offset);

  const result = await pool.query(query, params);
  return result.rows.map(mapMediaFromDb);
}

/**
 * Get a single media item by ID
 */
export async function getMediaById(mediaId: number): Promise<CMSMedia | null> {
  const result = await pool.query('SELECT * FROM cms_media WHERE id = $1', [mediaId]);
  return result.rows.length > 0 ? mapMediaFromDb(result.rows[0]) : null;
}

/**
 * Upload a new media file to S3
 */
export async function uploadMedia(
  file: Express.Multer.File,
  altText?: string,
  caption?: string,
  adminId?: number
): Promise<MediaUploadResponse> {
  // Check if S3 is configured
  const s3Configured = await isS3Configured();
  if (!s3Configured) {
    throw new Error('S3 storage is not configured. Please configure S3 credentials in Settings > API Keys > Storage.');
  }

  // Validate file
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    throw new Error(`Invalid file type. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}`);
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`File too large. Maximum size: ${MAX_FILE_SIZE / 1024 / 1024}MB`);
  }

  // Generate unique S3 key
  const originalName = file.originalname.replace(/\.[^/.]+$/, ''); // Remove extension
  const s3Key = generateUniqueKey(originalName + '.webp', 'cms');

  let width: number | null = null;
  let height: number | null = null;
  let url: string;
  let actualMimeType = file.mimetype;
  let finalKey = s3Key;

  if (file.mimetype.startsWith('image/') && file.mimetype !== 'image/svg+xml') {
    try {
      // Upload and optimize image to S3
      const result = await uploadImageToS3(s3Key, file.buffer, {
        maxWidth: 2560,
        maxHeight: 2560,
        quality: 90,
        format: 'webp'
      });

      url = result.url;
      width = result.width;
      height = result.height;
      actualMimeType = result.mimeType;
      finalKey = result.key;
    } catch (error) {
      console.error('Error uploading optimized image to S3:', error);
      throw new Error('Failed to upload image to S3 storage.');
    }
  } else {
    // For SVG or non-image files, upload as-is
    const { uploadToS3 } = await import('./storageService');
    url = await uploadToS3(s3Key, file.buffer, file.mimetype);
    finalKey = s3Key;
  }

  // Extract filename from S3 key
  const filename = finalKey.split('/').pop() || finalKey;

  // Save to database
  const result = await pool.query(
    `INSERT INTO cms_media (filename, original_name, mime_type, size_bytes, width, height, alt_text, caption, file_path, uploaded_by, s3_key, s3_url)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
     RETURNING *`,
    [
      filename,
      file.originalname,
      actualMimeType,
      file.size,
      width,
      height,
      altText || null,
      caption || null,
      finalKey, // Store S3 key as file_path for compatibility
      adminId || null,
      finalKey, // S3 key
      url // Full S3 URL
    ]
  );

  const media = mapMediaFromDb(result.rows[0]);

  return { ...media, url };
}

/**
 * Update media metadata
 */
export async function updateMedia(
  mediaId: number,
  payload: UpdateMediaPayload
): Promise<CMSMedia | null> {
  const media = await getMediaById(mediaId);
  if (!media) return null;

  const updates: string[] = [];
  const params: any[] = [];
  let paramCount = 1;

  if (payload.filename !== undefined) {
    updates.push(`filename = $${paramCount++}`);
    params.push(payload.filename);
  }

  if (payload.altText !== undefined) {
    updates.push(`alt_text = $${paramCount++}`);
    params.push(payload.altText);
  }

  if (payload.caption !== undefined) {
    updates.push(`caption = $${paramCount++}`);
    params.push(payload.caption);
  }

  if (updates.length === 0) return media;

  params.push(mediaId);
  const query = `UPDATE cms_media SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`;

  const result = await pool.query(query, params);
  return mapMediaFromDb(result.rows[0]);
}

/**
 * Delete a media file from S3 (soft delete if in use, hard delete otherwise)
 */
export async function deleteMedia(mediaId: number): Promise<boolean> {
  const media = await getMediaById(mediaId);
  if (!media) return false;

  // Check usage count
  const usageResult = await pool.query(
    'SELECT usage_count FROM cms_media WHERE id = $1',
    [mediaId]
  );

  const usageCount = usageResult.rows[0]?.usage_count || 0;

  if (usageCount > 0) {
    // Soft delete - mark as deleted but don't remove from S3
    const result = await pool.query(
      'UPDATE cms_media SET is_deleted = TRUE, deleted_at = NOW() WHERE id = $1',
      [mediaId]
    );
    return result.rowCount !== null && result.rowCount > 0;
  } else {
    // Hard delete - remove from S3 and database
    const s3Key = media.filePath; // filePath now stores S3 key
    
    if (s3Key) {
      try {
        await deleteFromS3(s3Key);
      } catch (error) {
        console.error('Error deleting from S3:', error);
        // Continue with database deletion even if S3 deletion fails
      }
    }

    const result = await pool.query('DELETE FROM cms_media WHERE id = $1', [mediaId]);
    return result.rowCount !== null && result.rowCount > 0;
  }
}

/**
 * Restore soft-deleted media
 */
export async function restoreMedia(mediaId: number): Promise<boolean> {
  const result = await pool.query(
    'UPDATE cms_media SET is_deleted = FALSE, deleted_at = NULL WHERE id = $1',
    [mediaId]
  );
  return result.rowCount !== null && result.rowCount > 0;
}

/**
 * Get media with usage details
 */
export async function getMediaWithUsage(mediaId: number): Promise<{
  media: CMSMedia | null;
  usedInProducts: Array<{ id: number; name: string; isFeatured: boolean }>;
  totalUsage: number;
} | null> {
  const media = await getMediaById(mediaId);
  if (!media) return null;

  // Get products using this media
  const productsResult = await pool.query(
    `SELECT p.id, p.name, pm.is_featured
     FROM product_media pm
     JOIN products p ON pm.product_id = p.id
     WHERE pm.media_id = $1
     ORDER BY p.name ASC`,
    [mediaId]
  );

  const usedInProducts = productsResult.rows;
  const totalUsage = usedInProducts.length;

  return {
    media,
    usedInProducts,
    totalUsage
  };
}

/**
 * Attach tags to media
 */
export async function attachTags(mediaId: number, tagIds: number[]): Promise<void> {
  // Remove existing tags
  await pool.query('DELETE FROM media_tag_pivot WHERE media_id = $1', [mediaId]);

  // Add new tags
  if (tagIds.length > 0) {
    const values = tagIds.map((tagId, index) => `($1, $${index + 2})`).join(', ');
    const params = [mediaId, ...tagIds];
    await pool.query(
      `INSERT INTO media_tag_pivot (media_id, tag_id) VALUES ${values}`,
      params
    );
  }
}

/**
 * Get media tags
 */
export async function getMediaTags(mediaId: number): Promise<Array<{ id: number; name: string; slug: string }>> {
  const result = await pool.query(
    `SELECT t.id, t.name, t.slug
     FROM media_tags t
     JOIN media_tag_pivot mtp ON t.id = mtp.tag_id
     WHERE mtp.media_id = $1
     ORDER BY t.name ASC`,
    [mediaId]
  );
  return result.rows;
}

/**
 * Create or get tag
 */
export async function createOrGetTag(name: string): Promise<{ id: number; name: string; slug: string }> {
  const slug = name.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');

  // Try to get existing
  let result = await pool.query('SELECT * FROM media_tags WHERE slug = $1', [slug]);

  if (result.rows.length > 0) {
    return result.rows[0];
  }

  // Create new
  result = await pool.query(
    'INSERT INTO media_tags (name, slug) VALUES ($1, $2) RETURNING *',
    [name, slug]
  );

  return result.rows[0];
}

/**
 * Get media URL - returns S3 URL from database
 */
export async function getMediaUrl(mediaId: number): Promise<string | null> {
  const result = await pool.query(
    'SELECT s3_url, filename FROM cms_media WHERE id = $1',
    [mediaId]
  );
  
  if (result.rows.length === 0) return null;
  
  // Return stored S3 URL
  return result.rows[0].s3_url || null;
}

/**
 * Get media URL by filename - for backward compatibility
 */
export async function getMediaUrlByFilename(filename: string): Promise<string | null> {
  const result = await pool.query(
    'SELECT s3_url FROM cms_media WHERE filename = $1',
    [filename]
  );
  
  if (result.rows.length === 0) return null;
  
  return result.rows[0].s3_url || null;
}

/**
 * Get media with URL
 */
export async function getMediaWithUrl(mediaId: number): Promise<MediaUploadResponse | null> {
  const result = await pool.query('SELECT * FROM cms_media WHERE id = $1', [mediaId]);
  if (result.rows.length === 0) return null;

  const media = mapMediaFromDb(result.rows[0]);
  const url = result.rows[0].s3_url || '';
  
  return { ...media, url };
}

/**
 * Get all media with URLs
 */
export async function getAllMediaWithUrls(
  filters: MediaQueryFilters = {}
): Promise<MediaUploadResponse[]> {
  const {
    mimeType,
    uploadedBy,
    minWidth,
    minHeight,
    limit = 100,
    offset = 0,
    includeDeleted = false,
    categoryId,
    search
  } = filters;

  let query = 'SELECT * FROM cms_media WHERE 1=1';
  const params: any[] = [];
  let paramCount = 1;

  if (!includeDeleted) {
    query += ` AND (is_deleted = FALSE OR is_deleted IS NULL)`;
  }

  if (mimeType !== undefined) {
    query += ` AND mime_type = $${paramCount++}`;
    params.push(mimeType);
  }

  if (uploadedBy !== undefined) {
    query += ` AND uploaded_by = $${paramCount++}`;
    params.push(uploadedBy);
  }

  if (minWidth !== undefined) {
    query += ` AND width >= $${paramCount++}`;
    params.push(minWidth);
  }

  if (minHeight !== undefined) {
    query += ` AND height >= $${paramCount++}`;
    params.push(minHeight);
  }

  if (categoryId !== undefined) {
    query += ` AND category_id = $${paramCount++}`;
    params.push(categoryId);
  }

  if (search) {
    query += ` AND (filename ILIKE $${paramCount} OR alt_text ILIKE $${paramCount} OR original_name ILIKE $${paramCount})`;
    params.push(`%${search}%`);
    paramCount++;
  }

  query += ` ORDER BY created_at DESC LIMIT $${paramCount++} OFFSET $${paramCount++}`;
  params.push(limit, offset);

  const result = await pool.query(query, params);
  
  return result.rows.map(row => ({
    ...mapMediaFromDb(row),
    url: row.s3_url || ''
  }));
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Map database row to CMSMedia object
 */
function mapMediaFromDb(row: any): CMSMedia {
  return {
    id: row.id,
    filename: row.filename,
    originalName: row.original_name,
    mimeType: row.mime_type,
    sizeBytes: row.size_bytes,
    width: row.width,
    height: row.height,
    altText: row.alt_text,
    caption: row.caption,
    filePath: row.file_path,
    uploadedBy: row.uploaded_by,
    createdAt: row.created_at,
    s3Key: row.s3_key,
    s3Url: row.s3_url
  };
}

/**
 * Format file size to human-readable string
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Validate file extension
 */
export function isValidFileExtension(filename: string): boolean {
  const validExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg'];
  const ext = filename.toLowerCase().match(/\.[^/.]+$/)?.[0] || '';
  return validExtensions.includes(ext);
}

/**
 * Check if S3 storage is properly configured
 */
export async function checkStorageStatus(): Promise<{
  configured: boolean;
  provider: string | null;
  bucket: string | null;
}> {
  const config = await getS3Config();
  
  if (!config) {
    return {
      configured: false,
      provider: null,
      bucket: null
    };
  }

  // Detect provider from endpoint
  let provider = 'S3-Compatible';
  if (config.endpoint.includes('digitaloceanspaces.com')) {
    provider = 'DigitalOcean Spaces';
  } else if (config.endpoint.includes('amazonaws.com')) {
    provider = 'AWS S3';
  } else if (config.endpoint.includes('backblazeb2.com')) {
    provider = 'Backblaze B2';
  } else if (config.endpoint.includes('wasabisys.com')) {
    provider = 'Wasabi';
  }

  return {
    configured: true,
    provider,
    bucket: config.bucket
  };
}
