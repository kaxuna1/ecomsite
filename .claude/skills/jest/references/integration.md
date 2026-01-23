# Integration Testing Reference

## Contents
- Route Handler Testing with Supertest
- Database Integration Tests
- Authentication Flow Testing
- Transaction Testing
- E2E Test Database Setup

---

## Route Handler Testing with Supertest

Test Express routes with mocked services or real database.

### Setup

```bash
npm install -D supertest @types/supertest
```

### Basic Route Test

```typescript
// backend/src/routes/__tests__/authRoutes.test.ts
import request from 'supertest';
import express from 'express';
import { authRoutes } from '../authRoutes';
import { authService } from '../../services/authService';

jest.mock('../../services/authService');

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

describe('POST /api/auth/login', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 200 with token for valid credentials', async () => {
    (authService.validateCredentials as jest.Mock).mockResolvedValue({
      token: 'jwt-token',
      user: { id: 1, email: 'admin@test.com', name: 'Admin', role: 'admin' }
    });

    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@test.com', password: 'password123' });

    expect(response.status).toBe(200);
    expect(response.body.token).toBe('jwt-token');
  });

  it('returns 400 for invalid email format', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'invalid', password: 'password123' });

    expect(response.status).toBe(400);
    expect(response.body.errors).toBeDefined();
  });

  it('returns 401 for invalid credentials', async () => {
    (authService.validateCredentials as jest.Mock).mockResolvedValue(null);

    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@test.com', password: 'wrong' });

    expect(response.status).toBe(401);
  });
});
```

---

## Database Integration Tests

For tests that need real database interactions, use a test database.

### WARNING: Shared Database State

**The Problem:**

```typescript
// BAD - Tests pollute each other
describe('orderService', () => {
  it('creates order', async () => {
    await orderService.create(payload); // Leaves data in DB
  });

  it('lists orders', async () => {
    const orders = await orderService.list();
    // Includes order from previous test!
  });
});
```

**Why This Breaks:**
1. Test order affects results
2. Parallel test runs cause race conditions
3. Flaky tests that pass/fail inconsistently

**The Fix:**

```typescript
// GOOD - Isolate each test with transactions
describe('orderService (integration)', () => {
  let client: PoolClient;

  beforeEach(async () => {
    client = await pool.connect();
    await client.query('BEGIN');
  });

  afterEach(async () => {
    await client.query('ROLLBACK');
    client.release();
  });

  it('creates order', async () => {
    // Test runs in transaction that gets rolled back
  });
});
```

### Test Database Configuration

```typescript
// backend/src/test/db-setup.ts
import { Pool } from 'pg';

export const testPool = new Pool({
  host: process.env.TEST_DB_HOST || 'localhost',
  port: 5432,
  database: 'luxia_test',
  user: 'postgres',
  password: process.env.TEST_DB_PASSWORD
});

export async function resetTestDatabase() {
  await testPool.query('TRUNCATE products, orders, order_items, users RESTART IDENTITY CASCADE');
}
```

---

## Authentication Flow Testing

Test protected routes with JWT tokens.

```typescript
// backend/src/routes/__tests__/productRoutes.test.ts
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { app } from '../../app';

describe('Protected Product Routes', () => {
  const adminToken = jwt.sign(
    { id: 1, email: 'admin@test.com', role: 'admin' },
    process.env.JWT_SECRET || 'test-secret',
    { expiresIn: '1h' }
  );

  const userToken = jwt.sign(
    { userId: 1, email: 'user@test.com' },
    process.env.JWT_SECRET || 'test-secret',
    { expiresIn: '1h' }
  );

  it('allows admin to create product', async () => {
    const response = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Test Product', price: 29.99, inventory: 10 });

    expect(response.status).toBe(201);
  });

  it('rejects user token for admin routes', async () => {
    const response = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ name: 'Test', price: 10, inventory: 5 });

    expect(response.status).toBe(403);
  });

  it('returns 401 without token', async () => {
    const response = await request(app)
      .post('/api/products')
      .send({ name: 'Test', price: 10, inventory: 5 });

    expect(response.status).toBe(401);
  });
});
```

---

## Transaction Testing

Test that transactions commit on success and rollback on failure.

```typescript
describe('Order Transaction Integrity', () => {
  it('decrements inventory on order creation', async () => {
    // Setup: Create product with known inventory
    await pool.query(
      'INSERT INTO products (name, price, inventory) VALUES ($1, $2, $3)',
      ['Test Product', 10, 100]
    );

    // Act: Create order
    await orderService.create({
      customer: { name: 'Test', email: 'test@test.com', address: '123 St' },
      items: [{ productId: 1, quantity: 5 }],
      total: 50
    });

    // Assert: Check inventory decreased
    const result = await pool.query('SELECT inventory FROM products WHERE id = 1');
    expect(result.rows[0].inventory).toBe(95);
  });

  it('does not decrement inventory on failed order', async () => {
    await pool.query(
      'INSERT INTO products (name, price, inventory) VALUES ($1, $2, $3)',
      ['Limited Product', 10, 2]
    );

    // Try to order more than available
    await expect(
      orderService.create({
        customer: { name: 'Test', email: 'test@test.com', address: '123 St' },
        items: [{ productId: 1, quantity: 10 }], // More than 2 available
        total: 100
      })
    ).rejects.toThrow('Insufficient inventory');

    // Inventory should be unchanged
    const result = await pool.query('SELECT inventory FROM products WHERE id = 1');
    expect(result.rows[0].inventory).toBe(2);
  });
});
```

---

## Integration Test Workflow

1. Run tests: `npm test -- --runInBand`
2. Validate database state after each test
3. If tests fail, check for uncommitted transactions
4. Only proceed when all integration tests pass

Copy this checklist:
- [ ] Test database created and migrated
- [ ] Each test wrapped in transaction (or uses truncate)
- [ ] JWT tokens generated with correct payload structure
- [ ] Both success and error paths tested
- [ ] Verify database state assertions