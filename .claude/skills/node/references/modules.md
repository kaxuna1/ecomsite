# Node.js Modules Reference

## Contents
- ESM Import Patterns
- Project Structure
- Service Layer Organization
- Module Dependencies

---

## ESM Import Patterns

### File Extensions Required

```typescript
// GOOD - .js extension for local imports
import app from './app.js';
import { env } from './config/env.js';
import { pool } from '../db/client.js';

// BAD - Missing extension (fails at runtime)
import app from './app';
import { env } from './config/env';
```

### Package Imports (No Extension)

```typescript
// External packages - no extension
import express from 'express';
import pg from 'pg';
import jwt from 'jsonwebtoken';
```

### Named vs Default Exports

```typescript
// Default export for pg (CommonJS compatibility)
import pg from 'pg';
const { Pool } = pg;

// Named exports from local modules
export const productService = {...};
export const orderService = {...};

// Import named exports
import { productService, orderService } from '../services/index.js';
```

---

## Project Structure

```
backend/
├── src/
│   ├── server.ts           # Entry point
│   ├── app.ts              # Express app config
│   ├── config/
│   │   └── env.ts          # Environment variables
│   ├── db/
│   │   └── client.ts       # PostgreSQL pool
│   ├── routes/             # Express routers (26 files)
│   │   ├── authRoutes.ts
│   │   ├── productRoutes.ts
│   │   └── ...
│   ├── services/           # Business logic (27 files)
│   │   ├── productService.ts
│   │   ├── orderService.ts
│   │   └── ...
│   ├── middleware/
│   │   ├── authMiddleware.ts
│   │   └── rateLimiter.ts
│   ├── types/
│   │   └── index.ts        # Shared interfaces
│   ├── utils/
│   │   ├── encryption.ts
│   │   └── urlHelper.ts
│   └── scripts/            # CLI scripts
│       ├── migrate.ts
│       └── seed.ts
├── uploads/                # File storage
└── package.json
```

---

## Service Layer Organization

### Service Module Pattern

```typescript
// backend/src/services/productService.ts
import { pool } from '../db/client';
import type { ProductPayload } from '../types';

export const productService = {
  async list(filters?: {...}): Promise<{products: any[], total: number}> {...},
  async get(id: number, language: string = 'en') {...},
  async create(payload: ProductPayload, imagePath: string) {...},
  async update(id: number, payload: ProductPayload, imagePath?: string) {...},
  async remove(id: number) {...},
};
```

### Route to Service Pattern

```typescript
// backend/src/routes/productRoutes.ts
import { Router } from 'express';
import { productService } from '../services/productService.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/', async (req, res) => {
  const result = await productService.list(req.query);
  res.json(result);
});

router.post('/', authenticate, async (req, res) => {
  const product = await productService.create(req.body, imagePath);
  res.status(201).json(product);
});

export default router;
```

---

## Module Dependencies

### Circular Dependency Prevention

```typescript
// BAD - Services importing each other
// productService.ts
import { orderService } from './orderService.js';

// orderService.ts
import { productService } from './productService.js';  // Circular!

// GOOD - Pass dependencies as parameters
async function createOrder(
  payload: OrderPayload, 
  getProduct: (id: number) => Promise<Product>
) {
  const product = await getProduct(item.productId);
}
```

### Dependency Flow

```
Routes → Services → Database (pool)
         ↓
       Types
         ↓
       Utils
```

---

## Scripts and CLI

### Running Scripts with tsx

```json
// package.json
{
  "scripts": {
    "migrate": "tsx src/scripts/migrate.ts",
    "seed": "tsx src/scripts/seed.ts",
    "generate-key": "tsx src/scripts/generate-encryption-key.ts"
  }
}
```

### Script Entry Pattern

```typescript
// backend/src/scripts/migrate.ts
import { pool } from '../db/client.js';

async function main() {
  console.log('Running migrations...');
  await pool.query(`CREATE TABLE IF NOT EXISTS...`);
  console.log('Migrations complete');
  process.exit(0);
}

main().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
```

---

## WARNING: Blocking Imports

**The Problem:**

```typescript
// BAD - Synchronous file read at module level
const config = JSON.parse(fs.readFileSync('./config.json', 'utf8'));

// BAD - Heavy computation at import time
const cache = computeExpensiveData();
```

**Why This Breaks:**
1. Blocks event loop during startup
2. Errors at import time are harder to handle
3. Makes testing difficult

**The Fix:**

```typescript
// GOOD - Load config lazily or use env
let config: Config | null = null;

export function getConfig(): Config {
  if (!config) {
    config = JSON.parse(fs.readFileSync('./config.json', 'utf8'));
  }
  return config;
}

// Better - Use environment variables
import { env } from './config/env.js';
```

For Express routing patterns, see the **express** skill.