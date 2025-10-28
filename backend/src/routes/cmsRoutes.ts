// CMS API Routes
// REST endpoints for managing CMS pages, blocks, and media

import { Router } from 'express';
import multer from 'multer';
import { body, param, query, validationResult } from 'express-validator';
import { authenticate as adminAuth } from '../middleware/authMiddleware';
import * as cmsService from '../services/cmsService';
import * as mediaService from '../services/mediaService';

const router = Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  }
});

// ============================================================================
// PUBLIC ROUTES (No authentication required)
// ============================================================================

/**
 * GET /api/cms/pages/:slug/public
 * Get published page content for frontend
 */
router.get(
  '/pages/:slug/public',
  [
    param('slug').isString().notEmpty(),
    query('lang').optional().isString()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const language = (req.query.lang as string) || 'en';
      const page = await cmsService.getPublicPage(req.params.slug, language);
      if (!page) {
        return res.status(404).json({ message: 'Page not found' });
      }

      res.json(page);
    } catch (error) {
      console.error('Error fetching public page:', error);
      res.status(500).json({ message: 'Error fetching page' });
    }
  }
);

// ============================================================================
// PAGE MANAGEMENT ROUTES (Admin only)
// ============================================================================

/**
 * GET /api/cms/pages
 * Get all pages with optional filtering
 */
router.get(
  '/pages',
  adminAuth,
  [
    query('slug').optional().isString(),
    query('isPublished').optional().isBoolean().toBoolean(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('offset').optional().isInt({ min: 0 }).toInt()
  ],
  async (req, res) => {
    try {
      const pages = await cmsService.getAllPages(req.query);
      res.json(pages);
    } catch (error) {
      console.error('Error fetching pages:', error);
      res.status(500).json({ message: 'Error fetching pages' });
    }
  }
);

/**
 * GET /api/cms/pages/:id
 * Get a single page by ID
 */
router.get(
  '/pages/:id',
  adminAuth,
  param('id').isInt({ min: 1 }).toInt(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const page = await cmsService.getPageById(parseInt(req.params.id));
      if (!page) {
        return res.status(404).json({ message: 'Page not found' });
      }

      res.json(page);
    } catch (error) {
      console.error('Error fetching page:', error);
      res.status(500).json({ message: 'Error fetching page' });
    }
  }
);

/**
 * GET /api/cms/pages/:id/full
 * Get page with all its blocks
 */
router.get(
  '/pages/:id/full',
  adminAuth,
  param('id').isInt({ min: 1 }).toInt(),
  async (req: any, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const page = await cmsService.getPageById(parseInt(req.params.id));
      if (!page) {
        return res.status(404).json({ message: 'Page not found' });
      }

      const fullPage = await cmsService.getPageWithBlocks(page.slug);
      res.json(fullPage);
    } catch (error) {
      console.error('Error fetching page with blocks:', error);
      res.status(500).json({ message: 'Error fetching page' });
    }
  }
);

/**
 * POST /api/cms/pages
 * Create a new page
 */
router.post(
  '/pages',
  adminAuth,
  [
    body('slug').isString().notEmpty().matches(/^[a-z0-9-]+$/),
    body('title').isString().notEmpty(),
    body('metaDescription').optional().isString(),
    body('metaKeywords').optional().isString(),
    body('isPublished').optional().isBoolean()
  ],
  async (req: any, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const page = await cmsService.createPage(req.body, req.adminId);
      res.status(201).json(page);
    } catch (error: any) {
      console.error('Error creating page:', error);
      if (error.code === '23505') {
        // Unique constraint violation
        return res.status(409).json({ message: 'Page with this slug already exists' });
      }
      res.status(500).json({ message: 'Error creating page' });
    }
  }
);

/**
 * PATCH /api/cms/pages/:id
 * Update an existing page
 */
