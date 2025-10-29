import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authenticate } from '../middleware/authMiddleware';
import {
  getAllSettings,
  updateSettings,
  getPublicLogoSettings,
  isValidLogoType
} from '../services/settingsService';

const router = Router();

// Configure multer for logo image uploads
const logoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/logo';
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'logo-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const uploadLogo = multer({
  storage: logoStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only images allowed'));
    }
  }
});

// ============================================================================
// PUBLIC ROUTES
// ============================================================================

/**
 * GET /api/settings/public
 * Get public logo settings for frontend navigation
 */
router.get('/public', async (req, res) => {
  try {
    const logoSettings = await getPublicLogoSettings();
    res.json(logoSettings);
  } catch (error: any) {
    console.error('Error fetching public settings:', error);
    res.status(500).json({ message: error.message ?? 'Internal server error' });
  }
});

// ============================================================================
// ADMIN ROUTES (require authentication)
// ============================================================================

/**
 * GET /api/settings
 * Get all settings (admin only)
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const settings = await getAllSettings();
    res.json(settings);
  } catch (error: any) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ message: error.message ?? 'Internal server error' });
  }
});

/**
 * PUT /api/settings
 * Update multiple settings at once (admin only)
 */
router.put('/', authenticate, async (req, res) => {
  try {
    const { logoType, logoText, logoImageUrl } = req.body;

    // Validate logo_type if provided
    if (logoType !== undefined && !isValidLogoType(logoType)) {
      return res.status(400).json({
        message: 'Invalid logo type. Must be either "text" or "image"'
      });
    }

    const updates: Record<string, string | null> = {};

    if (logoType !== undefined) {
      updates.logoType = logoType;
    }

    if (logoText !== undefined) {
      updates.logoText = logoText;
    }

    if (logoImageUrl !== undefined) {
      updates.logoImageUrl = logoImageUrl;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: 'No settings provided to update' });
    }

    await updateSettings(updates);

    // Return updated settings
    const settings = await getAllSettings();
    res.json(settings);
  } catch (error: any) {
    console.error('Error updating settings:', error);
    res.status(400).json({ message: error.message ?? 'Invalid payload' });
  }
});

/**
 * POST /api/settings/logo
 * Upload logo image (admin only)
 */
router.post('/logo', authenticate, uploadLogo.single('logo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Logo image is required' });
    }

    // Generate URL for the uploaded file
    const imageUrl = `/uploads/logo/${req.file.filename}`;

    // Update the logo_image_url setting
    await updateSettings({
      logoImageUrl: imageUrl
    });

    res.json({ url: imageUrl });
  } catch (error: any) {
    console.error('Error uploading logo:', error);
    res.status(500).json({ message: error.message ?? 'Error uploading logo' });
  }
});

export default router;
