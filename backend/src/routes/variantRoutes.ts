import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { variantService } from '../services/variantService';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

// Helper to parse JSON array from request body
const parseJsonArray = (value: string | undefined, errorMessage: string): number[] => {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) {
      return parsed;
    }
  } catch (error) {
    // fall through to error below
  }
  throw new Error(errorMessage);
};

// Public routes - Get variant options and values

// Get all variant option types (Size, Color, etc.)
router.get('/variant-options', async (req, res) => {
  try {
    const options = await variantService.getVariantOptions();
    res.json(options);
  } catch (error: any) {
    res.status(500).json({ message: error.message ?? 'Internal server error' });
  }
});

// Get all variant option values
router.get('/variant-option-values', async (req, res) => {
  try {
    const values = await variantService.getAllVariantOptionValues();
    res.json(values);
  } catch (error: any) {
    res.status(500).json({ message: error.message ?? 'Internal server error' });
  }
});

// Get values for a specific variant option
router.get('/variant-options/:optionId/values', async (req, res) => {
  try {
    const optionId = Number(req.params.optionId);
    const values = await variantService.getVariantOptionValues(optionId);
    res.json(values);
  } catch (error: any) {
    res.status(500).json({ message: error.message ?? 'Internal server error' });
  }
});

// Get all variants for a product
router.get('/products/:productId/variants', async (req, res) => {
  try {
    const productId = Number(req.params.productId);
    const variants = await variantService.getProductVariants(productId);
    res.json(variants);
  } catch (error: any) {
    res.status(500).json({ message: error.message ?? 'Internal server error' });
  }
});

// Get a single variant by ID
router.get('/variants/:id', async (req, res) => {
  try {
    const variantId = Number(req.params.id);
    const variant = await variantService.getVariant(variantId);
    if (!variant) {
      return res.status(404).json({ message: 'Variant not found' });
    }
    res.json(variant);
  } catch (error: any) {
    res.status(500).json({ message: error.message ?? 'Internal server error' });
  }
});

// Get a variant by SKU
router.get('/variants/sku/:sku', async (req, res) => {
  try {
    const sku = req.params.sku;
    const variant = await variantService.getVariantBySKU(sku);
    if (!variant) {
      return res.status(404).json({ message: 'Variant not found' });
    }
    res.json(variant);
  } catch (error: any) {
    res.status(500).json({ message: error.message ?? 'Internal server error' });
  }
});

// Admin routes - Create, update, delete variants and options

// Create a new variant option type
router.post('/variant-options', authenticate, [
  body('name').isString().trim().notEmpty(),
  body('displayOrder').optional().isInt({ min: 0 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const option = await variantService.createVariantOption(
      req.body.name,
      req.body.displayOrder ?? 0
    );
    res.status(201).json(option);
  } catch (error: any) {
    res.status(400).json({ message: error.message ?? 'Invalid payload' });
  }
});

// Create a new variant option value
router.post('/variant-options/:optionId/values', authenticate, [
  body('value').isString().trim().notEmpty(),
  body('displayOrder').optional().isInt({ min: 0 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const optionId = Number(req.params.optionId);
    const optionValue = await variantService.createVariantOptionValue(
      optionId,
      req.body.value,
      req.body.displayOrder ?? 0
    );
    res.status(201).json(optionValue);
  } catch (error: any) {
    res.status(400).json({ message: error.message ?? 'Invalid payload' });
  }
});

// Create a new variant for a product
router.post('/products/:productId/variants', authenticate, [
  body('sku').isString().trim().notEmpty(),
  body('inventory').isInt({ min: 0 }),
  body('price').optional().isFloat({ min: 0 }),
  body('salePrice').optional().isFloat({ min: 0 }),
  body('weight').optional().isFloat({ min: 0 }),
  body('dimensionsLength').optional().isFloat({ min: 0 }),
  body('dimensionsWidth').optional().isFloat({ min: 0 }),
  body('dimensionsHeight').optional().isFloat({ min: 0 }),
  body('isActive').optional().isBoolean(),
  body('isDefault').optional().isBoolean(),
  body('imageUrl').optional().isString(),
  body('optionValueIds').isArray({ min: 1 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const productId = Number(req.params.productId);
    const variant = await variantService.createVariant(productId, {
      sku: req.body.sku,
      price: req.body.price,
      salePrice: req.body.salePrice,
      inventory: req.body.inventory,
      weight: req.body.weight,
      dimensionsLength: req.body.dimensionsLength,
      dimensionsWidth: req.body.dimensionsWidth,
      dimensionsHeight: req.body.dimensionsHeight,
      isActive: req.body.isActive ?? true,
      isDefault: req.body.isDefault ?? false,
      imageUrl: req.body.imageUrl,
      optionValueIds: req.body.optionValueIds
    });
    res.status(201).json(variant);
  } catch (error: any) {
    res.status(400).json({ message: error.message ?? 'Invalid payload' });
  }
});

// Update a variant
router.put('/variants/:id', authenticate, [
  body('sku').optional().isString().trim().notEmpty(),
  body('inventory').optional().isInt({ min: 0 }),
  body('price').optional().isFloat({ min: 0 }),
  body('salePrice').optional().isFloat({ min: 0 }),
  body('weight').optional().isFloat({ min: 0 }),
  body('dimensionsLength').optional().isFloat({ min: 0 }),
  body('dimensionsWidth').optional().isFloat({ min: 0 }),
  body('dimensionsHeight').optional().isFloat({ min: 0 }),
  body('isActive').optional().isBoolean(),
  body('isDefault').optional().isBoolean(),
  body('imageUrl').optional().isString(),
  body('optionValueIds').optional().isArray()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const variantId = Number(req.params.id);
    const variant = await variantService.updateVariant(variantId, req.body);
    if (!variant) {
      return res.status(404).json({ message: 'Variant not found' });
    }
    res.json(variant);
  } catch (error: any) {
    res.status(400).json({ message: error.message ?? 'Invalid payload' });
  }
});

// Delete a variant
router.delete('/variants/:id', authenticate, async (req, res) => {
  try {
    const variantId = Number(req.params.id);
    const success = await variantService.deleteVariant(variantId);
    if (!success) {
      return res.status(404).json({ message: 'Variant not found' });
    }
    res.status(204).send();
  } catch (error: any) {
    res.status(500).json({ message: error.message ?? 'Internal server error' });
  }
});

// Set a variant as default
router.put('/variants/:id/default', authenticate, async (req, res) => {
  try {
    const variantId = Number(req.params.id);
    const variant = await variantService.setDefaultVariant(variantId);
    if (!variant) {
      return res.status(404).json({ message: 'Variant not found' });
    }
    res.json(variant);
  } catch (error: any) {
    res.status(500).json({ message: error.message ?? 'Internal server error' });
  }
});

export default router;