router.patch(
  '/pages/:id',
  adminAuth,
  [
    param('id').isInt({ min: 1 }).toInt(),
    body('slug').optional().isString().matches(/^[a-z0-9-]+$/),
    body('title').optional().isString(),
    body('metaDescription').optional().isString(),
    body('metaKeywords').optional().isString(),
    body('isPublished').optional().isBoolean()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const page = await cmsService.updatePage(parseInt(req.params.id), req.body);
      if (!page) {
        return res.status(404).json({ message: 'Page not found' });
      }

      res.json(page);
    } catch (error: any) {
      console.error('Error updating page:', error);
      if (error.code === '23505') {
        return res.status(409).json({ message: 'Page with this slug already exists' });
      }
      res.status(500).json({ message: 'Error updating page' });
    }
  }
);

/**
 * DELETE /api/cms/pages/:id
 * Delete a page and all its blocks
 */
router.delete(
  '/pages/:id',
  adminAuth,
  param('id').isInt({ min: 1 }).toInt(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const deleted = await cmsService.deletePage(parseInt(req.params.id));
      if (!deleted) {
        return res.status(404).json({ message: 'Page not found' });
      }

      res.status(204).send();
    } catch (error) {
      console.error('Error deleting page:', error);
      res.status(500).json({ message: 'Error deleting page' });
    }
  }
);

// ============================================================================
// PAGE TRANSLATION ROUTES (Admin only)
// ============================================================================

/**
 * GET /api/cms/pages/:id/translations
 * Get all translations for a page
 */
router.get(
  '/pages/:id/translations',
  adminAuth,
  param('id').isInt({ min: 1 }).toInt(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const translations = await cmsService.getAllPageTranslations(parseInt(req.params.id));
      res.json(translations);
    } catch (error) {
      console.error('Error fetching page translations:', error);
      res.status(500).json({ message: 'Error fetching page translations' });
    }
  }
);

/**
 * GET /api/cms/pages/:id/translations/:lang
 * Get a specific translation for a page
 */
router.get(
  '/pages/:id/translations/:lang',
  adminAuth,
  [
    param('id').isInt({ min: 1 }).toInt(),
    param('lang').isString().notEmpty()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const translation = await cmsService.getPageTranslation(
        parseInt(req.params.id),
        req.params.lang
      );

      if (!translation) {
        return res.status(404).json({ message: 'Translation not found' });
      }

      res.json(translation);
    } catch (error) {
      console.error('Error fetching page translation:', error);
      res.status(500).json({ message: 'Error fetching page translation' });
    }
  }
);

/**
 * POST /api/cms/pages/:id/translations/:lang
 * Create or update a page translation
 */
router.post(
  '/pages/:id/translations/:lang',
  adminAuth,
  [
    param('id').isInt({ min: 1 }).toInt(),
    param('lang').isString().notEmpty(),
    body('title').isString().notEmpty(),
    body('slug').isString().notEmpty().matches(/^[a-z0-9-]+$/),
    body('metaTitle').optional().isString(),
    body('metaDescription').optional().isString()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const translation = await cmsService.createPageTranslation(
        parseInt(req.params.id),
        req.params.lang,
        req.body
      );

      res.status(201).json(translation);
    } catch (error: any) {
      console.error('Error creating page translation:', error);
      if (error.code === '23505') {
        return res.status(409).json({ message: 'Translation with this slug already exists for this language' });
      }
      if (error.code === '23503') {
        return res.status(404).json({ message: 'Page or language not found' });
      }
      res.status(500).json({ message: 'Error creating page translation' });
    }
  }
);

// ============================================================================
// BLOCK MANAGEMENT ROUTES (Admin only)
// ============================================================================

/**
 * GET /api/cms/blocks
 * Get blocks for a page
 */
router.get(
  '/blocks',
  adminAuth,
  [
    query('pageId').isInt({ min: 1 }).toInt(),
    query('blockType').optional().isString(),
    query('isEnabled').optional().isBoolean().toBoolean()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { pageId, ...filters } = req.query;
      const blocks = await cmsService.getBlocksByPageId(parseInt(pageId as string), filters);
      res.json(blocks);
    } catch (error) {
      console.error('Error fetching blocks:', error);
      res.status(500).json({ message: 'Error fetching blocks' });
    }
  }
);

