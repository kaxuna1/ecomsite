import { Router } from 'express';
import multer from 'multer';
import * as reviewImageService from '../services/reviewImageService';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: reviewImageService.getMaxFileSize()
  }
});

/**
 * POST /api/review-images/upload
 * Upload a single review image
 * Public endpoint - no authentication required for customer reviews
 */
router.post('/upload', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided' });
    }

    const result = await reviewImageService.uploadReviewImage(req.file);
    res.status(201).json(result);
  } catch (error: any) {
    console.error('Error uploading review image:', error);
    res.status(400).json({ message: error.message || 'Failed to upload review image' });
  }
});

/**
 * POST /api/review-images/upload-multiple
 * Upload multiple review images
 * Public endpoint - no authentication required for customer reviews
 */
router.post('/upload-multiple', upload.array('images', 5), async (req, res) => {
  try {
    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      return res.status(400).json({ message: 'No image files provided' });
    }

    const results = await reviewImageService.uploadReviewImages(req.files);

    if (results.length === 0) {
      return res.status(400).json({ message: 'Failed to upload any images' });
    }

    res.status(201).json({
      images: results,
      uploadedCount: results.length
    });
  } catch (error: any) {
    console.error('Error uploading review images:', error);
    res.status(400).json({ message: error.message || 'Failed to upload review images' });
  }
});

export default router;
