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

// Get filter metadata
router.get('/filter-metadata', async (req, res) => {
  try {
    const language = (req.query.lang as string) || 'en';
    const metadata = await productService.getFilterMetadata(language);
    res.json(metadata);
  } catch (error: any) {
    res.status(500).json({ message: error.message ?? 'Internal server error' });
  }
});

// Get translation status for all products (admin only)
router.get('/translations/status', authenticate, async (req, res) => {
  try {
    const languageCode = req.query.lang as string;

    if (!languageCode) {
      return res.status(400).json({ message: 'Language code is required' });
    }

    const statuses = await productService.getAllProductsTranslationStatus(languageCode);
    res.json(statuses);
  } catch (error: any) {
    res.status(500).json({ message: error.message ?? 'Internal server error' });
  }
});

// Get random products for home page
router.get('/random', async (req, res) => {
  try {
    const language = (req.query.lang as string) || 'en';
    const limit = req.query.limit ? Number(req.query.limit) : 8;

    const products = await productService.getRandom(limit, language);
    res.json(products);
  } catch (error: any) {
    res.status(500).json({ message: error.message ?? 'Internal server error' });
  }
});

// ========================================================================
// PRODUCT WIDGET ENHANCEMENT - NEW ENDPOINTS
// ========================================================================

/**
 * Track product view for analytics and recommendations
 * POST /api/products/track-view
 * Body: { productId: number, userId?: number, sessionId: string }
 */
router.post('/track-view', async (req, res) => {
  try {
    const { productId, userId, sessionId } = req.body;

    if (!productId) {
      return res.status(400).json({ message: 'Product ID is required' });
    }

    if (!sessionId) {
      return res.status(400).json({ message: 'Session ID is required' });
    }

    await productService.trackProductView(
      Number(productId),
      userId ? Number(userId) : null,
      sessionId
    );

    res.json({ success: true, message: 'Product view tracked' });
  } catch (error: any) {
    console.error('Error tracking product view:', error);
    res.status(500).json({ message: error.message ?? 'Failed to track product view' });
  }
});

/**
 * Get recently viewed products
 * GET /api/products/recently-viewed?userId=123&sessionId=abc&lang=en&limit=8
 */
router.get('/recently-viewed', async (req, res) => {
  try {
    const userId = req.query.userId ? Number(req.query.userId) : null;
    const sessionId = (req.query.sessionId as string) || null;
    const language = (req.query.lang as string) || 'en';
    const limit = req.query.limit ? Number(req.query.limit) : 8;

    if (!userId && !sessionId) {
      return res.status(400).json({ message: 'Either userId or sessionId is required' });
    }

    const products = await productService.getRecentlyViewedProducts(
      userId,
      sessionId,
      { language, limit }
    );

    res.json(products);
  } catch (error: any) {
    console.error('Error fetching recently viewed products:', error);
    res.status(500).json({ message: error.message ?? 'Failed to fetch recently viewed products' });
  }
});

/**
 * Get recommended products based on a source product
 * GET /api/products/recommended/:productId?type=related&lang=en&limit=6
 */
router.get('/recommended/:productId', async (req, res) => {
  try {
    const productId = Number(req.params.productId);
    const recommendationType = (req.query.type as 'related' | 'similar' | 'frequently_bought') || 'related';
    const language = (req.query.lang as string) || 'en';
    const limit = req.query.limit ? Number(req.query.limit) : 6;

    const products = await productService.fetchRecommendedProducts(
      productId,
      recommendationType,
      { language, limit }
    );

    res.json(products);
  } catch (error: any) {
    console.error('Error fetching recommended products:', error);
    res.status(500).json({ message: error.message ?? 'Failed to fetch recommended products' });
  }
});

/**
 * Get products by rules (new arrivals, bestsellers, on sale, etc.)
 * GET /api/products/by-rules?showNewArrivals=true&showBestsellers=true&lang=en&limit=12&sortBy=popularity
 */
