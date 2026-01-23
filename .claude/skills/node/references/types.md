# Node.js Types Reference

## Contents
- TypeScript Integration
- Request/Response Types
- Service Return Types
- Database Row Mapping

---

## TypeScript Integration

### ESM Configuration

```json
// backend/package.json
{
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "build": "tsc -b",
    "start": "node dist/server.js"
  }
}
```

```json
// backend/tsconfig.json
{
  "compilerOptions": {
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "target": "ES2022",
    "strict": true,
    "outDir": "./dist"
  }
}
```

---

## Request/Response Types

### Extended Request Types

```typescript
// backend/src/middleware/authMiddleware.ts:5-10
export interface AuthenticatedRequest extends Request {
  user?: { email: string };
  userId?: number;
  adminId?: number;
  role?: string;
}
```

### Using Extended Request

```typescript
import { AuthenticatedRequest } from '../middleware/authMiddleware';

router.get('/profile', authenticate, async (req: AuthenticatedRequest, res) => {
  const userId = req.userId;  // Type-safe access
  const user = await userService.getById(userId!);
  res.json(user);
});
```

---

## Service Return Types

### Interface Definitions

```typescript
// backend/src/types/index.ts
export interface Product {
  id: number;
  name: string;
  price: number;
  sale_price: number | null;
  inventory: number;
  categories: string;       // JSONB stored as string
  highlights: string | null;
  is_new: boolean;
  images?: ProductMedia[];
}

export interface ProductPayload {
  name: string;
  shortDescription: string;
  price: number;
  salePrice?: number;       // Optional fields use ?
  categories: string[];     // Payload uses array
  highlights?: string[];
}
```

### Mapper Function Pattern

```typescript
// backend/src/services/productService.ts:60-83
const mapProduct = (row: any) => ({
  id: row.id,
  name: row.name,
  price: parseFloat(row.price),           // Parse numeric strings
  salePrice: row.sale_price ? parseFloat(row.sale_price) : null,
  inventory: row.inventory,
  categories: row.categories,
  highlights: row.highlights ?? undefined, // Nullish coalescing
  isNew: row.is_new ?? false,
  isFeatured: row.is_featured ?? false,
  images: row.images ?? []
});
```

---

## Database Row Mapping

### JSONB Handling

```typescript
// Storing JSONB
await pool.query(
  'INSERT INTO products (categories, highlights) VALUES ($1, $2)',
  [
    JSON.stringify(payload.categories),    // Array to JSONB
    payload.highlights ? JSON.stringify(payload.highlights) : null
  ]
);

// Reading JSONB - already parsed by pg
const result = await pool.query('SELECT categories FROM products');
const categories = result.rows[0].categories;  // Already an array
```

### Explicit Type Casting

```typescript
// Cast COUNT result
const countResult = await pool.query(`
  SELECT COUNT(*)::int as total FROM products
`);
const total = countResult.rows[0]?.total || 0;

// Cast numeric fields
const products = result.rows.map(row => ({
  price: parseFloat(row.price),  // Numeric comes as string
}));
```

---

## WARNING: Using `any` Type

**The Problem:**

```typescript
// BAD - Loses all type safety
const mapProduct = (row: any) => ({...});
```

**Why This Breaks:**
1. No compile-time error checking
2. Typos in property names go undetected
3. Missing properties not caught

**The Fix:**

```typescript
// GOOD - Define row interface
interface ProductRow {
  id: number;
  name: string;
  price: string;  // Numeric comes as string from pg
  sale_price: string | null;
  categories: string[];
  // ...
}

const mapProduct = (row: ProductRow) => ({
  id: row.id,
  price: parseFloat(row.price),
  // TypeScript catches typos here
});
```

---

## Generic Service Pattern

```typescript
interface ServiceResult<T> {
  data: T;
  total?: number;
  page?: number;
  limit?: number;
}

async function list<T>(
  query: string, 
  params: any[]
): Promise<ServiceResult<T[]>> {
  const result = await pool.query(query, params);
  return {
    data: result.rows,
    total: result.rowCount
  };
}
```

For more TypeScript patterns, see the **typescript** skill.