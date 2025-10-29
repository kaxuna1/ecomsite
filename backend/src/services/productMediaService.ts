// Product Media Service Layer
// Business logic for managing product-media relationships

import { pool } from '../db/client';

export interface ProductMediaLink {
  id: number;
  productId: number;
  mediaId: number;
  isFeatured: boolean;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
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
}

/**
 * Attach media to product
 */
export async function attachMediaToProduct(
  productId: number,
  mediaId: number,
  options: { isFeatured?: boolean; displayOrder?: number } = {}
): Promise<ProductMediaLink> {
  const { isFeatured = false, displayOrder = 0 } = options;

  // If setting as featured, unset other featured images
  if (isFeatured) {
    await pool.query(
      'UPDATE product_media SET is_featured = FALSE WHERE product_id = $1',
      [productId]
    );
  }

  // Insert or update
  const result = await pool.query(
    `INSERT INTO product_media (product_id, media_id, is_featured, display_order)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (product_id, media_id)
     DO UPDATE SET is_featured = $3, display_order = $4, updated_at = NOW()
     RETURNING *`,
    [productId, mediaId, isFeatured, displayOrder]
  );

  // Update media usage count
  await updateMediaUsageCount(mediaId);

  return mapProductMediaFromDb(result.rows[0]);
}

/**
 * Detach media from product
 */
export async function detachMediaFromProduct(
  productId: number,
  mediaId: number
): Promise<boolean> {
  const result = await pool.query(
    'DELETE FROM product_media WHERE product_id = $1 AND media_id = $2',
    [productId, mediaId]
  );

  // Update media usage count
  await updateMediaUsageCount(mediaId);

  return result.rowCount !== null && result.rowCount > 0;
}

/**
 * Get all media for a product
 */
export async function getProductMedia(productId: number): Promise<ProductMediaLink[]> {
  const result = await pool.query(
    `SELECT pm.*,
            m.filename, m.original_name, m.mime_type, m.size_bytes,
            m.width, m.height, m.alt_text, m.caption, m.file_path
     FROM product_media pm
     JOIN cms_media m ON pm.media_id = m.id
     WHERE pm.product_id = $1 AND m.is_deleted = FALSE
     ORDER BY pm.display_order ASC, pm.created_at ASC`,
    [productId]
  );

  return result.rows.map(mapProductMediaFromDb);
}

/**
 * Get featured image for product
 */
export async function getFeaturedImage(productId: number): Promise<ProductMediaLink | null> {
  const result = await pool.query(
    `SELECT pm.*,
            m.filename, m.original_name, m.mime_type, m.size_bytes,
            m.width, m.height, m.alt_text, m.caption, m.file_path
     FROM product_media pm
     JOIN cms_media m ON pm.media_id = m.id
     WHERE pm.product_id = $1 AND pm.is_featured = TRUE AND m.is_deleted = FALSE
     LIMIT 1`,
    [productId]
  );

  return result.rows.length > 0 ? mapProductMediaFromDb(result.rows[0]) : null;
}

/**
 * Set featured image
 */
export async function setFeaturedImage(productId: number, mediaId: number): Promise<void> {
  // Unset all featured for this product
  await pool.query(
    'UPDATE product_media SET is_featured = FALSE WHERE product_id = $1',
    [productId]
  );

  // Set new featured
  await pool.query(
    'UPDATE product_media SET is_featured = TRUE WHERE product_id = $1 AND media_id = $2',
    [productId, mediaId]
  );
}

/**
 * Reorder product media
 */
export async function reorderProductMedia(
  productId: number,
  mediaIds: number[]
): Promise<void> {
  // Update display_order for each media in the order provided
  const updatePromises = mediaIds.map((mediaId, index) =>
    pool.query(
      'UPDATE product_media SET display_order = $1, updated_at = NOW() WHERE product_id = $2 AND media_id = $3',
      [index, productId, mediaId]
    )
  );

  await Promise.all(updatePromises);
}

/**
 * Update media usage count based on actual usage
 */
async function updateMediaUsageCount(mediaId: number): Promise<void> {
  await pool.query(
    `UPDATE cms_media
     SET usage_count = (
       SELECT COUNT(*) FROM product_media WHERE media_id = $1
     )
     WHERE id = $1`,
    [mediaId]
  );
}

/**
 * Get products using a specific media
 */
export async function getProductsUsingMedia(mediaId: number): Promise<Array<{
  id: number;
  name: string;
  isFeatured: boolean;
}>> {
  const result = await pool.query(
    `SELECT p.id, p.name, pm.is_featured
     FROM product_media pm
     JOIN products p ON pm.product_id = p.id
     WHERE pm.media_id = $1
     ORDER BY p.name ASC`,
    [mediaId]
  );

  return result.rows;
}

/**
 * Map database row to ProductMediaLink
 */
function mapProductMediaFromDb(row: any): ProductMediaLink {
  return {
    id: row.id,
    productId: row.product_id,
    mediaId: row.media_id,
    isFeatured: row.is_featured,
    displayOrder: row.display_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    // Optional joined media data
    filename: row.filename,
    originalName: row.original_name,
    mimeType: row.mime_type,
    sizeBytes: row.size_bytes,
    width: row.width,
    height: row.height,
    altText: row.alt_text,
    caption: row.caption,
    filePath: row.file_path
  };
}
