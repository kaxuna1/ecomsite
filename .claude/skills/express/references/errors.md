# Error Handling Reference

## Contents
- Error Response Format
- Route Error Handling
- Service Error Patterns
- Validation Errors
- Database Errors
- Anti-Patterns

## Error Response Format

Consistent error structure across all endpoints:

```typescript
// Validation errors (400)
{
  "errors": [
    { "param": "email", "msg": "Invalid email", "location": "body" },
    { "param": "price", "msg": "Must be positive", "location": "body" }
  ]
}

// Auth errors (401/403)
{ "message": "Unauthorized" }
{ "message": "Invalid token" }
{ "message": "User authentication required" }

// Not found (404)
{ "message": "Product not found" }

// Rate limit (429)
{ "message": "Too many requests, please try again later", "retryAfter": 45 }

// Server errors (500)
{ "message": "Failed to create product" }
```

## Route Error Handling

**Standard Pattern:**

```typescript
router.post('/', authenticate, async (req, res) => {
  try {
    // 1. Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // 2. Execute business logic
    const result = await productService.create(req.body);

    // 3. Handle business-level failures
    if (!result) {
      return res.status(400).json({ message: 'Failed to create product' });
    }

    // 4. Success response
    res.status(201).json(result);
  } catch (error: any) {
    // 5. Log and respond to unexpected errors
    console.error('Error creating product:', error);
    res.status(500).json({ message: error.message || 'Internal server error' });
  }
});
```

**Not Found Pattern:**

```typescript
router.get('/:id', async (req, res) => {
  try {
    const product = await productService.findById(Number(req.params.id));
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(product);
  } catch (error: any) {
    console.error('Error:', error);
    res.status(500).json({ message: error.message });
  }
});
```

## Service Error Patterns

Services return null/false for expected failures, throw for unexpected:

```typescript
export const productService = {
  async findById(id: number) {
    try {
      const result = await pool.query(
        'SELECT * FROM products WHERE id = $1',
        [id]
      );
      return result.rows[0] || null;  // null for not found
    } catch (error) {
      console.error('Database error:', error);
      throw error;  // Rethrow unexpected errors
    }
  },

  async create(payload: ProductPayload) {
    try {
      const result = await pool.query(
        'INSERT INTO products (...) VALUES (...) RETURNING *',
        [...]
      );
      return result.rows[0];
    } catch (error: any) {
      // Handle specific database errors
      if (error.code === '23505') {  // Unique violation
        return null;  // Let route handle as 400
      }
      throw error;
    }
  }
};
```

## Validation Errors

**Express-Validator Pattern:**

```typescript
import { body, validationResult } from 'express-validator';

router.post(
  '/',
  [
    body('email').isEmail().withMessage('Valid email required'),
    body('price').isFloat({ min: 0 }).withMessage('Price must be positive'),
    body('name').notEmpty().trim().withMessage('Name required')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    // proceed...
  }
);
```

**Manual Validation:**

```typescript
router.post('/payment', async (req, res) => {
  const { amount, currency } = req.body;

  if (!amount || amount <= 0) {
    return res.status(400).json({ message: 'Amount must be positive' });
  }

  if (!['USD', 'EUR', 'GBP'].includes(currency)) {
    return res.status(400).json({ message: 'Unsupported currency' });
  }

  // proceed...
});
```

## Database Errors

**PostgreSQL Error Codes:**

| Code | Meaning | Response |
|------|---------|----------|
| 23505 | Unique violation | 400 "Already exists" |
| 23503 | Foreign key violation | 400 "Referenced item not found" |
| 23502 | Not null violation | 400 "Required field missing" |
| 42P01 | Undefined table | 500 (bug) |

**Handling in Service:**

```typescript
async create(payload: UserPayload) {
  try {
    const result = await pool.query(
      'INSERT INTO users (email, name) VALUES ($1, $2) RETURNING *',
      [payload.email, payload.name]
    );
    return { success: true, data: result.rows[0] };
  } catch (error: any) {
    if (error.code === '23505') {
      return { success: false, error: 'Email already registered' };
    }
    throw error;
  }
}
```

---

## Anti-Patterns

### WARNING: Silent Error Swallowing

**The Problem:**

```typescript
// BAD - Error hidden, returns misleading success
router.post('/', async (req, res) => {
  try {
    const result = await productService.create(req.body);
    res.json(result);
  } catch (error) {
    // No logging, no response, request hangs or returns nothing
  }
});
```

**The Fix:**

```typescript
// GOOD - Log and respond appropriately
router.post('/', async (req, res) => {
  try {
    const result = await productService.create(req.body);
    res.json(result);
  } catch (error: any) {
    console.error('Create product failed:', error);
    res.status(500).json({ message: 'Failed to create product' });
  }
});
```

### WARNING: Leaking Internal Errors

**The Problem:**

```typescript
// BAD - Exposes database structure
res.status(500).json({ 
  error: error.message,
  stack: error.stack,
  query: 'SELECT password_hash FROM users...'
});
```

**Why This Breaks:**
1. Reveals table/column names to attackers
2. Stack traces expose file paths
3. SQL shows data model

**The Fix:**

```typescript
// GOOD - Generic user-facing message
console.error('Database error:', error);  // Log full error internally
res.status(500).json({ message: 'An error occurred' });
```

### WARNING: Inconsistent Error Format

**The Problem:**

```typescript
// Route 1
res.status(400).json({ error: 'Bad request' });

// Route 2
res.status(400).json({ message: 'Invalid input' });

// Route 3
res.status(400).json({ msg: 'Failed', code: 400 });
```

**The Fix:**

```typescript
// Consistent format everywhere
res.status(400).json({ message: 'Description of error' });

// For validation
res.status(400).json({ errors: validationResult(req).array() });
```