import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { languageService } from '../services/languageService';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

// Public routes

// Get all enabled languages
router.get('/', async (req, res) => {
  try {
    const includeDisabled = req.query.includeDisabled === 'true';
    const languages = await languageService.list(includeDisabled);
    res.json(languages);
  } catch (error: any) {
    res.status(500).json({ message: error.message ?? 'Internal server error' });
  }
});

// Get specific language by code
router.get('/:code', async (req, res) => {
  try {
    const language = await languageService.getByCode(req.params.code);

    if (!language) {
      return res.status(404).json({ message: 'Language not found' });
    }

    res.json(language);
  } catch (error: any) {
    res.status(500).json({ message: error.message ?? 'Internal server error' });
  }
});

// Get default language
router.get('/default/language', async (req, res) => {
  try {
    const language = await languageService.getDefault();
    res.json(language);
  } catch (error: any) {
    res.status(500).json({ message: error.message ?? 'Internal server error' });
  }
});

// Admin routes (require authentication)

// Create new language
router.post(
  '/',
  authenticate,
  [
    body('code').trim().isLength({ min: 2, max: 5 }).withMessage('Language code must be 2-5 characters'),
    body('name').trim().notEmpty().withMessage('Language name is required'),
    body('nativeName').trim().notEmpty().withMessage('Native name is required'),
    body('isDefault').optional().isBoolean().withMessage('isDefault must be a boolean'),
    body('isEnabled').optional().isBoolean().withMessage('isEnabled must be a boolean'),
    body('displayOrder').optional().isInt({ min: 0 }).withMessage('displayOrder must be a positive integer')
  ],
  async (req: any, res: any) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const language = await languageService.create(req.body);
      res.status(201).json(language);
    } catch (error: any) {
      if (error.message.includes('already exists')) {
        return res.status(409).json({ message: error.message });
      }
      res.status(500).json({ message: error.message ?? 'Internal server error' });
    }
  }
);

// Update language
router.put(
  '/:code',
  authenticate,
  [
    body('name').optional().trim().notEmpty().withMessage('Language name cannot be empty'),
    body('nativeName').optional().trim().notEmpty().withMessage('Native name cannot be empty'),
    body('isDefault').optional().isBoolean().withMessage('isDefault must be a boolean'),
    body('isEnabled').optional().isBoolean().withMessage('isEnabled must be a boolean'),
    body('displayOrder').optional().isInt({ min: 0 }).withMessage('displayOrder must be a positive integer')
  ],
  async (req: any, res: any) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const language = await languageService.update(req.params.code, req.body);
      res.json(language);
    } catch (error: any) {
      if (error.message.includes('not found')) {
        return res.status(404).json({ message: error.message });
      }
      res.status(500).json({ message: error.message ?? 'Internal server error' });
    }
  }
);

// Delete language
router.delete('/:code', authenticate, async (req, res) => {
  try {
    await languageService.delete(req.params.code);
    res.status(204).send();
  } catch (error: any) {
    if (error.message.includes('not found')) {
      return res.status(404).json({ message: error.message });
    }
    if (error.message.includes('Cannot delete')) {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: error.message ?? 'Internal server error' });
  }
});

// Toggle language enabled status
router.patch('/:code/toggle', authenticate, async (req, res) => {
  try {
    const language = await languageService.toggleEnabled(req.params.code);
    res.json(language);
  } catch (error: any) {
    if (error.message.includes('not found')) {
      return res.status(404).json({ message: error.message });
    }
    if (error.message.includes('Cannot disable')) {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: error.message ?? 'Internal server error' });
  }
});

export default router;
