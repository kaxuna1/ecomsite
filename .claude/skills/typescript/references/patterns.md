# TypeScript Patterns Reference

## Contents
- Discriminated Unions
- Interface Composition
- Generic Constraints
- Type Guards
- Async Function Typing
- Database Row Mapping

---

## Discriminated Unions

Use for polymorphic data with a `type` field discriminator.

```typescript
// backend/src/types/cms.ts
export type BlockType = 'hero' | 'features' | 'products' | 'testimonials';

export type BlockContent =
  | HeroContent
  | FeaturesContent
  | ProductShowcaseContent;

export interface HeroContent {
  type: 'hero';
  headline: string;
  subheadline: string;
  imageUrl?: string;
}

export interface FeaturesContent {
  type: 'features';
  items: Array<{ title: string; description: string; icon?: string }>;
}
```

**Why:** TypeScript narrows the type automatically when you check the discriminant:

```typescript
// GOOD - TypeScript knows block.headline exists
if (block.type === 'hero') {
  return <h1>{block.headline}</h1>;
}

// BAD - No narrowing, unsafe access
return <h1>{(block as any).headline}</h1>;
```

---

## Interface Composition

Extend interfaces for variants of the same entity.

```typescript
// backend/src/types/navigation.ts
export interface MenuItem {
  id: number;
  label: string;
  linkType: 'internal' | 'external' | 'cms_page' | 'none';
  linkUrl: string | null;
}

// Extended with translations
export interface MenuItemDetail extends MenuItem {
  translations: MenuItemTranslation[];
}

// Extended with children for hierarchy
export interface MenuItemHierarchical extends MenuItem {
  children: MenuItemHierarchical[];
}
```

### WARNING: Don't Duplicate Fields

**The Problem:**

```typescript
// BAD - Duplicating fields across interfaces
interface Product {
  id: number;
  name: string;
  price: number;
}

interface ProductWithTranslations {
  id: number;        // Duplicated!
  name: string;      // Duplicated!
  price: number;     // Duplicated!
  translations: Translation[];
}
```

**Why This Breaks:**
1. Changes to `Product` won't propagate to `ProductWithTranslations`
2. Typos create silent mismatches
3. Maintenance burden grows with each variant

**The Fix:**

```typescript
// GOOD - Extend the base interface
interface ProductWithTranslations extends Product {
  translations: Translation[];
}
```

---

## Generic Constraints

Use `extends` to constrain generic parameters.

```typescript
// frontend/src/hooks/useAutoSave.ts
export function useAutoSave<T extends Record<string, any>>({
  data,
  onSave,
  debounceMs = 1000,
}: {
  data: T;
  onSave: (data: T) => Promise<void>;
  debounceMs?: number;
}) {
  // T is guaranteed to be an object
}
```

### Common Constraints

| Constraint | Use Case |
|------------|----------|
| `T extends Record<string, any>` | Objects with any properties |
| `T extends { id: number }` | Objects with required id |
| `T extends string \| number` | Primitive union |
| `T extends (...args: any[]) => any` | Function types |

---

## Type Guards

Use for runtime type checking with type narrowing.

```typescript
// Custom type guard
function isHeroBlock(block: BlockContent): block is HeroContent {
  return block.type === 'hero';
}

// Usage
if (isHeroBlock(block)) {
  console.log(block.headline);  // TypeScript knows this is HeroContent
}
```

### WARNING: Unsafe Type Assertions

**The Problem:**

```typescript
// BAD - Asserting without validation
const product = response.data as Product;
```

**Why This Breaks:**
1. No runtime validation
2. API changes cause silent failures
3. Crashes happen far from the source

**The Fix:**

```typescript
// GOOD - Validate with Zod (see the **zod** skill)
import { z } from 'zod';

const ProductSchema = z.object({
  id: z.number(),
  name: z.string(),
  price: z.number(),
});

const product = ProductSchema.parse(response.data);
```

---

## Async Function Typing

Always declare return types for service functions.

```typescript
// backend/src/services/productService.ts
export async function list(filters?: ProductFilters): Promise<{
  products: Product[];
  total: number;
  page: number;
  limit: number;
}> {
  // Implementation
}

export async function getById(id: number): Promise<Product | null> {
  const result = await pool.query(
    'SELECT * FROM products WHERE id = $1',
    [id]
  );
  return result.rows[0] ? mapProductFromDb(result.rows[0]) : null;
}
```

### WARNING: Missing Return Types

**The Problem:**

```typescript
// BAD - No return type, any is inferred
export async function getProduct(id: number) {
  const result = await pool.query('SELECT * FROM products WHERE id = $1', [id]);
  return result.rows[0];
}
```

**Why This Breaks:**
1. Return type is `any`, losing type safety downstream
2. Refactoring errors aren't caught
3. IDE autocomplete breaks

**The Fix:**

```typescript
// GOOD - Explicit return type
export async function getProduct(id: number): Promise<Product | null> {
  // ...
}
```

---

## Database Row Mapping

Convert PostgreSQL snake_case to TypeScript camelCase.

```typescript
// backend/src/services/cmsService.ts
const mapPageFromDb = (row: any): CMSPage => ({
  id: row.id,
  slug: row.slug,
  title: row.title,
  metaDescription: row.meta_description,
  metaKeywords: row.meta_keywords,
  isPublished: row.is_published,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

// Usage
const result = await pool.query('SELECT * FROM cms_pages WHERE id = $1', [id]);
return result.rows[0] ? mapPageFromDb(result.rows[0]) : null;
```

### Mapper Function Pattern

```typescript
// 1. Define the database row type (optional but helpful)
interface ProductRow {
  id: number;
  name: string;
  sale_price: number | null;
  created_at: Date;
}

// 2. Define the TypeScript entity
interface Product {
  id: number;
  name: string;
  salePrice: number | null;
  createdAt: Date;
}

// 3. Create the mapper
const mapProduct = (row: ProductRow): Product => ({
  id: row.id,
  name: row.name,
  salePrice: row.sale_price,
  createdAt: row.created_at,
});
```

---

## Related Skills

- See the **zod** skill for runtime schema validation
- See the **postgresql** skill for query result typing
- See the **express** skill for request/response typing