// CMS Service Layer
// Business logic for managing CMS pages and blocks

import { pool } from '../db/client';
import {
  CMSPage,
  CMSBlock,
  CMSBlockVersion,
  CreatePagePayload,
  UpdatePagePayload,
  CreateBlockPayload,
  UpdateBlockPayload,
  ReorderBlocksPayload,
  PageWithBlocksResponse,
  BlockWithVersionsResponse,
  PublicPageResponse,
  PageQueryFilters,
  BlockQueryFilters,
  BlockContent
} from '../types/cms';

// ============================================================================
// PAGE MANAGEMENT
// ============================================================================

/**
 * Get all pages with optional filtering
 */
export async function getAllPages(filters: PageQueryFilters = {}): Promise<CMSPage[]> {
  const { slug, isPublished, createdBy, limit = 100, offset = 0 } = filters;

  let query = 'SELECT * FROM cms_pages WHERE 1=1';
  const params: any[] = [];
  let paramCount = 1;

  if (slug !== undefined) {
    query += ` AND slug = $${paramCount++}`;
    params.push(slug);
  }

  if (isPublished !== undefined) {
    query += ` AND is_published = $${paramCount++}`;
    params.push(isPublished);
  }

  if (createdBy !== undefined) {
    query += ` AND created_by = $${paramCount++}`;
    params.push(createdBy);
  }

  query += ` ORDER BY created_at DESC LIMIT $${paramCount++} OFFSET $${paramCount++}`;
  params.push(limit, offset);

  const result = await pool.query(query, params);
  return result.rows.map(mapPageFromDb);
}

/**
 * Get a single page by ID
 */
export async function getPageById(pageId: number): Promise<CMSPage | null> {
  const result = await pool.query('SELECT * FROM cms_pages WHERE id = $1', [pageId]);
  return result.rows.length > 0 ? mapPageFromDb(result.rows[0]) : null;
}

/**
 * Get a single page by slug
 */
export async function getPageBySlug(slug: string): Promise<CMSPage | null> {
  const result = await pool.query('SELECT * FROM cms_pages WHERE slug = $1', [slug]);
  return result.rows.length > 0 ? mapPageFromDb(result.rows[0]) : null;
}

/**
 * Get page with all its blocks
 */
export async function getPageWithBlocks(slug: string): Promise<PageWithBlocksResponse | null> {
  const page = await getPageBySlug(slug);
  if (!page) return null;

  const blocks = await getBlocksByPageId(page.id, { isEnabled: true });
  return { ...page, blocks };
}

/**
 * Get public page data (for frontend consumption)
 */
export async function getPublicPage(slug: string): Promise<PublicPageResponse | null> {
  const result = await pool.query(
    `SELECT
      p.slug, p.title, p.meta_description as "metaDescription", p.meta_keywords as "metaKeywords",
      b.id, b.block_type as "blockType", b.block_key as "blockKey", b.content, b.settings, b.display_order as "displayOrder"
     FROM cms_pages p
     LEFT JOIN cms_blocks b ON p.id = b.page_id AND b.is_enabled = true
     WHERE p.slug = $1 AND p.is_published = true
     ORDER BY b.display_order ASC`,
    [slug]
  );

  if (result.rows.length === 0) return null;

  const firstRow = result.rows[0];
  const page = {
    slug: firstRow.slug,
    title: firstRow.title,
    metaDescription: firstRow.metaDescription,
    metaKeywords: firstRow.metaKeywords
  };

  const blocks = result.rows
    .filter((row) => row.id !== null)
    .map((row) => ({
      blockType: row.blockType,
      blockKey: row.blockKey,
      content: row.content,
      settings: row.settings
    }));

  return { page, blocks };
}

/**
 * Create a new page
 */
