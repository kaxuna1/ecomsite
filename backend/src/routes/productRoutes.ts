import { Router } from 'express';
import multer from 'multer';
import { body, validationResult } from 'express-validator';
import { productService } from '../services/productService';
import { authenticate } from '../middleware/authMiddleware';

const upload = multer({ storage: multer.memoryStorage() });

const router = Router();

const parseJsonArray = (value: string | undefined, errorMessage: string) => {
  if (!value) return [] as string[];
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

router.get('/', async (req, res) => {
  try {
    const filters = {
      isNew: req.query.isNew === 'true',
      isFeatured: req.query.isFeatured === 'true',
      onSale: req.query.onSale === 'true'
    };

    // Only pass filters if at least one is true
    const hasFilters = filters.isNew || filters.isFeatured || filters.onSale;
    const products = await productService.list(hasFilters ? filters : undefined);

    res.json(products);
  } catch (error: any) {
    res.status(500).json({ message: error.message ?? 'Internal server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const product = await productService.get(Number(req.params.id));
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(product);
  } catch (error: any) {
    res.status(500).json({ message: error.message ?? 'Internal server error' });
  }
});

const productValidators = [
  body('name').isString().trim().notEmpty(),
  body('shortDescription').isString().trim().notEmpty(),
  body('description').isString().trim().notEmpty(),
  body('price').isFloat({ min: 0 }),
  body('inventory').isInt({ min: 0 })
];

router.post('/', authenticate, upload.single('image'), productValidators, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  if (!req.file) {
    return res.status(400).json({ message: 'Product image is required' });
  }

  try {
    const categories = parseJsonArray(req.body.categories, 'Invalid categories format');
    const highlights = req.body.highlights ? parseJsonArray(req.body.highlights, 'Invalid highlights format') : undefined;

    const imageUrl = productService.saveImage(req.file);
    const product = await productService.create(
      {
        name: req.body.name,
        shortDescription: req.body.shortDescription,
        description: req.body.description,
        price: Number(req.body.price),
        salePrice: req.body.salePrice ? Number(req.body.salePrice) : undefined,
        inventory: Number(req.body.inventory),
        categories,
        highlights,
        usage: req.body.usage,
        isNew: req.body.isNew === 'true',
        isFeatured: req.body.isFeatured === 'true'
      },
      imageUrl
    );

    res.status(201).json(product);
  } catch (error: any) {
    res.status(400).json({ message: error.message ?? 'Invalid payload' });
  }
});

router.put('/:id', authenticate, upload.single('image'), productValidators, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const categories = parseJsonArray(req.body.categories, 'Invalid categories format');
    const highlights = req.body.highlights ? parseJsonArray(req.body.highlights, 'Invalid highlights format') : undefined;
    const imageUrl = req.file ? productService.saveImage(req.file) : undefined;
    const product = await productService.update(
      Number(req.params.id),
      {
        name: req.body.name,
        shortDescription: req.body.shortDescription,
        description: req.body.description,
        price: Number(req.body.price),
        salePrice: req.body.salePrice ? Number(req.body.salePrice) : undefined,
        inventory: Number(req.body.inventory),
        categories,
        highlights,
        usage: req.body.usage,
        isNew: req.body.isNew === 'true',
        isFeatured: req.body.isFeatured === 'true'
      },
      imageUrl
    );

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json(product);
  } catch (error: any) {
    res.status(400).json({ message: error.message ?? 'Invalid payload' });
  }
});

router.delete('/:id', authenticate, async (req, res) => {
  try {
    const success = await productService.remove(Number(req.params.id));
    if (!success) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.status(204).send();
  } catch (error: any) {
    res.status(500).json({ message: error.message ?? 'Internal server error' });
  }
});

export default router;
