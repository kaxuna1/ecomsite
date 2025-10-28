import { Router } from 'express';
import { param, validationResult } from 'express-validator';
import { favoritesService } from '../services/favoritesService';
import { authenticate, AuthenticatedRequest } from '../middleware/authMiddleware';

const router = Router();

// All routes are protected - user must be authenticated
router.use(authenticate);

// GET /api/favorites - Get user's favorite products
router.get('/', async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'User ID not found in token' });
    }

    const favorites = await favoritesService.getFavorites(req.userId);
    res.json(favorites);
  } catch (error: any) {
    res.status(500).json({ message: error.message ?? 'Internal server error' });
  }
});

// POST /api/favorites/:productId - Add product to favorites
router.post(
  '/:productId',
  [param('productId').isInt({ min: 1 }).withMessage('Valid product ID is required')],
  async (req: AuthenticatedRequest, res: any) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      if (!req.userId) {
        return res.status(401).json({ message: 'User ID not found in token' });
      }

      const productId = Number(req.params.productId);
      const added = await favoritesService.addFavorite(req.userId, productId);

      if (!added) {
        return res.status(409).json({ message: 'Product is already in favorites' });
      }

      res.status(201).json({ message: 'Product added to favorites', productId });
    } catch (error: any) {
      if (error.message === 'Product not found') {
        return res.status(404).json({ message: 'Product not found' });
      }
      res.status(500).json({ message: error.message ?? 'Internal server error' });
    }
  }
);

// DELETE /api/favorites/:productId - Remove product from favorites
router.delete(
  '/:productId',
  [param('productId').isInt({ min: 1 }).withMessage('Valid product ID is required')],
  async (req: AuthenticatedRequest, res: any) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      if (!req.userId) {
        return res.status(401).json({ message: 'User ID not found in token' });
      }

      const productId = Number(req.params.productId);
      const removed = await favoritesService.removeFavorite(req.userId, productId);

      if (!removed) {
        return res.status(404).json({ message: 'Product not found in favorites' });
      }

      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ message: error.message ?? 'Internal server error' });
    }
  }
);

export default router;
