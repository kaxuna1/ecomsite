# Test Fixtures Reference

## Contents
- Type-Safe Factory Functions
- Order and Product Fixtures
- User and Auth Fixtures
- Database Seeding for Tests
- Reusable Mock Data Patterns

---

## Type-Safe Factory Functions

Create fixtures that match TypeScript interfaces from `src/types/index.ts`.

### Product Factory

```typescript
// backend/src/test/factories/product.ts
import type { Product, ProductPayload } from '../../types';

let productIdCounter = 1;

export function createProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: productIdCounter++,
    name: 'Test Product',
    short_description: 'Short desc',
    description: 'Full description',
    price: 29.99,
    sale_price: null,
    image_url: '/uploads/test.webp',
    inventory: 100,
    categories: '["Hair Care"]',
    highlights: '["Benefit 1", "Benefit 2"]',
    usage: 'Apply daily',
    is_new: false,
    is_featured: false,
    sales_count: 0,
    slug: 'test-product',
    ...overrides
  };
}

export function createProductPayload(overrides: Partial<ProductPayload> = {}): ProductPayload {
  return {
    name: 'New Product',
    shortDescription: 'Short',
    description: 'Description',
    price: 19.99,
    inventory: 50,
    categories: ['Hair Care'],
    ...overrides
  };
}

// Reset counter between test files
export function resetProductCounter() {
  productIdCounter = 1;
}
```

### Order Factory

```typescript
// backend/src/test/factories/order.ts
import type { OrderPayload } from '../../types';

export function createOrderPayload(overrides: Partial<OrderPayload> = {}): OrderPayload {
  return {
    customer: {
      name: 'Test Customer',
      email: 'customer@test.com',
      phone: '+1234567890',
      address: '123 Test Street, City, 12345'
    },
    items: [
      { productId: 1, quantity: 2 }
    ],
    total: 59.98,
    ...overrides
  };
}

export function createOrderWithPromo(discount: number): OrderPayload {
  return createOrderPayload({
    promoCode: {
      id: 1,
      code: 'TEST20',
      discount
    },
    total: 59.98 - discount
  });
}
```

---

## User and Auth Fixtures

### Admin User Factory

```typescript
// backend/src/test/factories/user.ts
interface AdminUser {
  id: number;
  email: string;
  password_hash: string;
  name: string;
  role: string;
  is_active: boolean;
}

export function createAdminUser(overrides: Partial<AdminUser> = {}): AdminUser {
  return {
    id: 1,
    email: 'admin@luxia.local',
    password_hash: '$2b$10$validhash', // Pre-computed bcrypt hash
    name: 'Test Admin',
    role: 'admin',
    is_active: true,
    ...overrides
  };
}

export function createInactiveAdmin(): AdminUser {
  return createAdminUser({ is_active: false });
}

export function createSuperAdmin(): AdminUser {
  return createAdminUser({ role: 'superadmin', name: 'Super Admin' });
}
```

### Customer User Factory

```typescript
export function createUser(overrides = {}) {
  return {
    id: 1,
    email: 'user@test.com',
    password_hash: '$2b$10$validhash',
    name: 'Test User',
    phone: '+1234567890',
    created_at: new Date().toISOString(),
    ...overrides
  };
}
```

---

## Database Row Factories

Match exact database column formats for mocking `pool.query` results.

### WARNING: Mismatched Column Names

**The Problem:**

```typescript
// BAD - Uses camelCase, but DB returns snake_case
const mockProduct = { imageUrl: '/test.jpg', isNew: true };
(pool.query as jest.Mock).mockResolvedValue({ rows: [mockProduct] });
// Service mapper fails: row.image_url is undefined
```

**Why This Breaks:**
1. PostgreSQL returns snake_case columns
2. Service mappers expect `row.image_url`, not `row.imageUrl`
3. Tests pass but production fails

**The Fix:**

```typescript
// GOOD - Match database column names exactly
export function createProductRow(overrides = {}) {
  return {
    id: 1,
    name: 'Test Product',
    short_description: 'Short',
    description: 'Full',
    price: '29.99', // PostgreSQL returns numeric as string
    sale_price: null,
    image_url: '/uploads/test.webp', // snake_case
    inventory: 100,
    categories: '["Hair"]', // JSONB returned as string
    highlights: '["Benefit"]',
    usage: 'Apply daily',
    is_new: false, // snake_case boolean
    is_featured: false,
    sales_count: 0,
    slug: 'test-product',
    created_at: new Date().toISOString(),
    ...overrides
  };
}
```

---

## Complete Test Setup Example

```typescript
// backend/src/test/factories/index.ts
export * from './product';
export * from './order';
export * from './user';

// backend/src/services/__tests__/orderService.test.ts
import { pool } from '../../db/client';
import { orderService } from '../orderService';
import { 
  createOrderPayload, 
  createProductRow, 
  resetProductCounter 
} from '../../test/factories';

jest.mock('../../db/client');

describe('orderService', () => {
  const mockClient = {
    query: jest.fn(),
    release: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    resetProductCounter();
    (pool.connect as jest.Mock).mockResolvedValue(mockClient);
  });

  it('creates order with items', async () => {
    const product = createProductRow({ id: 1, inventory: 50, price: '29.99' });
    const payload = createOrderPayload({
      items: [{ productId: 1, quantity: 2 }],
      total: 59.98
    });

    mockClient.query
      .mockResolvedValueOnce({}) // BEGIN
      .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // INSERT order
      .mockResolvedValueOnce({ rows: [product] }) // SELECT product
      .mockResolvedValueOnce({}) // INSERT order_item
      .mockResolvedValueOnce({}) // UPDATE inventory
      .mockResolvedValueOnce({}); // COMMIT

    const order = await orderService.create(payload);

    expect(order.total).toBe(59.98);
  });
});
```

---

## Database Seeding for Integration Tests

```typescript
// backend/src/test/seed.ts
import { pool } from '../db/client';
import { createProductRow, createAdminUser } from './factories';

export async function seedTestData() {
  // Clear existing data
  await pool.query('TRUNCATE products, orders, order_items, admin_users RESTART IDENTITY CASCADE');

  // Insert test admin
  const admin = createAdminUser();
  await pool.query(
    'INSERT INTO admin_users (email, password_hash, name, role, is_active) VALUES ($1, $2, $3, $4, $5)',
    [admin.email, admin.password_hash, admin.name, admin.role, admin.is_active]
  );

  // Insert test products
  for (let i = 1; i <= 5; i++) {
    const product = createProductRow({ 
      id: i, 
      name: `Product ${i}`,
      slug: `product-${i}`
    });
    await pool.query(
      `INSERT INTO products (name, short_description, description, price, inventory, categories, slug, is_new, is_featured)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [product.name, product.short_description, product.description, 
       product.price, product.inventory, product.categories, product.slug,
       product.is_new, product.is_featured]
    );
  }
}

export async function cleanupTestData() {
  await pool.query('TRUNCATE products, orders, order_items, admin_users RESTART IDENTITY CASCADE');
}
```

---

## Fixture Validation Workflow

Copy this checklist when creating new fixtures:

- [ ] Factory returns correct TypeScript interface
- [ ] Database row factories use snake_case column names
- [ ] Numeric fields match PostgreSQL return types (strings for NUMERIC)
- [ ] JSONB fields returned as strings
- [ ] ID counter resets between test files
- [ ] Partial overrides work correctly
- [ ] Related entities reference valid IDs