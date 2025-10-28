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
      onSale: req.query.onSale === 'true',
      language: (req.query.lang as string) || 'en'
    };

    const products = await productService.list(filters);
    res.json(products);
  } catch (error: any) {
    res.status(500).json({ message: error.message ?? 'Internal server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const language = (req.query.lang as string) || 'en';
    const product = await productService.get(Number(req.params.id), language);
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

// Translation routes
router.get('/:id/translations', async (req, res) => {
  try {
    const productId = Number(req.params.id);
    const product = await productService.get(productId);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const translations = await productService.getAllTranslations(productId);
    res.json(translations);
  } catch (error: any) {
    res.status(500).json({ message: error.message ?? 'Internal server error' });
  }
});

router.get('/:id/translations/:lang', async (req, res) => {
  try {
    const productId = Number(req.params.id);
    const languageCode = req.params.lang;

    const product = await productService.get(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const translation = await productService.getTranslation(productId, languageCode);
    if (!translation) {
      return res.status(404).json({ message: 'Translation not found' });
    }

    res.json(translation);
  } catch (error: any) {
    res.status(500).json({ message: error.message ?? 'Internal server error' });
  }
});

const translationValidators = [
  body('name').isString().trim().notEmpty(),
  body('shortDescription').isString().trim().notEmpty(),
  body('description').isString().trim().notEmpty()
];

router.post('/:id/translations/:lang', authenticate, translationValidators, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const productId = Number(req.params.id);
    const languageCode = req.params.lang;

    const product = await productService.get(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const highlights = req.body.highlights ? parseJsonArray(req.body.highlights, 'Invalid highlights format') : undefined;

    const translation = await productService.createTranslation(productId, languageCode, {
      name: req.body.name,
      shortDescription: req.body.shortDescription,
      description: req.body.description,
      highlights,
      usage: req.body.usage,
      slug: req.body.slug,
      metaTitle: req.body.metaTitle,
      metaDescription: req.body.metaDescription
    });

    res.status(201).json(translation);
  } catch (error: any) {
    res.status(400).json({ message: error.message ?? 'Invalid payload' });
  }
});

export default router;
