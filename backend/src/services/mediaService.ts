// Media Service Layer
// Business logic for managing CMS media uploads

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from '../db/client';
import {
  CMSMedia,
  MediaUploadResponse,
  UpdateMediaPayload,
  MediaQueryFilters
} from '../types/cms';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(__dirname, '../../uploads/cms');
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml'
];

// Ensure upload directory exists
async function ensureUploadDir() {
  try {
    await fs.access(UPLOAD_DIR);
  } catch {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
  }
}

// ============================================================================
// MEDIA MANAGEMENT
// ============================================================================

/**
 * Get all media with optional filtering
 */
export async function getAllMedia(filters: MediaQueryFilters = {}): Promise<CMSMedia[]> {
  const { mimeType, uploadedBy, minWidth, minHeight, limit = 100, offset = 0 } = filters;

  let query = 'SELECT * FROM cms_media WHERE 1=1';
  const params: any[] = [];
  let paramCount = 1;

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
 * Upload a new media file
 */
export async function uploadMedia(
  file: Express.Multer.File,
  altText?: string,
  caption?: string,
  adminId?: number
): Promise<MediaUploadResponse> {
  // Validate file
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    throw new Error(`Invalid file type. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}`);
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`File too large. Maximum size: ${MAX_FILE_SIZE / 1024 / 1024}MB`);
  }

  // Ensure upload directory exists
  await ensureUploadDir();

  // Generate unique filename
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 8);
  const ext = path.extname(file.originalname);
  const filename = `${timestamp}-${randomString}${ext}`;
  const filePath = path.join(UPLOAD_DIR, filename);

  // Save file to disk
  await fs.writeFile(filePath, file.buffer);

  // Get image dimensions (if it's an image)
  let width: number | null = null;
  let height: number | null = null;

  if (file.mimetype.startsWith('image/')) {
    try {
      // For production, use a proper image library like 'sharp'
      // For now, we'll store null and let the frontend handle it
      // const sharp = require('sharp');
      // const metadata = await sharp(filePath).metadata();
      // width = metadata.width || null;
      // height = metadata.height || null;
    } catch (error) {
      console.error('Error getting image dimensions:', error);
    }
  }

  // Save to database
  const result = await pool.query(
    `INSERT INTO cms_media (filename, original_name, mime_type, size_bytes, width, height, alt_text, caption, file_path, uploaded_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     RETURNING *`,
    [
      filename,
      file.originalname,
      file.mimetype,
      file.size,
      width,
      height,
      altText || null,
      caption || null,
      filePath,
      adminId || null
    ]
  );

  const media = mapMediaFromDb(result.rows[0]);

  // Generate URL
  const baseUrl = process.env.BASE_URL || 'http://localhost:4000';
  const url = `${baseUrl}/uploads/cms/${filename}`;

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
 * Delete a media file
 */
export async function deleteMedia(mediaId: number): Promise<boolean> {
  const media = await getMediaById(mediaId);
  if (!media) return false;

  // Delete file from disk
  try {
    await fs.unlink(media.filePath);
  } catch (error) {
    console.error('Error deleting file:', error);
    // Continue with database deletion even if file deletion fails
  }

  // Delete from database
  const result = await pool.query('DELETE FROM cms_media WHERE id = $1', [mediaId]);
  return result.rowCount !== null && result.rowCount > 0;
}

/**
 * Get media URL
 */
export function getMediaUrl(filename: string): string {
  const baseUrl = process.env.BASE_URL || 'http://localhost:4000';
  return `${baseUrl}/uploads/cms/${filename}`;
}

/**
 * Get media with URL
 */
export async function getMediaWithUrl(mediaId: number): Promise<MediaUploadResponse | null> {
  const media = await getMediaById(mediaId);
  if (!media) return null;

  const url = getMediaUrl(media.filename);
  return { ...media, url };
}

/**
 * Get all media with URLs
 */
export async function getAllMediaWithUrls(
  filters: MediaQueryFilters = {}
): Promise<MediaUploadResponse[]> {
  const mediaList = await getAllMedia(filters);
  return mediaList.map((media) => ({
    ...media,
    url: getMediaUrl(media.filename)
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
    createdAt: row.created_at
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
  const ext = path.extname(filename).toLowerCase();
  return validExtensions.includes(ext);
}
