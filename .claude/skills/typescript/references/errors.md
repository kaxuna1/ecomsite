# TypeScript Error Handling Reference

## Contents
- Express Route Error Patterns
- Type-Safe Error Responses
- Validation Error Handling
- Async/Await Error Boundaries
- Common Type Errors and Fixes

---

## Express Route Error Patterns

Standard try-catch with typed responses.

```typescript
// backend/src/routes/productRoutes.ts
router.get('/:id', async (req, res) => {
  try {
    const product = await productService.getById(parseInt(req.params.id));
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ message: 'Error fetching product' });
  }
});
```

### Typed Error Handler Middleware

```typescript
// backend/src/middleware/errorHandler.ts
import type { ErrorRequestHandler } from 'express';

interface ApiError extends Error {
  statusCode?: number;
  code?: string;
}

export const errorHandler: ErrorRequestHandler = (err: ApiError, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';
  
  res.status(statusCode).json({
    message,
    code: err.code,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};
```

---

## Type-Safe Error Responses

Define error response shapes.

```typescript
// backend/src/types/errors.ts
export interface ValidationError {
  field: string;
  message: string;
  value?: unknown;
}

export interface ApiErrorResponse {
  message: string;
  code?: string;
  errors?: ValidationError[];
}

// Usage in routes
router.post('/products', async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const response: ApiErrorResponse = {
      message: 'Validation failed',
      errors: errors.array().map(e => ({
        field: e.type === 'field' ? e.path : 'unknown',
        message: e.msg,
      })),
    };
    return res.status(400).json(response);
  }
});
```

---

## Validation Error Handling

Using express-validator with TypeScript.

```typescript
// backend/src/routes/promoCodeRoutes.ts
import { body, validationResult } from 'express-validator';

const validatePromoCode = [
  body('code').isString().trim().notEmpty().withMessage('Code is required'),
  body('discountType')
    .isIn(['PERCENTAGE', 'FIXED_AMOUNT', 'FREE_SHIPPING'])
    .withMessage('Invalid discount type'),
  body('discountValue')
    .isFloat({ min: 0 })
    .withMessage('Discount value must be positive'),
];

router.post('/', validatePromoCode, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  // Proceed with validated data
});
```

### Custom Validator with Type Safety

```typescript
// Parse JSON arrays from form data
const parseJsonArray = (value: string | undefined, errorMessage: string): string[] => {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) {
      return parsed;
    }
  } catch {
    // fall through
  }
  throw new Error(errorMessage);
};

// Usage
body('categories').customSanitizer(value => 
  parseJsonArray(value, 'Categories must be valid JSON array')
);
```

---

## Async/Await Error Boundaries

### WARNING: Unhandled Promise Rejections

**The Problem:**

```typescript
// BAD - Unhandled rejection crashes the server
router.get('/products', async (req, res) => {
  const products = await productService.list();  // If this throws, 500 with no response
  res.json(products);
});
```

**Why This Breaks:**
1. No response sent to client (hangs)
2. Server may crash on unhandled rejection
3. Error details lost

**The Fix:**

```typescript
// GOOD - Always wrap in try-catch
router.get('/products', async (req, res) => {
  try {
    const products = await productService.list();
    res.json(products);
  } catch (error) {
    console.error('Error listing products:', error);
    res.status(500).json({ message: 'Error listing products' });
  }
});

// BETTER - Use async handler wrapper
const asyncHandler = (fn: RequestHandler): RequestHandler => 
  (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

router.get('/products', asyncHandler(async (req, res) => {
  const products = await productService.list();
  res.json(products);
}));
```

---

## Common Type Errors and Fixes

### Error: Property does not exist on type 'Request'

**Cause:** Accessing custom properties on Express Request.

```typescript
// ERROR
router.get('/profile', authenticate, async (req, res) => {
  const userId = req.userId;  // Property 'userId' does not exist on type 'Request'
});
```

**Fix:**

```typescript
// Use extended interface
import type { AuthenticatedRequest } from '../middleware/authMiddleware';

router.get('/profile', authenticate, async (req: AuthenticatedRequest, res) => {
  const userId = req.userId;  // Now valid
});
```

---

### Error: Type 'null' is not assignable to type 'T'

**Cause:** Nullable return from database.

```typescript
// ERROR
async function getProduct(id: number): Promise<Product> {
  const result = await pool.query('SELECT * FROM products WHERE id = $1', [id]);
  return result.rows[0];  // May be undefined
}
```

**Fix:**

```typescript
// Return type includes null
async function getProduct(id: number): Promise<Product | null> {
  const result = await pool.query('SELECT * FROM products WHERE id = $1', [id]);
  return result.rows[0] ? mapProductFromDb(result.rows[0]) : null;
}
```

---

### Error: Object is possibly 'undefined'

**Cause:** Optional chaining required.

```typescript
// ERROR
const price = product.salePrice.toFixed(2);  // salePrice may be undefined
```

**Fix:**

```typescript
// Option 1: Optional chaining with fallback
const price = product.salePrice?.toFixed(2) ?? product.price.toFixed(2);

// Option 2: Nullish coalescing
const displayPrice = product.salePrice ?? product.price;
```

---

### Error: Argument of type 'string' is not assignable to parameter of type 'number'

**Cause:** Express params are always strings.

```typescript
// ERROR
const product = await productService.getById(req.params.id);  // id is string
```

**Fix:**

```typescript
// Parse the parameter
const product = await productService.getById(parseInt(req.params.id, 10));

// Or use express-validator
param('id').isInt({ min: 1 }).toInt();
```

---

### Error: Type 'any' is not assignable to type 'never'

**Cause:** Array with incompatible union types.

```typescript
// ERROR
const items: (Product | Order)[] = [];
items.push(product);  // Sometimes fails

// Happens when TypeScript can't narrow
```

**Fix:**

```typescript
// Be explicit about array type
const items: Array<Product | Order> = [];

// Or use type assertion carefully
items.push(product as Product);
```

---

## Error Boundary Pattern (Frontend)

```typescript
// frontend/src/components/ErrorBoundary.tsx
import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || <div>Something went wrong</div>;
    }
    return this.props.children;
  }
}
```

---

## Workflow Checklist: Debugging Type Errors

Copy this checklist and track progress:
- [ ] Read the full error message (file, line, expected vs actual types)
- [ ] Check if the variable could be null/undefined
- [ ] Verify import paths are correct
- [ ] Check if interface extends the right base type
- [ ] Ensure async functions return Promise<T>
- [ ] Run `npx tsc --noEmit` to see all errors

---

## Related Skills

- See the **zod** skill for runtime validation errors
- See the **express** skill for middleware error handling
- See the **tanstack-query** skill for API error states