router.get('/by-rules', async (req, res) => {
  try {
    const rules = {
      showNewArrivals: req.query.showNewArrivals === 'true',
      showBestsellers: req.query.showBestsellers === 'true',
      showOnSale: req.query.showOnSale === 'true',
      showFeatured: req.query.showFeatured === 'true',
      showLowStock: req.query.showLowStock === 'true',
      excludeOutOfStock: req.query.excludeOutOfStock === 'true',
      minRating: req.query.minRating ? Number(req.query.minRating) : undefined,
      minReviews: req.query.minReviews ? Number(req.query.minReviews) : undefined
    };

    const language = (req.query.lang as string) || 'en';
    const limit = req.query.limit ? Number(req.query.limit) : 12;
    const sortBy = (req.query.sortBy as string) || 'default';

    const products = await productService.fetchProductsByRules(rules, {
      language,
      limit,
      sortBy
    });

    res.json(products);
  } catch (error: any) {
    console.error('Error fetching products by rules:', error);
    res.status(500).json({ message: error.message ?? 'Failed to fetch products by rules' });
  }
});

/**
 * Get products by category filter
 * GET /api/products/by-category?categories=["Serums","Treatments"]&lang=en&limit=12&sortBy=popularity
 */
router.get('/by-category', async (req, res) => {
  try {
    const categoriesParam = req.query.categories as string;

    if (!categoriesParam) {
      return res.status(400).json({ message: 'Categories parameter is required' });
    }

    let categories: string[];
    try {
      categories = JSON.parse(categoriesParam);
      if (!Array.isArray(categories)) {
        return res.status(400).json({ message: 'Categories must be an array' });
      }
    } catch (error) {
      return res.status(400).json({ message: 'Invalid categories format. Must be valid JSON array.' });
    }

    const language = (req.query.lang as string) || 'en';
    const limit = req.query.limit ? Number(req.query.limit) : 12;
    const sortBy = (req.query.sortBy as string) || 'default';

    const products = await productService.fetchProductsByCategory(categories, {
      language,
      limit,
      sortBy
    });

    res.json(products);
  } catch (error: any) {
    console.error('Error fetching products by category:', error);
    res.status(500).json({ message: error.message ?? 'Failed to fetch products by category' });
  }
});

/**
 * Get products by attribute filters
 * GET /api/products/by-attributes?attributes={"brand":["BrandA"],"scent":["Lavender"]}&lang=en&limit=12&sortBy=popularity
 */
router.get('/by-attributes', async (req, res) => {
  try {
    const attributesParam = req.query.attributes as string;

    if (!attributesParam) {
      return res.status(400).json({ message: 'Attributes parameter is required' });
    }

    let attributeFilters: { [key: string]: string[] };
    try {
      attributeFilters = JSON.parse(attributesParam);
      if (typeof attributeFilters !== 'object' || Array.isArray(attributeFilters)) {
        return res.status(400).json({ message: 'Attributes must be an object mapping attribute keys to value arrays' });
      }
    } catch (error) {
      return res.status(400).json({ message: 'Invalid attributes format. Must be valid JSON object.' });
    }

    const language = (req.query.lang as string) || 'en';
    const limit = req.query.limit ? Number(req.query.limit) : 12;
    const sortBy = (req.query.sortBy as string) || 'default';

    const products = await productService.fetchProductsByAttributes(attributeFilters, {
      language,
      limit,
      sortBy
    });

    res.json(products);
  } catch (error: any) {
    console.error('Error fetching products by attributes:', error);
    res.status(500).json({ message: error.message ?? 'Failed to fetch products by attributes' });
  }
});

router.get('/', async (req, res) => {
  try {
    // Parse basic filters
    const filters: any = {
      isNew: req.query.isNew === 'true',
      isFeatured: req.query.isFeatured === 'true',
      onSale: req.query.onSale === 'true',
      language: (req.query.lang as string) || 'en'
    };

    // Add category filter if provided
    if (req.query.category && typeof req.query.category === 'string') {
      filters.category = req.query.category;
    }

    // Add search filter if provided
    if (req.query.search && typeof req.query.search === 'string') {
      filters.search = req.query.search.trim();
    }

    // Parse custom attributes filter if provided
    if (req.query.attributes && typeof req.query.attributes === 'string') {
      try {
        const parsedAttributes = JSON.parse(req.query.attributes);
        if (typeof parsedAttributes === 'object' && !Array.isArray(parsedAttributes)) {
          filters.attributes = parsedAttributes;
        }
      } catch (error) {
        return res.status(400).json({ message: 'Invalid attributes format. Must be valid JSON object.' });
      }
    }

    // Parse pagination parameters
    if (req.query.page) {
      const page = Number(req.query.page);
      if (!isNaN(page) && page > 0) {
        filters.page = page;
      }
    }

    if (req.query.limit) {
      const limit = Number(req.query.limit);
      if (!isNaN(limit) && limit > 0 && limit <= 100) { // Max 100 items per page
        filters.limit = limit;
      }
    }

    const result = await productService.list(filters);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ message: error.message ?? 'Internal server error' });
  }
});

