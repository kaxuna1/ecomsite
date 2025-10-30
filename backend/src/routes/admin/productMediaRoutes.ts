import { Router } from 'express';
import { authenticate } from '../../middleware/authMiddleware';
import * as productMediaService from '../../services/productMediaService';
import { getMediaUrl } from '../../utils/urlHelper';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/admin/products/:productId/media
 * Get all media for a product
 */
router.get('/products/:productId/media', async (req, res) => {
  try {
    const productId = Number(req.params.productId);
    const media = await productMediaService.getProductMedia(productId);

    // Add URLs to media - use absolute URLs for cross-port compatibility
    const mediaWithUrls = media.map(m => ({
      ...m,
      url: m.filename ? getMediaUrl(m.filename) : null
    }));

    res.json(mediaWithUrls);
  } catch (error: any) {
    console.error('Error fetching product media:', error);
    res.status(500).json({ message: error.message || 'Failed to fetch product media' });
  }
});

/**
 * POST /api/admin/products/:productId/media
 * Attach existing media to product
 */
router.post('/products/:productId/media', async (req, res) => {
  try {
    const productId = Number(req.params.productId);
    const { mediaId, isFeatured, displayOrder } = req.body;

    if (!mediaId) {
      return res.status(400).json({ message: 'mediaId is required' });
    }

    const link = await productMediaService.attachMediaToProduct(productId, Number(mediaId), {
      isFeatured: isFeatured === true,
      displayOrder: displayOrder !== undefined ? Number(displayOrder) : 0
    });

    res.status(201).json(link);
  } catch (error: any) {
    console.error('Error attaching media to product:', error);
    res.status(400).json({ message: error.message || 'Failed to attach media' });
  }
});

/**
 * DELETE /api/admin/products/:productId/media/:mediaId
 * Detach media from product
 */
router.delete('/products/:productId/media/:mediaId', async (req, res) => {
  try {
    const productId = Number(req.params.productId);
    const mediaId = Number(req.params.mediaId);

    const success = await productMediaService.detachMediaFromProduct(productId, mediaId);

    if (!success) {
      return res.status(404).json({ message: 'Media not attached to this product' });
    }

    res.status(204).send();
  } catch (error: any) {
    console.error('Error detaching media:', error);
    res.status(500).json({ message: error.message || 'Failed to detach media' });
  }
});

/**
 * PUT /api/admin/products/:productId/media/reorder
 * Reorder product media
 */
router.put('/products/:productId/media/reorder', async (req, res) => {
  try {
    const productId = Number(req.params.productId);
    const { mediaIds } = req.body;

    if (!Array.isArray(mediaIds)) {
      return res.status(400).json({ message: 'mediaIds must be an array' });
    }

    await productMediaService.reorderProductMedia(productId, mediaIds);

    res.json({ success: true });
  } catch (error: any) {
    console.error('Error reordering media:', error);
    res.status(400).json({ message: error.message || 'Failed to reorder media' });
  }
});

/**
 * PUT /api/admin/products/:productId/media/:mediaId/featured
 * Set media as featured for product
 */
router.put('/products/:productId/media/:mediaId/featured', async (req, res) => {
  try {
    const productId = Number(req.params.productId);
    const mediaId = Number(req.params.mediaId);

    await productMediaService.setFeaturedImage(productId, mediaId);

    res.json({ success: true });
  } catch (error: any) {
    console.error('Error setting featured image:', error);
    res.status(400).json({ message: error.message || 'Failed to set featured image' });
  }
});

export default router;