export async function createPage(
  payload: CreatePagePayload,
  adminId: number
): Promise<CMSPage> {
  const { slug, title, metaDescription, metaKeywords, isPublished = false } = payload;

  const result = await pool.query(
    `INSERT INTO cms_pages (slug, title, meta_description, meta_keywords, is_published, created_by)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [slug, title, metaDescription || null, metaKeywords || null, isPublished, adminId]
  );

  return mapPageFromDb(result.rows[0]);
}

/**
 * Update an existing page
 */
export async function updatePage(
  pageId: number,
  payload: UpdatePagePayload
): Promise<CMSPage | null> {
  const page = await getPageById(pageId);
  if (!page) return null;

  const updates: string[] = [];
  const params: any[] = [];
  let paramCount = 1;

  if (payload.slug !== undefined) {
    updates.push(`slug = $${paramCount++}`);
    params.push(payload.slug);
  }

  if (payload.title !== undefined) {
    updates.push(`title = $${paramCount++}`);
    params.push(payload.title);
  }

  if (payload.metaDescription !== undefined) {
    updates.push(`meta_description = $${paramCount++}`);
    params.push(payload.metaDescription);
  }

  if (payload.metaKeywords !== undefined) {
    updates.push(`meta_keywords = $${paramCount++}`);
    params.push(payload.metaKeywords);
  }

  if (payload.isPublished !== undefined) {
    updates.push(`is_published = $${paramCount++}`);
    params.push(payload.isPublished);

    if (payload.isPublished && !page.publishedAt) {
      updates.push(`published_at = CURRENT_TIMESTAMP`);
    }
  }

  if (updates.length === 0) return page;

  params.push(pageId);
  const query = `UPDATE cms_pages SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`;

  const result = await pool.query(query, params);
  return mapPageFromDb(result.rows[0]);
}

/**
 * Delete a page and all its blocks
 */
export async function deletePage(pageId: number): Promise<boolean> {
  const result = await pool.query('DELETE FROM cms_pages WHERE id = $1', [pageId]);
  return result.rowCount !== null && result.rowCount > 0;
}

// ============================================================================
// BLOCK MANAGEMENT
// ============================================================================

/**
 * Get all blocks for a page with optional filtering
 */
export async function getBlocksByPageId(
  pageId: number,
  filters: Omit<BlockQueryFilters, 'pageId'> = {}
): Promise<CMSBlock[]> {
  const { blockType, isEnabled, limit = 100, offset = 0 } = filters;

  let query = 'SELECT * FROM cms_blocks WHERE page_id = $1';
  const params: any[] = [pageId];
  let paramCount = 2;

  if (blockType !== undefined) {
    query += ` AND block_type = $${paramCount++}`;
    params.push(blockType);
  }

  if (isEnabled !== undefined) {
    query += ` AND is_enabled = $${paramCount++}`;
    params.push(isEnabled);
  }

  query += ` ORDER BY display_order ASC LIMIT $${paramCount++} OFFSET $${paramCount++}`;
  params.push(limit, offset);

  const result = await pool.query(query, params);
  return result.rows.map(mapBlockFromDb);
}

/**
 * Get a single block by ID
 */
export async function getBlockById(blockId: number): Promise<CMSBlock | null> {
  const result = await pool.query('SELECT * FROM cms_blocks WHERE id = $1', [blockId]);
  return result.rows.length > 0 ? mapBlockFromDb(result.rows[0]) : null;
}

/**
 * Get block with version history
 */
export async function getBlockWithVersions(blockId: number): Promise<BlockWithVersionsResponse | null> {
  const block = await getBlockById(blockId);
  if (!block) return null;

  const versionsResult = await pool.query(
    'SELECT * FROM cms_block_versions WHERE block_id = $1 ORDER BY version_number DESC',
    [blockId]
  );

  const versions = versionsResult.rows.map(mapBlockVersionFromDb);
  return { ...block, versions };
}

/**
 * Create a new block
 */
export async function createBlock(
  payload: CreateBlockPayload,
  adminId?: number
): Promise<CMSBlock> {
  const {
    pageId,
    blockType,
    blockKey,
    displayOrder,
    content,
    settings = null,
    isEnabled = true
  } = payload;

  const result = await pool.query(
    `INSERT INTO cms_blocks (page_id, block_type, block_key, display_order, content, settings, is_enabled)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [pageId, blockType, blockKey, displayOrder, JSON.stringify(content), JSON.stringify(settings), isEnabled]
  );

  const block = mapBlockFromDb(result.rows[0]);

  // Create initial version
  await createBlockVersion(block.id, content, settings, adminId);

  return block;
}

/**
 * Update an existing block
 */