// Search endpoint with full-text search and fuzzy matching
router.get('/search', async (req, res) => {
  try {
    const query = req.query.q as string;
    if (!query || query.trim().length === 0) {
      return res.status(400).json({ message: 'Search query is required' });
    }

    const language = (req.query.lang as string) || 'en';
    const limit = req.query.limit ? Number(req.query.limit) : 20;

    const results = await productService.search(query, language, limit);
    res.json(results);
  } catch (error: any) {
    console.error('Search error:', error);
    res.status(500).json({ message: error.message ?? 'Search failed' });
  }
});

// Autocomplete endpoint for typeahead suggestions
router.get('/autocomplete', async (req, res) => {
  try {
    const prefix = req.query.q as string;
    if (!prefix || prefix.trim().length === 0) {
      return res.json([]);
    }

    const language = (req.query.lang as string) || 'en';
    const limit = req.query.limit ? Number(req.query.limit) : 10;

    const suggestions = await productService.autocomplete(prefix, language, limit);
    res.json(suggestions);
  } catch (error: any) {
    console.error('Autocomplete error:', error);
    res.status(500).json({ message: error.message ?? 'Autocomplete failed' });
  }
});

router.get('/slug/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const lang = (req.query.lang as string) || 'en';

    const product = await productService.getBySlug(slug, lang);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const seoMetadata = productService.generateSEOMetadata(product);

    res.json({
      ...product,
      seo: seoMetadata
    });
  } catch (error: any) {
    console.error('Error fetching product by slug:', error);
    res.status(500).json({ message: error.message ?? 'Failed to fetch product' });
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

    const metaKeywords = req.body.metaKeywords ? parseJsonArray(req.body.metaKeywords, 'Invalid metaKeywords format') : undefined;

    const imageUrl = await productService.saveImage(req.file);
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
        isFeatured: req.body.isFeatured === 'true',
        slug: req.body.slug,
        metaTitle: req.body.metaTitle,
        metaDescription: req.body.metaDescription,
        metaKeywords,
        ogImageUrl: req.body.ogImageUrl,
        canonicalUrl: req.body.canonicalUrl
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
    const metaKeywords = req.body.metaKeywords ? parseJsonArray(req.body.metaKeywords, 'Invalid metaKeywords format') : undefined;
    const imageUrl = req.file ? await productService.saveImage(req.file) : undefined;
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
        isFeatured: req.body.isFeatured === 'true',
        slug: req.body.slug,
        metaTitle: req.body.metaTitle,
        metaDescription: req.body.metaDescription,
        metaKeywords,
        ogImageUrl: req.body.ogImageUrl,
        canonicalUrl: req.body.canonicalUrl
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
router.get('/:id/translations/status', async (req, res) => {
  try {
    const productId = Number(req.params.id);
    const languageCode = req.query.lang as string;

    if (!languageCode) {
      return res.status(400).json({ message: 'Language code is required' });
    }

    const product = await productService.get(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const status = await productService.getTranslationStatus(productId, languageCode);
    res.json(status);
  } catch (error: any) {
    res.status(500).json({ message: error.message ?? 'Internal server error' });
  }
});

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
      // Return empty translation object instead of 404
      return res.json({
        productId,
        languageCode,
        name: '',
        shortDescription: '',
        description: '',
        highlights: null,
        usage: '',
        slug: '',
        metaTitle: '',
        metaDescription: '',
        createdAt: null,
        updatedAt: null
      });
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

    // Handle both array (from JSON body) and string (from form-data)
    const highlights = req.body.highlights
      ? (Array.isArray(req.body.highlights) ? req.body.highlights : parseJsonArray(req.body.highlights, 'Invalid highlights format'))
      : undefined;

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
