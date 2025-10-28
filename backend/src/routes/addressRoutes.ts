import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { addressService } from '../services/addressService';
import { userAuth } from '../middleware/authMiddleware';

const router = Router();

// All address routes require authentication (only for regular users)
router.use(userAuth);

// Get all addresses for current user
router.get('/', async (req: any, res) => {
  try {
    const addresses = await addressService.listByUserId(req.userId);
    res.json(addresses);
  } catch (error: any) {
    res.status(500).json({ message: error.message ?? 'Internal server error' });
  }
});

// Get default address
router.get('/default', async (req: any, res) => {
  try {
    const address = await addressService.getDefault(req.userId);
    if (!address) {
      return res.status(404).json({ message: 'No default address found' });
    }
    res.json(address);
  } catch (error: any) {
    res.status(500).json({ message: error.message ?? 'Internal server error' });
  }
});

// Get single address by ID
router.get('/:id', async (req: any, res) => {
  try {
    const address = await addressService.getById(Number(req.params.id), req.userId);
    if (!address) {
      return res.status(404).json({ message: 'Address not found' });
    }
    res.json(address);
  } catch (error: any) {
    res.status(500).json({ message: error.message ?? 'Internal server error' });
  }
});

// Create new address
router.post(
  '/',
  [
    body('name').isString().notEmpty().withMessage('Name is required'),
    body('addressLine1').isString().notEmpty().withMessage('Address line 1 is required'),
    body('city').isString().notEmpty().withMessage('City is required'),
    body('postalCode').isString().notEmpty().withMessage('Postal code is required'),
    body('label').optional().isString(),
    body('phone').optional().isString(),
    body('addressLine2').optional().isString(),
    body('state').optional().isString(),
    body('country').optional().isString(),
    body('isDefault').optional().isBoolean()
  ],
  async (req: any, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const address = await addressService.create(req.userId, req.body);
      res.status(201).json(address);
    } catch (error: any) {
      res.status(500).json({ message: error.message ?? 'Failed to create address' });
    }
  }
);

// Update address
router.put(
  '/:id',
  [
    body('name').optional().isString(),
    body('addressLine1').optional().isString(),
    body('city').optional().isString(),
    body('postalCode').optional().isString(),
    body('label').optional().isString(),
    body('phone').optional().isString(),
    body('addressLine2').optional().isString(),
    body('state').optional().isString(),
    body('country').optional().isString(),
    body('isDefault').optional().isBoolean()
  ],
  async (req: any, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const address = await addressService.update(Number(req.params.id), req.userId, req.body);
      if (!address) {
        return res.status(404).json({ message: 'Address not found' });
      }
      res.json(address);
    } catch (error: any) {
      res.status(500).json({ message: error.message ?? 'Failed to update address' });
    }
  }
);

// Delete address
router.delete('/:id', async (req: any, res) => {
  try {
    const deleted = await addressService.delete(Number(req.params.id), req.userId);
    if (!deleted) {
      return res.status(404).json({ message: 'Address not found' });
    }
    res.status(204).send();
  } catch (error: any) {
    res.status(500).json({ message: error.message ?? 'Failed to delete address' });
  }
});

// Set address as default
router.post('/:id/set-default', async (req: any, res) => {
  try {
    const address = await addressService.setDefault(Number(req.params.id), req.userId);
    if (!address) {
      return res.status(404).json({ message: 'Address not found' });
    }
    res.json(address);
  } catch (error: any) {
    res.status(500).json({ message: error.message ?? 'Failed to set default address' });
  }
});

export default router;
