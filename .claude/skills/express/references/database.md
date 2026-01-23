# Database Reference

## Contents
- Connection Pool
- Parameterized Queries
- JSONB Operations
- Row Mapping
- Transactions
- Anti-Patterns

## Connection Pool

PostgreSQL connection with `pg` library:

```typescript
// backend/src/db/client.ts
import pg from 'pg';
const { Pool } = pg;

export const pool = new Pool({
  host: env.dbHost,
  port: env.dbPort,
  database: env.dbName,
  user: env.dbUser,
  password: env.dbPassword,
  max: 20,                        // Max connections
  idleTimeoutMillis: 30000,       // Close idle connections after 30s
  connectionTimeoutMillis: 2000   // Timeout on connection
});
```

**Usage:**

```typescript
import { pool } from '../db/client';

const result = await pool.query('SELECT * FROM products WHERE id = $1', [id]);
```

See the **postgresql** skill for schema design and optimization.

## Parameterized Queries

ALWAYS use `$1, $2, $3...` placeholders:

```typescript
// Single parameter
await pool.query('SELECT * FROM products WHERE id = $1', [productId]);

// Multiple parameters
await pool.query(
  'INSERT INTO products (name, price, inventory) VALUES ($1, $2, $3) RETURNING *',
  [name, price, inventory]
);

// Dynamic parameter indices
let paramIndex = 1;
const params: any[] = [];

if (filters.category) {
  query += ` AND category = $${paramIndex++}`;
  params.push(filters.category);
}
```

## JSONB Operations

Products store flexible data as JSONB:

```typescript
// Insert JSONB array
await pool.query(
  'INSERT INTO products (categories, highlights) VALUES ($1::jsonb, $2::jsonb)',
  [JSON.stringify(['Serums', 'Hair Care']), JSON.stringify(['Vitamin E', 'Organic'])]
);

// Query with containment (@>)
await pool.query(
  'SELECT * FROM products WHERE categories @> $1::jsonb',
  [JSON.stringify(['Serums'])]
);

// Access JSONB field
await pool.query(
  `SELECT * FROM products WHERE custom_attributes->>'brand' = $1`,
  [brand]
);
```

## Row Mapping

Convert snake_case DB rows to camelCase objects:

```typescript
const mapProduct = (row: any) => ({
  id: row.id,
  name: row.name,
  shortDescription: row.short_description,
  description: row.description,
  price: parseFloat(row.price),
  salePrice: row.sale_price ? parseFloat(row.sale_price) : null,
  imageUrl: row.image_url,
  inventory: row.inventory,
  categories: row.categories,
  isNew: row.is_new ?? false,
  isFeatured: row.is_featured ?? false,
  createdAt: row.created_at
});

// Usage
const products = result.rows.map(mapProduct);
```

## Transactions

Use client checkout for multi-statement transactions:

```typescript
async createOrder(payload: OrderPayload) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const order = await client.query(
      'INSERT INTO orders (...) VALUES (...) RETURNING *',
      [...]
    );

    for (const item of payload.items) {
      await client.query(
        'INSERT INTO order_items (...) VALUES (...)',
        [...]
      );
    }

    await client.query('COMMIT');
    return order.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();  // ALWAYS release
  }
}
```

## Multilingual Queries

Use COALESCE for translation fallback:

```typescript
const result = await pool.query(`
  SELECT 
    p.id,
    p.price,
    COALESCE(pt.name, p.name) as name,
    COALESCE(pt.slug, p.slug) as slug,
    COALESCE(pt.description, p.description) as description
  FROM products p
  LEFT JOIN product_translations pt 
    ON p.id = pt.product_id AND pt.language_code = $1
  WHERE p.id = $2
`, [language, productId]);
```

---

## Anti-Patterns

### WARNING: N+1 Query Pattern

**The Problem:**

```typescript
// BAD - One query per product for images
const products = await pool.query('SELECT * FROM products');
for (const product of products.rows) {
  const images = await pool.query(
    'SELECT * FROM product_images WHERE product_id = $1',
    [product.id]
  );
  product.images = images.rows;
}
```

**Why This Breaks:**
1. 100 products = 101 queries
2. Latency multiplies linearly
3. Database connection pool exhaustion

**The Fix:**

```typescript
// GOOD - Batch fetch with IN clause
const products = await pool.query('SELECT * FROM products');
const productIds = products.rows.map(p => p.id);

const images = await pool.query(
  'SELECT * FROM product_images WHERE product_id = ANY($1)',
  [productIds]
);

// Group images by product_id
const imagesByProduct = new Map();
for (const img of images.rows) {
  if (!imagesByProduct.has(img.product_id)) {
    imagesByProduct.set(img.product_id, []);
  }
  imagesByProduct.get(img.product_id).push(img);
}

// Attach to products
for (const product of products.rows) {
  product.images = imagesByProduct.get(product.id) || [];
}
```

### WARNING: Forgetting to Release Client

**The Problem:**

```typescript
// BAD - Client never released on error
async updateWithTransaction() {
  const client = await pool.connect();
  await client.query('BEGIN');
  await client.query('UPDATE ...');  // Throws!
  await client.query('COMMIT');
  client.release();  // Never reached
}
```

**The Fix:**

```typescript
// GOOD - finally block ensures release
async updateWithTransaction() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('UPDATE ...');
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();  // ALWAYS executes
  }
}
```

### WARNING: Mixing Pool and Client Queries

**The Problem:**

```typescript
// BAD - Pool query outside transaction context
const client = await pool.connect();
await client.query('BEGIN');
await pool.query('INSERT ...');  // Uses different connection!
await client.query('COMMIT');    // Transaction has nothing
```

**The Fix:**

```typescript
// GOOD - Use client for all transaction queries
const client = await pool.connect();
await client.query('BEGIN');
await client.query('INSERT ...');  // Same connection
await client.query('COMMIT');
```