/**
 * GET /api/cms/blocks/:id
 * Get a single block by ID
 */
router.get(
  '/blocks/:id',
  adminAuth,
  param('id').isInt({ min: 1 }).toInt(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const block = await cmsService.getBlockById(parseInt(req.params.id));
      if (!block) {
        return res.status(404).json({ message: 'Block not found' });
      }

      res.json(block);
    } catch (error) {
      console.error('Error fetching block:', error);
      res.status(500).json({ message: 'Error fetching block' });
    }
  }
);

/**
 * GET /api/cms/blocks/:id/versions
 * Get block with version history
 */
router.get(
  '/blocks/:id/versions',
  adminAuth,
  param('id').isInt({ min: 1 }).toInt(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const block = await cmsService.getBlockWithVersions(parseInt(req.params.id));
      if (!block) {
        return res.status(404).json({ message: 'Block not found' });
      }

      res.json(block);
    } catch (error) {
      console.error('Error fetching block versions:', error);
      res.status(500).json({ message: 'Error fetching block versions' });
    }
  }
);

/**
 * POST /api/cms/blocks
 * Create a new block
 */
router.post(
  '/blocks',
  adminAuth,
  [
    body('pageId').isInt({ min: 1 }),
    body('blockType').isString().notEmpty(),
    body('blockKey').isString().notEmpty(),
    body('displayOrder').isInt({ min: 0 }),
    body('content').isObject(),
    body('settings').optional().isObject(),
    body('isEnabled').optional().isBoolean()
  ],
  async (req: any, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const block = await cmsService.createBlock(req.body, req.adminId);
      res.status(201).json(block);
    } catch (error: any) {
      console.error('Error creating block:', error);
      if (error.code === '23505') {
        return res.status(409).json({ message: 'Block with this key already exists on this page' });
      }
      res.status(500).json({ message: 'Error creating block' });
    }
  }
);

/**
 * PATCH /api/cms/blocks/:id
 * Update an existing block
 */
router.patch(
  '/blocks/:id',
  adminAuth,
  [
    param('id').isInt({ min: 1 }).toInt(),
    body('blockType').optional().isString(),
    body('blockKey').optional().isString(),
    body('displayOrder').optional().isInt({ min: 0 }),
    body('content').optional().isObject(),
    body('settings').optional().isObject(),
    body('isEnabled').optional().isBoolean()
  ],
  async (req: any, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const block = await cmsService.updateBlock(
        parseInt(req.params.id),
        req.body,
        req.adminId
      );

      if (!block) {
        return res.status(404).json({ message: 'Block not found' });
      }

      res.json(block);
    } catch (error: any) {
      console.error('Error updating block:', error);
      if (error.code === '23505') {
        return res.status(409).json({ message: 'Block with this key already exists on this page' });
      }
      res.status(500).json({ message: 'Error updating block' });
    }
  }
);

/**
 * DELETE /api/cms/blocks/:id
 * Delete a block
 */
router.delete(
  '/blocks/:id',
  adminAuth,
  param('id').isInt({ min: 1 }).toInt(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const deleted = await cmsService.deleteBlock(parseInt(req.params.id));
      if (!deleted) {
        return res.status(404).json({ message: 'Block not found' });
      }

      res.status(204).send();
    } catch (error) {
      console.error('Error deleting block:', error);
      res.status(500).json({ message: 'Error deleting block' });
    }
  }
);

/**
 * POST /api/cms/blocks/reorder
 * Reorder blocks on a page
 */
router.post(
  '/blocks/reorder',
  adminAuth,
  [
    body('pageId').isInt({ min: 1 }),
    body('blockOrders').isArray({ min: 1 }),
    body('blockOrders.*.blockId').isInt({ min: 1 }),
    body('blockOrders.*.displayOrder').isInt({ min: 0 })
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const blocks = await cmsService.reorderBlocks(req.body);
      res.json(blocks);
    } catch (error) {
      console.error('Error reordering blocks:', error);
      res.status(500).json({ message: 'Error reordering blocks' });
    }
  }
);

