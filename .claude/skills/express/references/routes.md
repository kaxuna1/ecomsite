# Routes Reference

## Contents
- Route Organization
- Route Registration
- Input Validation
- Response Patterns
- File Upload Routes
- Anti-Patterns

## Route Organization

Routes live in `backend/src/routes/` organized by domain:

| File | Purpose | Auth |
|------|---------|------|
| `authRoutes.ts` | Admin login | None |
| `userAuthRoutes.ts` | Customer login/register | None |
| `productRoutes.ts` | Product CRUD | Mixed |
| `orderRoutes.ts` | Order management | Mixed |
| `cmsRoutes.ts` | CMS pages/blocks | Admin |
| `aiRoutes.ts` | AI generation | Admin |

## Route Registration

Routes mount in `app.ts` with semantic prefixes:

```typescript
// backend/src/app.ts
app.use('/api/auth', authRoutes);           // Admin auth
app.use('/api/user/auth', userAuthRoutes);  // Customer auth
app.use('/api/products', productRoutes);     // Products
app.use('/api/admin/ai', aiRoutes);          // AI features (admin only)
```

## Input Validation

Use `express-validator` declaratively:

```typescript
import { body, param, query, validationResult } from 'express-validator';

router.post(
  '/',
  [
    body('name').notEmpty().trim(),
    body('email').isEmail().normalizeEmail(),
    body('price').isFloat({ min: 0 }),
    body('categories').isArray()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    // proceed with validated data
  }
);
```

**Query and Param Validation:**

```typescript
router.get(
  '/:id',
  [
    param('id').isInt({ min: 1 }),
    query('lang').optional().isIn(['en', 'ka']),
    query('page').optional().isInt({ min: 1 })
  ],
  validate,
  handler
);
```

**Reusable Validation Middleware:**

```typescript
const validate = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};
```

## Response Patterns

**Success Responses:**

```typescript
// 200 OK - Get/Update
res.json(product);

// 201 Created - Create
res.status(201).json(newProduct);

// 204 No Content - Delete
res.status(204).send();
```

**Error Responses:**

```typescript
// 400 Bad Request - Validation
return res.status(400).json({ errors: errors.array() });

// 401 Unauthorized - Missing/invalid auth
return res.status(401).json({ message: 'Unauthorized' });

// 404 Not Found
return res.status(404).json({ message: 'Product not found' });

// 500 Internal Error
return res.status(500).json({ message: error.message });
```

## File Upload Routes

Use multer with memory storage for Sharp processing:

```typescript
import multer from 'multer';
const upload = multer({ storage: multer.memoryStorage() });

router.post(
  '/',
  authenticate,
  upload.single('image'),
  async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: 'Image required' });
    }

    const processed = await sharp(req.file.buffer)
      .resize(1920, 1920, { fit: 'inside' })
      .webp({ quality: 85 })
      .toBuffer();

    // save and respond
  }
);
```

---

## Anti-Patterns

### WARNING: Business Logic in Routes

**The Problem:**

```typescript
// BAD - SQL and business logic in route
router.post('/', async (req, res) => {
  const result = await pool.query(
    'INSERT INTO products (name, price) VALUES ($1, $2)',
    [req.body.name, req.body.price * 1.1]  // Tax calculation here!
  );
  res.json(result.rows[0]);
});
```

**Why This Breaks:**
1. Untestable without HTTP requests
2. Business logic scattered across routes
3. Tax calculation duplicated if needed elsewhere

**The Fix:**

```typescript
// GOOD - Route delegates to service
router.post('/', async (req, res) => {
  const product = await productService.create(req.body);
  res.status(201).json(product);
});

// Service contains business logic
export const productService = {
  async create(payload: ProductPayload) {
    const priceWithTax = payload.price * 1.1;
    // ...
  }
};
```

### WARNING: Missing Error Handling

**The Problem:**

```typescript
// BAD - Unhandled promise rejection
router.get('/:id', async (req, res) => {
  const product = await productService.findById(req.params.id);
  res.json(product);
});
```

**The Fix:**

```typescript
// GOOD - Try-catch with error response
router.get('/:id', async (req, res) => {
  try {
    const product = await productService.findById(Number(req.params.id));
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(product);
  } catch (error: any) {
    console.error('Error fetching product:', error);
    res.status(500).json({ message: error.message });
  }
});
```