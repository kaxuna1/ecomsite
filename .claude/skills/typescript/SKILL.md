---
name: typescript
description: |
  Enforces strict TypeScript types across frontend and backend codebases.
  Use when: Writing new services, DTOs, interfaces, type guards, debugging type errors, or ensuring type safety at API boundaries.
allowed-tools: Read, Edit, Write, Glob, Grep, Bash
---

# TypeScript Skill

Strict TypeScript configuration for full-stack e-commerce platform. Backend uses `strict: true` with Express/PostgreSQL, frontend uses `strict: true` with Vite/React. Types are defined separately in each codebase but follow identical naming conventions for API contracts.

## Quick Start

### Define Entity Types

```typescript
// backend/src/types/index.ts
export interface Product {
  id: number;
  name: string;
  price: number;
  salePrice?: number | null;  // Optional AND nullable
  categories: string[];        // Arrays typed explicitly
  customAttributes?: Record<string, any>;  // Flexible JSONB
}

// Request payload - all fields explicit
export interface ProductPayload {
  name: string;
  price: number;
  salePrice?: number;  // Optional on create
  categories: string[];
}
```

### Extend Express Request for Auth

```typescript
// backend/src/middleware/authMiddleware.ts
export interface AuthenticatedRequest extends Request {
  user?: { email: string };
  userId?: number;
  adminId?: number;
  role?: string;
}
```

### Database Row Mapping

```typescript
// Convert snake_case DB rows to camelCase TypeScript
const mapProductFromDb = (row: any): Product => ({
  id: row.id,
  name: row.name,
  salePrice: row.sale_price,  // snake_case → camelCase
  createdAt: row.created_at,
});
```

## Key Concepts

| Concept | Usage | Example |
|---------|-------|---------|
| Discriminated unions | CMS block types | `type: 'hero' \| 'features'` |
| Optional vs nullable | API fields | `field?: T` vs `field: T \| null` |
| Record types | JSONB columns | `Record<string, any>` |
| Interface extension | Auth middleware | `extends Request` |
| Generic functions | Reusable hooks | `<T extends Record<string, any>>` |

## Common Patterns

### Discriminated Union for CMS Blocks

**When:** Multiple content types share a structure but have different shapes

```typescript
export type BlockContent =
  | { type: 'hero'; headline: string; imageUrl: string }
  | { type: 'features'; items: FeatureItem[] }
  | { type: 'products'; productIds: number[] };

// TypeScript narrows automatically
if (block.type === 'hero') {
  console.log(block.headline);  // Safe access
}
```

### Service Return Types

**When:** Every service function must declare its Promise type

```typescript
export async function getProduct(id: number): Promise<Product | null> {
  const result = await pool.query('SELECT * FROM products WHERE id = $1', [id]);
  return result.rows[0] ? mapProductFromDb(result.rows[0]) : null;
}
```

## See Also

- [patterns](references/patterns.md) - Type patterns and idioms
- [types](references/types.md) - Type definitions and contracts
- [modules](references/modules.md) - Module organization
- [errors](references/errors.md) - Error handling patterns

## Related Skills

- See the **express** skill for route typing and middleware
- See the **react** skill for component prop typing
- See the **zod** skill for runtime validation schemas
- See the **postgresql** skill for database query typing
- See the **tanstack-query** skill for typed data fetching