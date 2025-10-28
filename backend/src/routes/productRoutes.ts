import { Router, Request, Response, NextFunction } from 'express';
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

router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const products = await productService.list();
    res.json(products);
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const product = await productService.get(Number(req.params.id));
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    next(error);
  }
});

const productValidators = [
  body('name').isString().trim().notEmpty(),
  body('shortDescription').isString().trim().notEmpty(),
  body('description').isString().trim().notEmpty(),
  body('price').isFloat({ min: 0 }),
  body('inventory').isInt({ min: 0 })
];

router.post('/', authenticate, upload.single('image'), productValidators, async (req: Request, res: Response) => {
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

    const product = await productService.create(
      {
        name: req.body.name,
        shortDescription: req.body.shortDescription,
        description: req.body.description,
        price: Number(req.body.price),
        inventory: Number(req.body.inventory),
        categories,
        highlights,
        usage: req.body.usage
      },
      req.file
    );

    res.status(201).json(product);
  } catch (error: any) {
    const message = typeof error?.message === 'string' ? error.message : 'Unable to create product';
    const status = /invalid|required/i.test(message) ? 400 : 500;
    res.status(status).json({ message });
  }
});

router.put(
  '/:id',
  authenticate,
  upload.single('image'),
  productValidators,
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const categories = parseJsonArray(req.body.categories, 'Invalid categories format');
      const highlights = req.body.highlights ? parseJsonArray(req.body.highlights, 'Invalid highlights format') : undefined;
      const product = await productService.update(
        Number(req.params.id),
        {
          name: req.body.name,
          shortDescription: req.body.shortDescription,
          description: req.body.description,
          price: Number(req.body.price),
          inventory: Number(req.body.inventory),
          categories,
          highlights,
          usage: req.body.usage
        },
        req.file ?? undefined
      );

      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }

      res.json(product);
    } catch (error: any) {
      const message = typeof error?.message === 'string' ? error.message : 'Unable to update product';
      const status = /invalid|required/i.test(message) ? 400 : 500;
      res.status(status).json({ message });
    }
  }
);

router.delete('/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const success = await productService.remove(Number(req.params.id));
    if (!success) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
