// Review Image Service Layer
// Business logic for managing review image uploads
// Uses same methodology as product images but keeps them separate

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';
import { pool } from '../db/client';
import { getMediaUrl as getAbsoluteMediaUrl } from '../utils/urlHelper';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration - separate directory for review images
const UPLOAD_DIR = process.env.REVIEW_IMAGES_DIR || path.join(__dirname, '../../uploads/review-images');
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB for review images
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif'
];

// Ensure upload directory exists
async function ensureUploadDir() {
  try {
    await fs.access(UPLOAD_DIR);
  } catch {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
  }
}

export interface ReviewImageUpload {
  filename: string;
  originalName: string;
  url: string;
}

/**
 * Upload a review image
 * Optimizes, resizes, and converts to WebP format
 */
export async function uploadReviewImage(
  file: Express.Multer.File
): Promise<ReviewImageUpload> {
  // Validate file
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    throw new Error(`Invalid file type. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}`);
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`File too large. Maximum size: ${MAX_FILE_SIZE / 1024 / 1024}MB`);
  }

  // Ensure upload directory exists
  await ensureUploadDir();

  // Generate unique filename with .webp extension
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 8);
  const originalName = path.parse(file.originalname).name;
  const filename = `review-${timestamp}-${randomString}-${originalName}.webp`;
  const filePath = path.join(UPLOAD_DIR, filename);

  // Optimize and save image
  try {
    // Optimize image: resize if too large, convert to webp
    await sharp(file.buffer)
      .resize(1920, 1920, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .webp({
        quality: 85,
        effort: 4
      })
      .toFile(filePath);
  } catch (error) {
    console.error('Error optimizing review image:', error);
    // Fallback to original if optimization fails
    await fs.writeFile(filePath, file.buffer);
  }

  // Generate URL - use absolute URL for cross-port compatibility
  const url = getAbsoluteMediaUrl(filename, 'review-images');

  return {
    filename,
    originalName: file.originalname,
    url
  };
}

/**
 * Upload multiple review images
 */
export async function uploadReviewImages(
  files: Express.Multer.File[]
): Promise<ReviewImageUpload[]> {
  const uploads: ReviewImageUpload[] = [];

  for (const file of files) {
    try {
      const upload = await uploadReviewImage(file);
      uploads.push(upload);
    } catch (error: any) {
      console.error('Error uploading review image:', error);
      // Continue with other files even if one fails
    }
  }

  return uploads;
}

/**
 * Delete a review image file
 */
export async function deleteReviewImage(filename: string): Promise<boolean> {
  try {
    const filePath = path.join(UPLOAD_DIR, filename);
    await fs.unlink(filePath);
    return true;
  } catch (error) {
    console.error('Error deleting review image:', error);
    return false;
  }
}

/**
 * Delete multiple review images
 */
export async function deleteReviewImages(filenames: string[]): Promise<number> {
  let deletedCount = 0;

  for (const filename of filenames) {
    const success = await deleteReviewImage(filename);
    if (success) deletedCount++;
  }

  return deletedCount;
}

/**
 * Get review image URL
 */
export function getReviewImageUrl(filename: string): string {
  return getAbsoluteMediaUrl(filename, 'review-images');
}

/**
 * Validate if file is an allowed image type
 */
export function isValidImageType(mimetype: string): boolean {
  return ALLOWED_MIME_TYPES.includes(mimetype);
}

/**
 * Get file size limit
 */
export function getMaxFileSize(): number {
  return MAX_FILE_SIZE;
}
