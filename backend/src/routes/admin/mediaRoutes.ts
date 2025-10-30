import { Router, Response } from 'express';
import multer from 'multer';
import { authenticate, AuthenticatedRequest } from '../../middleware/authMiddleware';
import * as mediaService from '../../services/mediaService';
import { pool } from '../../db/client';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/admin/media
 * List all media with filtering and pagination
 */
router.get('/', async (req, res) => {
  try {
    const filters = {
      search: req.query.search as string,
      mimeType: req.query.mimeType as string,
      categoryId: req.query.categoryId ? Number(req.query.categoryId) : undefined,
      uploadedBy: req.query.uploadedBy ? Number(req.query.uploadedBy) : undefined,
      minWidth: req.query.minWidth ? Number(req.query.minWidth) : undefined,
      minHeight: req.query.minHeight ? Number(req.query.minHeight) : undefined,
      includeDeleted: req.query.includeDeleted === 'true',
      limit: req.query.limit ? Number(req.query.limit) : 50,
      offset: req.query.offset ? Number(req.query.offset) : 0
    };

    const media = await mediaService.getAllMediaWithUrls(filters);
    res.json(media);
  } catch (error: any) {
    console.error('Error fetching media:', error);
    res.status(500).json({ message: error.message || 'Failed to fetch media' });
  }
});

/**
 * GET /api/admin/media/:id
 * Get single media item with full details
 */
router.get('/:id', async (req, res) => {
  try {
    const mediaId = Number(req.params.id);
    const media = await mediaService.getMediaWithUrl(mediaId);

    if (!media) {
      return res.status(404).json({ message: 'Media not found' });
    }

    // Get tags for this media
    const tags = await mediaService.getMediaTags(mediaId);

    res.json({
      ...media,
      tags
    });
  } catch (error: any) {
    console.error('Error fetching media:', error);
    res.status(500).json({ message: error.message || 'Failed to fetch media' });
  }
});

/**
 * GET /api/admin/media/:id/usage
 * Get usage details for a media item
 */
router.get('/:id/usage', async (req, res) => {
  try {
    const mediaId = Number(req.params.id);
    const usageData = await mediaService.getMediaWithUsage(mediaId);

    if (!usageData) {
      return res.status(404).json({ message: 'Media not found' });
    }

    res.json(usageData);
  } catch (error: any) {
    console.error('Error fetching media usage:', error);
    res.status(500).json({ message: error.message || 'Failed to fetch media usage' });
  }
});

/**
 * POST /api/admin/media
 * Upload new media file
 */
router.post('/', upload.single('file'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file provided' });
    }

    const { altText, caption, categoryId, tags } = req.body;

    const media = await mediaService.uploadMedia(
      req.file,
      altText,
      caption,
      req.adminId
    );

    // Update category if provided
    if (categoryId) {
      await mediaService.updateMedia(media.id, { categoryId: Number(categoryId) });
    }

    // Attach tags if provided
    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : JSON.parse(tags);
      const tagIds = await Promise.all(
        tagArray.map(async (tagName: string) => {
          const tag = await mediaService.createOrGetTag(tagName);
          return tag.id;
        })
      );
      await mediaService.attachTags(media.id, tagIds);
    }

    // Return updated media with URL
    const updatedMedia = await mediaService.getMediaWithUrl(media.id);
    const mediaTags = await mediaService.getMediaTags(media.id);

    res.status(201).json({
      ...updatedMedia,
      tags: mediaTags
    });
  } catch (error: any) {
    console.error('Error uploading media:', error);
    res.status(400).json({ message: error.message || 'Failed to upload media' });
  }
});

/**
 * PUT /api/admin/media/:id
 * Update media metadata
 */
router.put('/:id', async (req, res) => {
  try {
    const mediaId = Number(req.params.id);
    const { altText, caption, categoryId, tags } = req.body;

    const updateData: any = {};
    if (altText !== undefined) updateData.altText = altText;
    if (caption !== undefined) updateData.caption = caption;
    if (categoryId !== undefined) updateData.categoryId = Number(categoryId) || null;

    const media = await mediaService.updateMedia(mediaId, updateData);

    if (!media) {
      return res.status(404).json({ message: 'Media not found' });
    }

    // Update tags if provided
    if (tags !== undefined) {
      const tagArray = Array.isArray(tags) ? tags : JSON.parse(tags);
      const tagIds = await Promise.all(
        tagArray.map(async (tagName: string) => {
          const tag = await mediaService.createOrGetTag(tagName);
          return tag.id;
        })
      );
      await mediaService.attachTags(mediaId, tagIds);
    }

    // Return updated media
    const updatedMedia = await mediaService.getMediaWithUrl(mediaId);
    const mediaTags = await mediaService.getMediaTags(mediaId);

    res.json({
      ...updatedMedia,
      tags: mediaTags
    });
  } catch (error: any) {
    console.error('Error updating media:', error);
    res.status(400).json({ message: error.message || 'Failed to update media' });
  }
});

/**
 * DELETE /api/admin/media/:id
 * Delete media (soft delete if in use, hard delete otherwise)
 */
router.delete('/:id', async (req, res) => {
  try {
    const mediaId = Number(req.params.id);
    const success = await mediaService.deleteMedia(mediaId);

    if (!success) {
      return res.status(404).json({ message: 'Media not found' });
    }

    res.status(204).send();
  } catch (error: any) {
    console.error('Error deleting media:', error);
    res.status(500).json({ message: error.message || 'Failed to delete media' });
  }
});

/**
 * POST /api/admin/media/:id/restore
 * Restore soft-deleted media
 */
router.post('/:id/restore', async (req, res) => {
  try {
    const mediaId = Number(req.params.id);
    const success = await mediaService.restoreMedia(mediaId);

    if (!success) {
      return res.status(404).json({ message: 'Media not found' });
    }

    const media = await mediaService.getMediaWithUrl(mediaId);
    res.json(media);
  } catch (error: any) {
    console.error('Error restoring media:', error);
    res.status(500).json({ message: error.message || 'Failed to restore media' });
  }
});

/**
 * GET /api/admin/media/categories/list
 * Get all media categories
 */
router.get('/categories/list', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM media_categories ORDER BY name ASC'
    );
    res.json(result.rows);
  } catch (error: any) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ message: error.message || 'Failed to fetch categories' });
  }
});

/**
 * GET /api/admin/media/tags/list
 * Get all media tags
 */
router.get('/tags/list', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM media_tags ORDER BY name ASC'
    );
    res.json(result.rows);
  } catch (error: any) {
    console.error('Error fetching tags:', error);
    res.status(500).json({ message: error.message || 'Failed to fetch tags' });
  }
});

export default router;
