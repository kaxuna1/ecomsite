# Unit Testing Reference

## Contents
- Service Method Testing
- Authentication Service Tests
- Order Service Transaction Tests
- Error Handling Tests
- Async Testing Patterns

---

## Service Method Testing

Services in this codebase are exported object literals with async methods that directly call `pool.query()`. Mock the database module at the top level.

### Basic Pattern

```typescript
// backend/src/services/__tests__/productService.test.ts
import { productService } from '../productService';
import { pool } from '../../db/client';

jest.mock('../../db/client');

const mockPool = pool as jest.Mocked<typeof pool>;

describe('productService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('list', () => {
    it('returns mapped products', async () => {
      const dbRows = [
        { id: 1, name: 'Serum', price: '49.99', categories: '["Hair"]' }
      ];
      mockPool.query.mockResolvedValueOnce({ rows: dbRows, rowCount: 1 });

      const products = await productService.list({});

      expect(products).toHaveLength(1);
      expect(products[0].price).toBe(49.99); // Verify price parsing
    });
  });
});
```

---

## Authentication Service Tests

Test credential validation, JWT generation, and user lookup.

```typescript
// backend/src/services/__tests__/authService.test.ts
import { authService } from '../authService';
import { pool } from '../../db/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env';

jest.mock('../../db/client');
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');

describe('authService.validateCredentials', () => {
  const mockUser = {
    id: 1,
    email: 'admin@luxia.local',
    password_hash: '$2b$10$hashedpassword',
    name: 'Admin',
    role: 'admin',
    is_active: true
  };

  beforeEach(() => jest.clearAllMocks());

  it('returns null when user not found', async () => {
    (pool.query as jest.Mock).mockResolvedValueOnce({ rows: [] });

    const result = await authService.validateCredentials('unknown@test.com', 'pass');

    expect(result).toBeNull();
    expect(bcrypt.compare).not.toHaveBeenCalled();
  });

  it('returns null for inactive user', async () => {
    (pool.query as jest.Mock).mockResolvedValueOnce({
      rows: [{ ...mockUser, is_active: false }]
    });

    const result = await authService.validateCredentials('admin@luxia.local', 'pass');

    expect(result).toBeNull();
  });

  it('updates last_login on successful auth', async () => {
    (pool.query as jest.Mock)
      .mockResolvedValueOnce({ rows: [mockUser] }) // SELECT
      .mockResolvedValueOnce({ rows: [] }); // UPDATE last_login
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    (jwt.sign as jest.Mock).mockReturnValue('token');

    await authService.validateCredentials('admin@luxia.local', 'password');

    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE admin_users SET last_login'),
      [mockUser.id]
    );
  });
});
```

---

## Order Service Transaction Tests

Order creation uses database transactions. Mock `pool.connect()` to return a client with query/release methods.

### WARNING: Not Mocking Transactions Properly

**The Problem:**

```typescript
// BAD - Only mocks pool.query, misses transaction client
jest.mock('../../db/client');
(pool.query as jest.Mock).mockResolvedValue({ rows: [] });

await orderService.create(payload); // Fails: pool.connect is not a function
```

**Why This Breaks:**
1. `orderService.create()` calls `pool.connect()` for transactions
2. The client returned by `connect()` has its own `query()` method
3. Missing `client.release()` mock causes warnings

**The Fix:**

```typescript
// GOOD - Mock both pool and transaction client
const mockClient = {
  query: jest.fn(),
  release: jest.fn()
};

beforeEach(() => {
  (pool.connect as jest.Mock).mockResolvedValue(mockClient);
  mockClient.query.mockReset();
});

it('rolls back on inventory error', async () => {
  mockClient.query
    .mockResolvedValueOnce({}) // BEGIN
    .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // INSERT order
    .mockResolvedValueOnce({ rows: [{ inventory: 0 }] }); // Product with no stock

  await expect(orderService.create(payload))
    .rejects.toThrow('Insufficient inventory');

  expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
  expect(mockClient.release).toHaveBeenCalled();
});
```

---

## Error Handling Tests

Services return `null` or throw errors. Test both paths.

```typescript
describe('error handling', () => {
  it('getAdminById returns null on database error', async () => {
    (pool.query as jest.Mock).mockRejectedValueOnce(new Error('Connection lost'));

    const result = await authService.getAdminById(1);

    expect(result).toBeNull(); // Service catches and returns null
  });

  it('orderService.create throws on missing product', async () => {
    const mockClient = { query: jest.fn(), release: jest.fn() };
    (pool.connect as jest.Mock).mockResolvedValue(mockClient);
    
    mockClient.query
      .mockResolvedValueOnce({}) // BEGIN
      .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // INSERT order
      .mockResolvedValueOnce({ rows: [] }); // Product not found

    await expect(orderService.create(payload))
      .rejects.toThrow('Product 999 not found');
  });
});
```

---

## Async Testing Patterns

### Testing Promise Resolution Order

```typescript
it('fetches items for each order in parallel', async () => {
  const orders = [{ id: 1 }, { id: 2 }];
  (pool.query as jest.Mock)
    .mockResolvedValueOnce({ rows: orders }) // List orders
    .mockResolvedValueOnce({ rows: [{ product_id: 1 }] }) // Items for order 1
    .mockResolvedValueOnce({ rows: [{ product_id: 2 }] }); // Items for order 2

  const result = await orderService.list();

  expect(result).toHaveLength(2);
  expect(pool.query).toHaveBeenCalledTimes(3);
});
```

### Testing Concurrent Operations

```typescript
it('handles concurrent order creation', async () => {
  const client1 = { query: jest.fn().mockResolvedValue({}), release: jest.fn() };
  const client2 = { query: jest.fn().mockResolvedValue({}), release: jest.fn() };
  
  (pool.connect as jest.Mock)
    .mockResolvedValueOnce(client1)
    .mockResolvedValueOnce(client2);

  await Promise.all([
    orderService.create(payload1),
    orderService.create(payload2)
  ]);

  expect(client1.release).toHaveBeenCalled();
  expect(client2.release).toHaveBeenCalled();
});
```

---

## Validation Workflow

Copy this checklist when adding new service tests:

- [ ] Mock `../../db/client` at module level
- [ ] Clear mocks in `beforeEach`
- [ ] Test happy path returns expected shape
- [ ] Test empty results (user not found, product not found)
- [ ] Test error handling (database errors, validation errors)
- [ ] For transactions: mock `pool.connect()` returning client
- [ ] Verify ROLLBACK called on transaction failures
- [ ] Verify `client.release()` always called