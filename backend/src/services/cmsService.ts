// CMS Service Layer
// Business logic for managing CMS pages and blocks

import { pool } from '../db/client';
import {
  CMSPage,
  CMSBlock,
  CMSBlockVersion,
  CMSPageTranslation,
  CMSBlockTranslation,
  CreatePagePayload,
  UpdatePagePayload,
  CreateBlockPayload,
  UpdateBlockPayload,
  ReorderBlocksPayload,
  CreatePageTranslationPayload,
  CreateBlockTranslationPayload,
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
export async function getPublicPage(slug: string, language: string = 'en'): Promise<PublicPageResponse | null> {
  const result = await pool.query(
    `SELECT
      COALESCE(pt.slug, p.slug) as slug,
      COALESCE(pt.title, p.title) as title,
      COALESCE(pt.meta_description, p.meta_description) as "metaDescription",
      p.meta_keywords as "metaKeywords",
      b.id, b.block_type as "blockType", b.block_key as "blockKey",
      COALESCE(bt.content, b.content) as content,
      b.settings, b.display_order as "displayOrder"
     FROM cms_pages p
     LEFT JOIN cms_page_translations pt ON p.id = pt.page_id AND pt.language_code = $2
     LEFT JOIN cms_blocks b ON p.id = b.page_id AND b.is_enabled = true
     LEFT JOIN cms_block_translations bt ON b.id = bt.block_id AND bt.language_code = $2
     WHERE (p.slug = $1 OR pt.slug = $1) AND p.is_published = true
     ORDER BY b.display_order ASC`,
    [slug, language]
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
      settings: version.settings || undefined
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

/**
 * Map database row to CMSPageTranslation object
 */
function mapPageTranslationFromDb(row: any): CMSPageTranslation {
  return {
    id: row.id,
    pageId: row.page_id,
    languageCode: row.language_code,
    title: row.title,
    slug: row.slug,
    metaTitle: row.meta_title,
    metaDescription: row.meta_description,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

/**
 * Map database row to CMSBlockTranslation object
 */
function mapBlockTranslationFromDb(row: any): CMSBlockTranslation {
  return {
    id: row.id,
    blockId: row.block_id,
    languageCode: row.language_code,
    content: row.content,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

// ============================================================================
// PAGE TRANSLATION MANAGEMENT
// ============================================================================

/**
 * Create or update a page translation
 */
export async function createPageTranslation(
  pageId: number,
  languageCode: string,
  data: CreatePageTranslationPayload
): Promise<CMSPageTranslation> {
  const result = await pool.query(
    `INSERT INTO cms_page_translations
     (page_id, language_code, title, slug, meta_title, meta_description)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (page_id, language_code)
     DO UPDATE SET
       title = EXCLUDED.title,
       slug = EXCLUDED.slug,
       meta_title = EXCLUDED.meta_title,
       meta_description = EXCLUDED.meta_description,
       updated_at = CURRENT_TIMESTAMP
     RETURNING *`,
    [
      pageId,
      languageCode,
      data.title,
      data.slug,
      data.metaTitle || null,
      data.metaDescription || null
    ]
  );

  return mapPageTranslationFromDb(result.rows[0]);
}

/**
 * Get a specific page translation
 */
export async function getPageTranslation(
  pageId: number,
  languageCode: string
): Promise<CMSPageTranslation | null> {
  const result = await pool.query(
    `SELECT * FROM cms_page_translations WHERE page_id = $1 AND language_code = $2`,
    [pageId, languageCode]
  );

  return result.rows.length > 0 ? mapPageTranslationFromDb(result.rows[0]) : null;
}

/**
 * Get all translations for a page
 */
export async function getAllPageTranslations(pageId: number): Promise<CMSPageTranslation[]> {
  const result = await pool.query(
    `SELECT * FROM cms_page_translations WHERE page_id = $1 ORDER BY language_code`,
    [pageId]
  );

  return result.rows.map(mapPageTranslationFromDb);
}

// ============================================================================
// BLOCK TRANSLATION MANAGEMENT
// ============================================================================

/**
 * Create or update a block translation
 */
export async function createBlockTranslation(
  blockId: number,
  languageCode: string,
  content: BlockContent
): Promise<CMSBlockTranslation> {
  const result = await pool.query(
    `INSERT INTO cms_block_translations
     (block_id, language_code, content)
     VALUES ($1, $2, $3)
     ON CONFLICT (block_id, language_code)
     DO UPDATE SET
       content = EXCLUDED.content,
       updated_at = CURRENT_TIMESTAMP
     RETURNING *`,
    [blockId, languageCode, JSON.stringify(content)]
  );

  return mapBlockTranslationFromDb(result.rows[0]);
}

/**
 * Get a specific block translation
 */
export async function getBlockTranslation(
  blockId: number,
  languageCode: string
): Promise<CMSBlockTranslation | null> {
  const result = await pool.query(
    `SELECT * FROM cms_block_translations WHERE block_id = $1 AND language_code = $2`,
    [blockId, languageCode]
  );

  return result.rows.length > 0 ? mapBlockTranslationFromDb(result.rows[0]) : null;
}

/**
 * Get all translations for a block
 */
export async function getAllBlockTranslations(blockId: number): Promise<CMSBlockTranslation[]> {
  const result = await pool.query(
    `SELECT * FROM cms_block_translations WHERE block_id = $1 ORDER BY language_code`,
    [blockId]
  );

  return result.rows.map(mapBlockTranslationFromDb);
}

// ============================================================================
// FOOTER SETTINGS MANAGEMENT
// ============================================================================

export interface FooterSettings {
  id: number;
  brandName: string;
  brandTagline: string | null;
  brandLogoUrl: string | null;
  footerColumns: any[];
  contactInfo: any;
  socialLinks: any[];
  newsletterEnabled: boolean;
  newsletterTitle: string;
  newsletterDescription: string;
  newsletterPlaceholder: string;
  newsletterButtonText: string;
  copyrightText: string | null;
  bottomLinks: any[];
  backgroundColor: string;
  textColor: string;
  accentColor: string;
  layoutType: string;
  columnsCount: number;
  showDividers: boolean;
  isPublished: boolean;
  updatedAt: string;
  createdAt: string;
}

export interface UpdateFooterPayload {
  brandName?: string;
  brandTagline?: string;
  brandLogoUrl?: string;
  footerColumns?: any[];
  contactInfo?: any;
  socialLinks?: any[];
  newsletterEnabled?: boolean;
  newsletterTitle?: string;
  newsletterDescription?: string;
  newsletterPlaceholder?: string;
  newsletterButtonText?: string;
  copyrightText?: string;
  bottomLinks?: any[];
  backgroundColor?: string;
  textColor?: string;
  accentColor?: string;
  layoutType?: string;
  columnsCount?: number;
  showDividers?: boolean;
  isPublished?: boolean;
}

/**
 * Get published footer settings (for public use)
 */
export async function getFooterSettings(): Promise<FooterSettings | null> {
  const result = await pool.query(
    'SELECT * FROM footer_settings WHERE is_published = true ORDER BY id DESC LIMIT 1'
  );

  return result.rows.length > 0 ? mapFooterFromDb(result.rows[0]) : null;
}

/**
 * Get footer settings for admin (including unpublished)
 */
export async function getFooterSettingsAdmin(): Promise<FooterSettings | null> {
  const result = await pool.query(
    'SELECT * FROM footer_settings ORDER BY id DESC LIMIT 1'
  );

  return result.rows.length > 0 ? mapFooterFromDb(result.rows[0]) : null;
}

/**
 * Update footer settings
 */
export async function updateFooterSettings(payload: UpdateFooterPayload): Promise<FooterSettings | null> {
  // Get the current footer settings (there should only be one row)
  const currentResult = await pool.query('SELECT id FROM footer_settings ORDER BY id DESC LIMIT 1');

  if (currentResult.rows.length === 0) {
    return null;
  }

  const footerId = currentResult.rows[0].id;

  const updates: string[] = [];
  const params: any[] = [];
  let paramCount = 1;

  if (payload.brandName !== undefined) {
    updates.push(`brand_name = $${paramCount++}`);
    params.push(payload.brandName);
  }

  if (payload.brandTagline !== undefined) {
    updates.push(`brand_tagline = $${paramCount++}`);
    params.push(payload.brandTagline);
  }

  if (payload.brandLogoUrl !== undefined) {
    updates.push(`brand_logo_url = $${paramCount++}`);
    params.push(payload.brandLogoUrl);
  }

  if (payload.footerColumns !== undefined) {
    updates.push(`footer_columns = $${paramCount++}`);
    params.push(JSON.stringify(payload.footerColumns));
  }

  if (payload.contactInfo !== undefined) {
    updates.push(`contact_info = $${paramCount++}`);
    params.push(JSON.stringify(payload.contactInfo));
  }

  if (payload.socialLinks !== undefined) {
    updates.push(`social_links = $${paramCount++}`);
    params.push(JSON.stringify(payload.socialLinks));
  }

  if (payload.newsletterEnabled !== undefined) {
    updates.push(`newsletter_enabled = $${paramCount++}`);
    params.push(payload.newsletterEnabled);
  }

  if (payload.newsletterTitle !== undefined) {
    updates.push(`newsletter_title = $${paramCount++}`);
    params.push(payload.newsletterTitle);
  }

  if (payload.newsletterDescription !== undefined) {
    updates.push(`newsletter_description = $${paramCount++}`);
    params.push(payload.newsletterDescription);
  }

  if (payload.newsletterPlaceholder !== undefined) {
    updates.push(`newsletter_placeholder = $${paramCount++}`);
    params.push(payload.newsletterPlaceholder);
  }

  if (payload.newsletterButtonText !== undefined) {
    updates.push(`newsletter_button_text = $${paramCount++}`);
    params.push(payload.newsletterButtonText);
  }

  if (payload.copyrightText !== undefined) {
    updates.push(`copyright_text = $${paramCount++}`);
    params.push(payload.copyrightText);
  }

  if (payload.bottomLinks !== undefined) {
    updates.push(`bottom_links = $${paramCount++}`);
    params.push(JSON.stringify(payload.bottomLinks));
  }

  if (payload.backgroundColor !== undefined) {
    updates.push(`background_color = $${paramCount++}`);
    params.push(payload.backgroundColor);
  }

  if (payload.textColor !== undefined) {
    updates.push(`text_color = $${paramCount++}`);
    params.push(payload.textColor);
  }

  if (payload.accentColor !== undefined) {
    updates.push(`accent_color = $${paramCount++}`);
    params.push(payload.accentColor);
  }

  if (payload.layoutType !== undefined) {
    updates.push(`layout_type = $${paramCount++}`);
    params.push(payload.layoutType);
  }

  if (payload.columnsCount !== undefined) {
    updates.push(`columns_count = $${paramCount++}`);
    params.push(payload.columnsCount);
  }

  if (payload.showDividers !== undefined) {
    updates.push(`show_dividers = $${paramCount++}`);
    params.push(payload.showDividers);
  }

  if (payload.isPublished !== undefined) {
    updates.push(`is_published = $${paramCount++}`);
    params.push(payload.isPublished);
  }

  if (updates.length === 0) {
    return getFooterSettingsAdmin();
  }

  params.push(footerId);
  const query = `UPDATE footer_settings SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`;

  const result = await pool.query(query, params);
  return mapFooterFromDb(result.rows[0]);
}

/**
 * Map database row to FooterSettings object
 */
function mapFooterFromDb(row: any): FooterSettings {
  return {
    id: row.id,
    brandName: row.brand_name,
    brandTagline: row.brand_tagline,
    brandLogoUrl: row.brand_logo_url,
    footerColumns: row.footer_columns,
    contactInfo: row.contact_info,
    socialLinks: row.social_links,
    newsletterEnabled: row.newsletter_enabled,
    newsletterTitle: row.newsletter_title,
    newsletterDescription: row.newsletter_description,
    newsletterPlaceholder: row.newsletter_placeholder,
    newsletterButtonText: row.newsletter_button_text,
    copyrightText: row.copyright_text,
    bottomLinks: row.bottom_links,
    backgroundColor: row.background_color,
    textColor: row.text_color,
    accentColor: row.accent_color,
    layoutType: row.layout_type,
    columnsCount: row.columns_count,
    showDividers: row.show_dividers,
    isPublished: row.is_published,
    updatedAt: row.updated_at,
    createdAt: row.created_at
  };
}