/**
 * POST /api/cms/blocks/:id/restore/:version
 * Restore block to a previous version
 */
router.post(
  '/blocks/:id/restore/:version',
  adminAuth,
  [
    param('id').isInt({ min: 1 }).toInt(),
    param('version').isInt({ min: 1 }).toInt()
  ],
  async (req: any, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const block = await cmsService.restoreBlockVersion(
        parseInt(req.params.id),
        parseInt(req.params.version),
        req.adminId
      );

      if (!block) {
        return res.status(404).json({ message: 'Block or version not found' });
      }

      res.json(block);
    } catch (error) {
      console.error('Error restoring block version:', error);
      res.status(500).json({ message: 'Error restoring block version' });
    }
  }
);

// ============================================================================
// BLOCK TRANSLATION ROUTES (Admin only)
// ============================================================================

/**
 * GET /api/cms/blocks/:id/translations
 * Get all translations for a block
 */
router.get(
  '/blocks/:id/translations',
  adminAuth,
  param('id').isInt({ min: 1 }).toInt(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const translations = await cmsService.getAllBlockTranslations(parseInt(req.params.id));
      res.json(translations);
    } catch (error) {
      console.error('Error fetching block translations:', error);
      res.status(500).json({ message: 'Error fetching block translations' });
    }
  }
);

/**
 * GET /api/cms/blocks/:id/translations/:lang
 * Get a specific translation for a block
 */
router.get(
  '/blocks/:id/translations/:lang',
  adminAuth,
  [
    param('id').isInt({ min: 1 }).toInt(),
    param('lang').isString().notEmpty()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const translation = await cmsService.getBlockTranslation(
        parseInt(req.params.id),
        req.params.lang
      );

      if (!translation) {
        return res.status(404).json({ message: 'Translation not found' });
      }

      res.json(translation);
    } catch (error) {
      console.error('Error fetching block translation:', error);
      res.status(500).json({ message: 'Error fetching block translation' });
    }
  }
);

/**
 * POST /api/cms/blocks/:id/translations/:lang
 * Create or update a block translation
 */
router.post(
  '/blocks/:id/translations/:lang',
  adminAuth,
  [
    param('id').isInt({ min: 1 }).toInt(),
    param('lang').isString().notEmpty(),
    body('content').isObject().notEmpty()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const translation = await cmsService.createBlockTranslation(
        parseInt(req.params.id),
        req.params.lang,
        req.body.content
      );

      res.status(201).json(translation);
    } catch (error: any) {
      console.error('Error creating block translation:', error);
      if (error.code === '23503') {
        return res.status(404).json({ message: 'Block or language not found' });
      }
      res.status(500).json({ message: 'Error creating block translation' });
    }
  }
);

// ============================================================================
// MEDIA MANAGEMENT ROUTES (Admin only)
// ============================================================================

/**
 * GET /api/cms/media
 * Get all media with optional filtering
 */
router.get(
  '/media',
  adminAuth,
  [
    query('mimeType').optional().isString(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('offset').optional().isInt({ min: 0 }).toInt()
  ],
  async (req, res) => {
    try {
      const media = await mediaService.getAllMediaWithUrls(req.query);
      res.json(media);
    } catch (error) {
      console.error('Error fetching media:', error);
      res.status(500).json({ message: 'Error fetching media' });
    }
  }
);

/**
 * GET /api/cms/media/:id
 * Get a single media item
 */
router.get(
  '/media/:id',
  adminAuth,
  param('id').isInt({ min: 1 }).toInt(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const media = await mediaService.getMediaWithUrl(parseInt(req.params.id));
      if (!media) {
        return res.status(404).json({ message: 'Media not found' });
      }

      res.json(media);
    } catch (error) {
      console.error('Error fetching media:', error);
      res.status(500).json({ message: 'Error fetching media' });
    }
  }
);

/**
 * POST /api/cms/media/upload
 * Upload a new media file
 */