export async function updateBlock(
  blockId: number,
  payload: UpdateBlockPayload,
  adminId?: number
): Promise<CMSBlock | null> {
  const block = await getBlockById(blockId);
  if (!block) return null;

  const updates: string[] = [];
  const params: any[] = [];
  let paramCount = 1;

  if (payload.blockType !== undefined) {
    updates.push(`block_type = $${paramCount++}`);
    params.push(payload.blockType);
  }

  if (payload.blockKey !== undefined) {
    updates.push(`block_key = $${paramCount++}`);
    params.push(payload.blockKey);
  }

  if (payload.displayOrder !== undefined) {
    updates.push(`display_order = $${paramCount++}`);
    params.push(payload.displayOrder);
  }

  if (payload.content !== undefined) {
    updates.push(`content = $${paramCount++}`);
    params.push(JSON.stringify(payload.content));
  }

  if (payload.settings !== undefined) {
    updates.push(`settings = $${paramCount++}`);
    params.push(JSON.stringify(payload.settings));
  }

  if (payload.isEnabled !== undefined) {
    updates.push(`is_enabled = $${paramCount++}`);
    params.push(payload.isEnabled);
  }

  if (updates.length === 0) return block;

  params.push(blockId);
  const query = `UPDATE cms_blocks SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`;

  const result = await pool.query(query, params);
  const updatedBlock = mapBlockFromDb(result.rows[0]);

  // Create new version if content or settings changed
  if (payload.content !== undefined || payload.settings !== undefined) {
    await createBlockVersion(
      blockId,
      payload.content || block.content,
      payload.settings !== undefined ? payload.settings : block.settings,
      adminId
    );
  }

  return updatedBlock;
}

/**
 * Delete a block
 */
export async function deleteBlock(blockId: number): Promise<boolean> {
  const result = await pool.query('DELETE FROM cms_blocks WHERE id = $1', [blockId]);
  return result.rowCount !== null && result.rowCount > 0;
}

/**
 * Reorder blocks on a page
 */
export async function reorderBlocks(payload: ReorderBlocksPayload): Promise<CMSBlock[]> {
  const { pageId, blockOrders } = payload;

  // Update each block's display order
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    for (const { blockId, displayOrder } of blockOrders) {
      await client.query(
        'UPDATE cms_blocks SET display_order = $1 WHERE id = $2 AND page_id = $3',
        [displayOrder, blockId, pageId]
      );
    }

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }

  // Return updated blocks
  return getBlocksByPageId(pageId);
}

// ============================================================================
// BLOCK VERSION MANAGEMENT
// ============================================================================

/**
 * Create a new block version
 */
async function createBlockVersion(
  blockId: number,
  content: BlockContent,
  settings: any,
  adminId?: number
): Promise<CMSBlockVersion> {
  // Get the latest version number
  const versionResult = await pool.query(
    'SELECT COALESCE(MAX(version_number), 0) + 1 as next_version FROM cms_block_versions WHERE block_id = $1',
    [blockId]
  );

  const versionNumber = versionResult.rows[0].next_version;

  const result = await pool.query(
    `INSERT INTO cms_block_versions (block_id, content, settings, version_number, created_by)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [blockId, JSON.stringify(content), JSON.stringify(settings), versionNumber, adminId || null]
  );

  return mapBlockVersionFromDb(result.rows[0]);
}

/**
 * Restore a block to a previous version
 */
export async function restoreBlockVersion(
  blockId: number,
  versionNumber: number,
  adminId?: number
): Promise<CMSBlock | null> {
  const versionResult = await pool.query(
    'SELECT * FROM cms_block_versions WHERE block_id = $1 AND version_number = $2',
    [blockId, versionNumber]
  );

  if (versionResult.rows.length === 0) return null;

  const version = mapBlockVersionFromDb(versionResult.rows[0]);

  // Update block with version content and settings
  return updateBlock(
    blockId,
    {
      content: version.content,
      settings: version.settings
    },
    adminId
  );
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Map database row to CMSPage object
 */
function mapPageFromDb(row: any): CMSPage {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    metaDescription: row.meta_description,
    metaKeywords: row.meta_keywords,
    isPublished: row.is_published,
    publishedAt: row.published_at,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

/**
 * Map database row to CMSBlock object
 */
function mapBlockFromDb(row: any): CMSBlock {
  return {
    id: row.id,
    pageId: row.page_id,
    blockType: row.block_type,
    blockKey: row.block_key,
    displayOrder: row.display_order,
    isEnabled: row.is_enabled,
    content: row.content,
    settings: row.settings,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

/**
 * Map database row to CMSBlockVersion object
 */
function mapBlockVersionFromDb(row: any): CMSBlockVersion {
  return {
    id: row.id,
    blockId: row.block_id,
    content: row.content,
    settings: row.settings,
    versionNumber: row.version_number,
    createdBy: row.created_by,
    createdAt: row.created_at
  };
}
