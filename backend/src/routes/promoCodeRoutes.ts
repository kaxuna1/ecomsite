import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { promoCodeService } from '../services/promoCodeService';
import { authenticate, AuthenticatedRequest } from '../middleware/authMiddleware';

const router = Router();

// PUBLIC ROUTE - Validate promo code
router.post(
  '/validate',
  [
    body('code').isString().trim().notEmpty().withMessage('Promo code is required'),
    body('cartTotal').isFloat({ min: 0 }).withMessage('Valid cart total is required')
  ],
  async (req: AuthenticatedRequest, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { code, cartTotal } = req.body;
      const userId = req.userId; // From auth middleware if user is logged in

      const validation = await promoCodeService.validate(code, cartTotal, userId);

      if (!validation.valid) {
        return res.status(400).json({ message: validation.error });
      }

      res.json({
        valid: true,
        promoCode: {
          id: validation.promoCode!.id,
          code: validation.promoCode!.code,
          discountType: validation.promoCode!.discountType,
          discountValue: validation.promoCode!.discountValue
        },
        discountAmount: validation.discountAmount
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message ?? 'Internal server error' });
    }
  }
);

// ADMIN ROUTES - Protected
// Get all promo codes
router.get('/', authenticate, async (req, res) => {
  try {
    const promoCodes = await promoCodeService.list();
    res.json(promoCodes);
  } catch (error: any) {
    res.status(500).json({ message: error.message ?? 'Internal server error' });
  }
});

// Get single promo code
router.get('/:id', authenticate, async (req, res) => {
  try {
    const promoCode = await promoCodeService.getById(Number(req.params.id));

    if (!promoCode) {
      return res.status(404).json({ message: 'Promo code not found' });
    }

    res.json(promoCode);
  } catch (error: any) {
    res.status(500).json({ message: error.message ?? 'Internal server error' });
  }
});

// Get promo code statistics
router.get('/:id/stats', authenticate, async (req, res) => {
  try {
    const stats = await promoCodeService.getStats(Number(req.params.id));
    res.json(stats);
  } catch (error: any) {
    res.status(500).json({ message: error.message ?? 'Internal server error' });
  }
});

// Create promo code
router.post(
  '/',
  authenticate,
  [
    body('code').isString().trim().notEmpty().withMessage('Code is required'),
    body('discountType')
      .isIn(['PERCENTAGE', 'FIXED_AMOUNT', 'FREE_SHIPPING'])
      .withMessage('Valid discount type is required'),
    body('discountValue').isFloat({ min: 0 }).withMessage('Discount value must be positive'),
    body('validFrom').isISO8601().withMessage('Valid start date is required'),
    body('validUntil').isISO8601().withMessage('Valid end date is required')
  ],
  async (req: AuthenticatedRequest, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const promoCode = await promoCodeService.create({
        ...req.body,
        validFrom: new Date(req.body.validFrom),
        validUntil: new Date(req.body.validUntil),
        createdBy: req.userId
      });

      res.status(201).json(promoCode);
    } catch (error: any) {
      if (error.code === '23505') {
        // Unique constraint violation
        return res.status(409).json({ message: 'Promo code already exists' });
      }
      res.status(500).json({ message: error.message ?? 'Internal server error' });
    }
  }
);

// Update promo code
router.patch(
  '/:id',
  authenticate,
  [
    body('code').optional().isString().trim().notEmpty(),
    body('discountType').optional().isIn(['PERCENTAGE', 'FIXED_AMOUNT', 'FREE_SHIPPING']),
    body('discountValue').optional().isFloat({ min: 0 }),
    body('validFrom').optional().isISO8601(),
    body('validUntil').optional().isISO8601()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const payload = { ...req.body };

      if (payload.validFrom) {
        payload.validFrom = new Date(payload.validFrom);
      }
      if (payload.validUntil) {
        payload.validUntil = new Date(payload.validUntil);
      }

      const promoCode = await promoCodeService.update(Number(req.params.id), payload);

      if (!promoCode) {
        return res.status(404).json({ message: 'Promo code not found' });
      }

      res.json(promoCode);
    } catch (error: any) {
      if (error.code === '23505') {
        return res.status(409).json({ message: 'Promo code already exists' });
      }
      res.status(500).json({ message: error.message ?? 'Internal server error' });
    }
  }
);

// Delete promo code
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const deleted = await promoCodeService.delete(Number(req.params.id));

    if (!deleted) {
      return res.status(404).json({ message: 'Promo code not found' });
    }

    res.status(204).send();
  } catch (error: any) {
    res.status(500).json({ message: error.message ?? 'Internal server error' });
  }
});

export default router;
