# TypeScript Modules Reference

## Contents
- Module Organization
- Import/Export Patterns
- Type-Only Imports
- Barrel Exports
- Circular Dependency Prevention

---

## Module Organization

This codebase uses separate type directories for frontend and backend.

```
backend/src/types/
├── index.ts        # Core entities (Product, Order, Variant)
├── user.ts         # Auth payloads
├── cms.ts          # CMS blocks, pages (491 lines)
├── navigation.ts   # Menu items, locations
├── theme.ts        # Design tokens
└── reviews.ts      # Product reviews

frontend/src/types/
├── product.ts      # Product types for UI
├── cms.ts          # CMS types for rendering
└── theme.ts        # Theme context types
```

### Backend Module Pattern

```typescript
// backend/src/types/index.ts
export interface Product { /* ... */ }
export interface ProductPayload { /* ... */ }
export interface Order { /* ... */ }
export interface OrderPayload { /* ... */ }

// Export all from one place
export * from './user';
export * from './cms';
export * from './navigation';
```

### Frontend Module Pattern

```typescript
// frontend/src/types/product.ts
export interface Product {
  id: number;
  name: string;
  // Frontend-specific: includes computed fields
  averageRating?: number;
  reviewCount?: number;
}
```

---

## Import/Export Patterns

### Named Exports (Preferred)

```typescript
// Export
export interface Product { /* ... */ }
export function createProduct(data: ProductPayload): Promise<Product> { /* ... */ }

// Import
import { Product, createProduct } from '../types';
```

### Type-Only Imports

Use `import type` when importing only types (helps tree-shaking).

```typescript
// GOOD - Type-only import
import type { Product, ProductPayload } from '../types';
import { createProduct } from '../services/productService';

// BAD - Mixed import (works but less efficient)
import { Product, createProduct } from '../services/productService';
```

### Re-exporting Types

```typescript
// backend/src/types/index.ts
export type { CMSPage, CMSBlock, BlockContent } from './cms';
export type { MenuItem, MenuLocation } from './navigation';
export type { Theme, DesignTokens } from './theme';
```

---

## Barrel Exports

Create `index.ts` files for clean imports.

```typescript
// backend/src/services/index.ts
export * from './productService';
export * from './orderService';
export * from './cmsService';

// Usage
import { productService, orderService } from '../services';
```

### WARNING: Circular Dependencies

**The Problem:**

```typescript
// services/productService.ts
import { orderService } from './orderService';  // orderService imports productService

// services/orderService.ts
import { productService } from './productService';  // Circular!
```

**Why This Breaks:**
1. Module resolution fails or returns undefined
2. Runtime errors: "Cannot read property of undefined"
3. Hard to debug - appears random

**The Fix:**

```typescript
// Option 1: Extract shared logic to third module
// services/shared.ts
export function calculateTotal(items: OrderItem[]): number { /* ... */ }

// Option 2: Dependency injection
export function createOrderService(getProduct: (id: number) => Promise<Product>) {
  return {
    async createOrder(payload: OrderPayload) {
      const product = await getProduct(payload.productId);
    }
  };
}

// Option 3: Move import inside function (lazy import)
export async function createOrder(payload: OrderPayload) {
  const { productService } = await import('./productService');
}
```

---

## Service Module Pattern

This codebase exports service objects, not classes.

```typescript
// backend/src/services/productService.ts
import { pool } from '../db/client';
import type { Product, ProductPayload } from '../types';

const mapProductFromDb = (row: any): Product => ({ /* ... */ });

export async function list(filters?: ProductFilters): Promise<{
  products: Product[];
  total: number;
}> {
  // Implementation
}

export async function getById(id: number): Promise<Product | null> {
  // Implementation
}

export async function create(payload: ProductPayload): Promise<Product> {
  // Implementation
}

// Export as object for consistent API
export const productService = {
  list,
  getById,
  create,
};
```

### Usage

```typescript
import { productService } from '../services/productService';

const products = await productService.list({ isNew: true });
```

---

## API Module Pattern (Frontend)

```typescript
// frontend/src/api/products.ts
import { api } from './client';
import type { Product, ProductFilters, PaginatedResponse } from '../types';

export async function fetchProducts(
  filters?: ProductFilters
): Promise<PaginatedResponse<Product>> {
  const { data } = await api.get('/products', { params: filters });
  return data;
}

export async function fetchProduct(id: number): Promise<Product> {
  const { data } = await api.get(`/products/${id}`);
  return data;
}
```

---

## Type Declaration Files

For untyped dependencies, create `.d.ts` files.

```typescript
// frontend/src/types/global.d.ts
declare module 'some-untyped-library' {
  export function doSomething(input: string): number;
}

// Extend Window for globals
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}
```

---

## Environment Types

```typescript
// frontend/src/vite-env.d.ts
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_STRIPE_PUBLIC_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
```

---

## Import Order Convention

```typescript
// 1. Node built-ins (backend only)
import path from 'path';
import fs from 'fs';

// 2. External packages
import express from 'express';
import { useQuery } from '@tanstack/react-query';

// 3. Type-only imports
import type { Product, Order } from '../types';

// 4. Internal modules
import { productService } from '../services/productService';
import { ProductCard } from '../components/ProductCard';

// 5. Relative imports
import { formatPrice } from './utils';
```

---

## Related Skills

- See the **node** skill for Node.js module resolution
- See the **react** skill for component module patterns
- See the **vite** skill for build-time module handling