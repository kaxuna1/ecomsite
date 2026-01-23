# Zod Patterns Reference

## Contents
- Schema Composition
- API Response Validation
- Form Schemas
- Discriminated Unions
- Anti-Patterns

---

## Schema Composition

Build complex schemas from simple ones.

```typescript
// Base schemas
const AddressSchema = z.object({
  addressLine1: z.string().min(1),
  addressLine2: z.string().optional(),
  city: z.string().min(1),
  postalCode: z.string().regex(/^\d{5}(-\d{4})?$/, 'Invalid postal code'),
  country: z.string().default('US'),
});

// Extended schema
const UserAddressSchema = AddressSchema.extend({
  userId: z.number(),
  isDefault: z.boolean().default(false),
  label: z.enum(['home', 'work', 'other']),
});

// Partial for updates
const UpdateAddressSchema = AddressSchema.partial();

// Pick specific fields
const ShippingInfoSchema = AddressSchema.pick({
  city: true,
  postalCode: true,
  country: true,
});
```

---

## API Response Validation

Validate external data at system boundaries.

```typescript
// frontend/src/api/products.ts
import { z } from 'zod';

const ProductSchema = z.object({
  id: z.number(),
  name: z.string(),
  price: z.number(),
  salePrice: z.number().nullable(),
  imageUrl: z.string().url().nullable(),
  categories: z.array(z.string()),
  inventory: z.number().int().nonnegative(),
  createdAt: z.string().transform(s => new Date(s)),
});

const ProductListResponse = z.object({
  products: z.array(ProductSchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
});

export type Product = z.infer<typeof ProductSchema>;

export async function fetchProducts(params: ProductFilters): Promise<Product[]> {
  const response = await api.get('/products', { params });
  const parsed = ProductListResponse.safeParse(response.data);
  
  if (!parsed.success) {
    console.error('API response validation failed:', parsed.error);
    throw new Error('Invalid API response');
  }
  
  return parsed.data.products;
}
```

---

## Form Schemas

Complex form validation with custom messages.

```typescript
// Checkout form matching frontend/src/pages/CheckoutPage.tsx
const CheckoutSchema = z.object({
  customer: z.object({
    name: z.string()
      .min(2, 'Name must be at least 2 characters')
      .max(100, 'Name is too long'),
    email: z.string()
      .email('Please enter a valid email'),
    phone: z.string()
      .regex(/^\+?[\d\s-()]+$/, 'Invalid phone number')
      .optional()
      .or(z.literal('')),
  }),
  address: z.object({
    line1: z.string().min(5, 'Address is required'),
    line2: z.string().optional(),
    city: z.string().min(2, 'City is required'),
    postalCode: z.string().min(3, 'Postal code is required'),
  }),
  promoCode: z.string().optional(),
  notes: z.string().max(500, 'Notes too long').optional(),
});

// Password confirmation
const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain uppercase letter')
    .regex(/[0-9]/, 'Must contain number'),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});
```

---

## Discriminated Unions

Type-safe unions with literal discriminators.

```typescript
// CMS Block types matching backend/src/types/cms.ts
const HeroBlockSchema = z.object({
  type: z.literal('hero'),
  headline: z.string(),
  subheadline: z.string().optional(),
  imageUrl: z.string().url().optional(),
  ctaText: z.string().optional(),
  ctaLink: z.string().optional(),
});

const FeaturesBlockSchema = z.object({
  type: z.literal('features'),
  items: z.array(z.object({
    title: z.string(),
    description: z.string(),
    icon: z.string().optional(),
  })),
});

const ProductsBlockSchema = z.object({
  type: z.literal('products'),
  productIds: z.array(z.number()),
  layout: z.enum(['grid', 'carousel']).default('grid'),
});

const BlockContentSchema = z.discriminatedUnion('type', [
  HeroBlockSchema,
  FeaturesBlockSchema,
  ProductsBlockSchema,
]);

type BlockContent = z.infer<typeof BlockContentSchema>;
```

---

## WARNING: Type Assertions Without Validation

**The Problem:**

```typescript
// BAD - Trusts external data
const response = await api.get('/products');
const products = response.data as Product[]; // No runtime check!
```

**Why This Breaks:**
1. API changes silently cause runtime errors
2. Crashes happen far from the invalid data source
3. TypeScript gives false confidence—types don't exist at runtime

**The Fix:**

```typescript
// GOOD - Validate at boundary
const response = await api.get('/products');
const products = z.array(ProductSchema).parse(response.data);
```

**When You Might Be Tempted:**
- "The API is internal, I control it" — APIs change, bugs happen
- "It's always worked" — Until it doesn't, at 3am in production

---

## WARNING: Mixing Validation Libraries

**The Problem:**

```typescript
// BAD - Two validation libraries for the same data
// Backend uses express-validator
body('email').isEmail().withMessage('Invalid email')

// Frontend has different rules
const schema = z.object({
  email: z.string().email(),
});
```

**Why This Breaks:**
1. Validation rules drift apart
2. Backend accepts what frontend rejects (or vice versa)
3. Double maintenance burden

**The Fix:**

Share Zod schemas between frontend and backend, or keep a single source of truth:

```typescript
// shared/schemas/user.ts (if using monorepo)
export const UserSchema = z.object({
  email: z.string().email('Invalid email'),
  name: z.string().min(2).max(100),
});

// Or document that frontend Zod must match backend express-validator
```

---

## WARNING: Overly Permissive Schemas

**The Problem:**

```typescript
// BAD - Too permissive
const ProductSchema = z.object({
  price: z.any(),           // Accepts anything
  categories: z.unknown(),  // No type information
});
```

**Why This Breaks:**
1. No actual validation occurs
2. TypeScript infers useless types
3. Errors surface deep in business logic

**The Fix:**

```typescript
// GOOD - Explicit types
const ProductSchema = z.object({
  price: z.number().positive(),
  categories: z.array(z.string()),
});