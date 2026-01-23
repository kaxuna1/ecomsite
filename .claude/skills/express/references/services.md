# Services Reference

## Contents
- Service Architecture
- Creating Services
- Database Operations
- Error Handling
- Complex Service Patterns
- Anti-Patterns

## Service Architecture

Services in `backend/src/services/` encapsulate business logic. Export object with methods, not classes:

```typescript
// backend/src/services/productService.ts
import { pool } from '../db/client';

export const productService = {
  async list(filters?: ProductFilters) { /* ... */ },
  async findById(id: number) { /* ... */ },
  async create(payload: ProductPayload) { /* ... */ },
  async update(id: number, payload: Partial<ProductPayload>) { /* ... */ },
  async delete(id: number) { /* ... */ }
};
```

## Creating Services

**Basic CRUD Service:**

```typescript
export const categoryService = {
  async list() {
    const result = await pool.query(
      'SELECT * FROM categories ORDER BY display_order'
    );
    return result.rows;
  },

  async findById(id: number) {
    const result = await pool.query(
      'SELECT * FROM categories WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;  // Return null, don't throw
  },

  async create(payload: { name: string; slug: string }) {
    const result = await pool.query(
      'INSERT INTO categories (name, slug) VALUES ($1, $2) RETURNING *',
      [payload.name, payload.slug]
    );
    return result.rows[0];
  },

  async update(id: number, payload: Partial<{ name: string; slug: string }>) {
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (payload.name !== undefined) {
      fields.push(`name = $${paramIndex++}`);
      values.push(payload.name);
    }
    if (payload.slug !== undefined) {
      fields.push(`slug = $${paramIndex++}`);
      values.push(payload.slug);
    }

    if (fields.length === 0) return null;

    values.push(id);
    const result = await pool.query(
      `UPDATE categories SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );
    return result.rows[0] || null;
  },

  async delete(id: number) {
    const result = await pool.query(
      'DELETE FROM categories WHERE id = $1 RETURNING id',
      [id]
    );
    return result.rowCount > 0;
  }
};
```

## Database Operations

**Multilingual Content with Fallback:**

```typescript
async findBySlug(slug: string, language: string = 'en') {
  const result = await pool.query(`
    SELECT 
      p.id,
      p.price,
      COALESCE(pt.name, p.name) as name,
      COALESCE(pt.description, p.description) as description
    FROM products p
    LEFT JOIN product_translations pt 
      ON p.id = pt.product_id AND pt.language_code = $1
    WHERE p.slug = $2 OR pt.slug = $2
  `, [language, slug]);
  
  return result.rows[0] || null;
}
```

**Dynamic Query Building:**

```typescript
async list(filters?: ProductFilters) {
  let query = 'SELECT * FROM products WHERE 1=1';
  const params: any[] = [];
  let paramIndex = 1;

  if (filters?.isNew) {
    query += ` AND is_new = $${paramIndex++}`;
    params.push(true);
  }

  if (filters?.category) {
    query += ` AND categories @> $${paramIndex++}::jsonb`;
    params.push(JSON.stringify([filters.category]));
  }

  if (filters?.minPrice) {
    query += ` AND price >= $${paramIndex++}`;
    params.push(filters.minPrice);
  }

  query += ` ORDER BY created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
  params.push(filters?.limit || 20, filters?.offset || 0);

  const result = await pool.query(query, params);
  return result.rows.map(mapProduct);
}
```

## Error Handling

**Service-Level Pattern:**

```typescript
async create(payload: ProductPayload) {
  try {
    const result = await pool.query(
      'INSERT INTO products (...) VALUES (...) RETURNING *',
      [...]
    );
    return { success: true, data: result.rows[0] };
  } catch (error: any) {
    console.error('Error creating product:', error);
    
    // Handle constraint violations gracefully
    if (error.code === '23505') {  // Unique violation
      return { success: false, error: 'Product with this slug already exists' };
    }
    
    throw error;  // Re-throw unexpected errors
  }
}
```

## Complex Service Patterns

**Transaction with Multiple Operations:**

```typescript
async createOrder(payload: OrderPayload) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Create order
    const orderResult = await client.query(
      'INSERT INTO orders (user_id, total) VALUES ($1, $2) RETURNING *',
      [payload.userId, payload.total]
    );
    const order = orderResult.rows[0];

    // Create order items
    for (const item of payload.items) {
      await client.query(
        'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ($1, $2, $3, $4)',
        [order.id, item.productId, item.quantity, item.price]
      );

      // Decrement inventory
      await client.query(
        'UPDATE products SET inventory = inventory - $1 WHERE id = $2',
        [item.quantity, item.productId]
      );
    }

    await client.query('COMMIT');
    return order;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
```

---

## Anti-Patterns

### WARNING: Throwing for Business Logic

**The Problem:**

```typescript
// BAD - Throwing exception for expected case
async findById(id: number) {
  const result = await pool.query('SELECT * FROM products WHERE id = $1', [id]);
  if (result.rows.length === 0) {
    throw new Error('Product not found');  // Forces route to try-catch
  }
  return result.rows[0];
}
```

**The Fix:**

```typescript
// GOOD - Return null for missing data
async findById(id: number) {
  const result = await pool.query('SELECT * FROM products WHERE id = $1', [id]);
  return result.rows[0] || null;
}

// Route handles null explicitly
const product = await productService.findById(id);
if (!product) {
  return res.status(404).json({ message: 'Product not found' });
}
```

### WARNING: SQL String Concatenation

**The Problem:**

```typescript
// BAD - SQL injection vulnerability
async search(term: string) {
  const result = await pool.query(
    `SELECT * FROM products WHERE name LIKE '%${term}%'`
  );
  return result.rows;
}
```

**The Fix:**

```typescript
// GOOD - Parameterized query
async search(term: string) {
  const result = await pool.query(
    'SELECT * FROM products WHERE name ILIKE $1',
    [`%${term}%`]
  );
  return result.rows;
}
```