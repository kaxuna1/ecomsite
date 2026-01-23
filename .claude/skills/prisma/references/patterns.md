# Prisma Patterns Reference

## Contents
- Query Patterns
- Relation Modeling
- JSONB Handling
- Anti-Patterns

---

## Query Patterns

### Pagination with Count

```typescript
async function listProducts(page: number, limit: number) {
  const [products, total] = await prisma.$transaction([
    prisma.product.findMany({
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.product.count(),
  ]);
  
  return { products, total, page, limit };
}
```

### Filtering with Dynamic Where Clauses

```typescript
// Build where clause dynamically
const where: Prisma.ProductWhereInput = {};

if (filters.isNew) where.isNew = true;
if (filters.isFeatured) where.isFeatured = true;
if (filters.category) {
  where.categories = { array_contains: [filters.category] };
}

const products = await prisma.product.findMany({ where });
```

### Include vs Select

```typescript
// GOOD - Include related data
const product = await prisma.product.findUnique({
  where: { id },
  include: {
    translations: true,
    variants: { where: { isActive: true } },
  },
});

// GOOD - Select specific fields for performance
const product = await prisma.product.findUnique({
  where: { id },
  select: {
    id: true,
    name: true,
    price: true,
    translations: {
      where: { languageCode: 'ka' },
      select: { name: true, description: true },
    },
  },
});
```

---

## Relation Modeling

### One-to-Many (Product → Translations)

```prisma
model Product {
  id           Int                  @id @default(autoincrement())
  translations ProductTranslation[]
  @@map("products")
}

model ProductTranslation {
  id        Int     @id @default(autoincrement())
  productId Int     @map("product_id")
  product   Product @relation(fields: [productId], references: [id], onDelete: Cascade)
  @@map("product_translations")
}
```

### Many-to-Many (Product ↔ VariantOptionValue)

```prisma
model ProductVariant {
  id      Int                    @id @default(autoincrement())
  options ProductVariantOption[]
  @@map("product_variants")
}

model ProductVariantOption {
  variantId      Int              @map("variant_id")
  optionValueId  Int              @map("option_value_id")
  variant        ProductVariant   @relation(fields: [variantId], references: [id], onDelete: Cascade)
  optionValue    VariantOptionValue @relation(fields: [optionValueId], references: [id], onDelete: Cascade)
  
  @@id([variantId, optionValueId])
  @@map("product_variant_options")
}
```

### Self-Referencing (Menu Items Hierarchy)

```prisma
model MenuItem {
  id        Int        @id @default(autoincrement())
  parentId  Int?       @map("parent_id")
  parent    MenuItem?  @relation("MenuHierarchy", fields: [parentId], references: [id])
  children  MenuItem[] @relation("MenuHierarchy")
  @@map("menu_items")
}
```

---

## JSONB Handling

### Storing Arrays as JSONB

```prisma
model Product {
  categories Json  // Stored as ["Serums", "Treatments"]
  highlights Json? // Stored as ["Benefit 1", "Benefit 2"]
}
```

### Querying JSONB Arrays

```typescript
// Filter products containing category
const products = await prisma.product.findMany({
  where: {
    categories: {
      array_contains: ['Serums'],
    },
  },
});
```

### Custom Attributes Pattern

```prisma
model Product {
  customAttributes Json? @map("custom_attributes")
}
```

```typescript
// Query custom attribute
const products = await prisma.$queryRaw`
  SELECT * FROM products
  WHERE custom_attributes->>'brand' = ${brand}
`;
```

---

## Anti-Patterns

### WARNING: N+1 Query Problem

**The Problem:**

```typescript
// BAD - Fetches translations in separate queries for each product
const products = await prisma.product.findMany();
for (const product of products) {
  product.translations = await prisma.productTranslation.findMany({
    where: { productId: product.id },
  });
}
```

**Why This Breaks:**
1. 100 products = 101 database queries
2. Dramatically slower as dataset grows
3. Database connection pool exhaustion under load

**The Fix:**

```typescript
// GOOD - Single query with include
const products = await prisma.product.findMany({
  include: { translations: true },
});
```

### WARNING: Missing Transaction for Multi-Step Operations

**The Problem:**

```typescript
// BAD - No transaction, partial failure leaves inconsistent state
const order = await prisma.order.create({ data: orderData });
await prisma.orderItem.createMany({ data: items });
await prisma.product.update({
  where: { id: productId },
  data: { inventory: { decrement: quantity } },
});
```

**Why This Breaks:**
1. If inventory update fails, order exists without items
2. Overselling possible if inventory check happens before decrement
3. Customer charged for order that can't be fulfilled

**The Fix:**

```typescript
// GOOD - Atomic transaction
await prisma.$transaction(async (tx) => {
  const order = await tx.order.create({ data: orderData });
  await tx.orderItem.createMany({ data: items });
  await tx.product.update({
    where: { id: productId },
    data: { inventory: { decrement: quantity } },
  });
  return order;
});
```

### WARNING: Raw SQL Without Parameterization

**The Problem:**

```typescript
// BAD - SQL injection vulnerability
const products = await prisma.$queryRawUnsafe(
  `SELECT * FROM products WHERE name LIKE '%${searchTerm}%'`
);
```

**The Fix:**

```typescript
// GOOD - Parameterized query
const products = await prisma.$queryRaw`
  SELECT * FROM products WHERE name LIKE ${'%' + searchTerm + '%'}
`;
```

### WARNING: Decimal Precision Loss

**The Problem:**

```typescript
// BAD - JavaScript number loses precision
const price = product.price; // Decimal -> number truncation
```

**The Fix:**

```typescript
// GOOD - Convert explicitly or use Decimal.js
import { Decimal } from '@prisma/client/runtime/library';

const priceString = product.price.toString(); // "49.99"
const priceNumber = Number(product.price);    // 49.99 (for display only)
```

---

## Performance Tips

| Scenario | Approach |
|----------|----------|
| List with count | Use `$transaction` for atomic count+fetch |
| Large datasets | Use cursor-based pagination over offset |
| Bulk operations | Use `createMany`, `updateMany` with skipDuplicates |
| Complex filters | Build `where` object dynamically |
| JSONB queries | Use `$queryRaw` for complex JSON operations |