router.post(
  '/media/upload',
  adminAuth,
  upload.single('file'),
  [
    body('altText').optional().isString(),
    body('caption').optional().isString()
  ],
  async (req: any, res) => {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const media = await mediaService.uploadMedia(
        req.file,
        req.body.altText,
        req.body.caption,
        req.adminId
      );

      res.status(201).json(media);
    } catch (error: any) {
      console.error('Error uploading media:', error);
      res.status(400).json({ message: error.message || 'Error uploading file' });
    }
  }
);

/**
 * PATCH /api/cms/media/:id
 * Update media metadata
 */
router.patch(
  '/media/:id',
  adminAuth,
  [
    param('id').isInt({ min: 1 }).toInt(),
    body('altText').optional().isString(),
    body('caption').optional().isString()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const media = await mediaService.updateMedia(parseInt(req.params.id), req.body);
      if (!media) {
        return res.status(404).json({ message: 'Media not found' });
      }

      res.json(media);
    } catch (error) {
      console.error('Error updating media:', error);
      res.status(500).json({ message: 'Error updating media' });
    }
  }
);

/**
 * DELETE /api/cms/media/:id
 * Delete a media file
 */
router.delete(
  '/media/:id',
  adminAuth,
  param('id').isInt({ min: 1 }).toInt(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const deleted = await mediaService.deleteMedia(parseInt(req.params.id));
      if (!deleted) {
        return res.status(404).json({ message: 'Media not found' });
      }

      res.status(204).send();
    } catch (error) {
      console.error('Error deleting media:', error);
      res.status(500).json({ message: 'Error deleting media' });
    }
  }
);

// ============================================================================
// FOOTER SETTINGS ROUTES
// ============================================================================

/**
 * GET /api/cms/footer
 * Get published footer settings (public endpoint)
 */
router.get('/footer', async (req, res) => {
  try {
    const footer = await cmsService.getFooterSettings();
    if (!footer) {
      return res.status(404).json({ message: 'Footer settings not found' });
    }

    res.json(footer);
  } catch (error) {
    console.error('Error fetching footer settings:', error);
    res.status(500).json({ message: 'Error fetching footer settings' });
  }
});

/**
 * GET /api/cms/admin/footer
 * Get footer settings for admin editing
 */
router.get('/admin/footer', adminAuth, async (req, res) => {
  try {
    const footer = await cmsService.getFooterSettingsAdmin();
    if (!footer) {
      return res.status(404).json({ message: 'Footer settings not found' });
    }

    res.json(footer);
  } catch (error) {
    console.error('Error fetching footer settings for admin:', error);
    res.status(500).json({ message: 'Error fetching footer settings' });
  }
});

/**
 * PUT /api/cms/admin/footer
 * Update footer settings
 */
router.put(
  '/admin/footer',
  adminAuth,
  [
    body('brandName').optional().isString(),
    body('brandTagline').optional().isString(),
    body('brandLogoUrl').optional().isString(),
    body('footerColumns').optional().isArray(),
    body('contactInfo').optional().isObject(),
    body('socialLinks').optional().isArray(),
    body('newsletterEnabled').optional().isBoolean(),
    body('newsletterTitle').optional().isString(),
    body('newsletterDescription').optional().isString(),
    body('newsletterPlaceholder').optional().isString(),
    body('newsletterButtonText').optional().isString(),
    body('copyrightText').optional().isString(),
    body('bottomLinks').optional().isArray(),
    body('backgroundColor').optional().isString(),
    body('textColor').optional().isString(),
    body('accentColor').optional().isString(),
    body('layoutType').optional().isString(),
    body('columnsCount').optional().isInt({ min: 1, max: 6 }),
    body('showDividers').optional().isBoolean(),
    body('isPublished').optional().isBoolean()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const footer = await cmsService.updateFooterSettings(req.body);
      if (!footer) {
        return res.status(404).json({ message: 'Footer settings not found' });
      }

      res.json(footer);
    } catch (error) {
      console.error('Error updating footer settings:', error);
      res.status(500).json({ message: 'Error updating footer settings' });
    }
  }
);

export default router;
