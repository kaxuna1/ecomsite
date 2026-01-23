# Mocking Reference

## Contents
- Database Pool Mocking
- Transaction Client Mocking
- JWT and Authentication Mocking
- External API Mocking
- File System and Sharp Mocking
- Environment Variable Mocking

---

## Database Pool Mocking

The `pool` export from `db/client.ts` is the primary database interface.

### Basic Pool Mock

```typescript
// backend/src/test/__mocks__/db/client.ts
export const pool = {
  query: jest.fn(),
  connect: jest.fn()
};
```

### Using in Tests

```typescript
import { pool } from '../../db/client';

jest.mock('../../db/client');

const mockPool = pool as jest.Mocked<typeof pool>;

describe('service', () => {
  beforeEach(() => {
    mockPool.query.mockReset();
  });

  it('queries database', async () => {
    mockPool.query.mockResolvedValueOnce({
      rows: [{ id: 1, name: 'Test' }],
      rowCount: 1
    });

    const result = await someService.findById(1);

    expect(mockPool.query).toHaveBeenCalledWith(
      expect.stringContaining('SELECT'),
      [1]
    );
  });
});
```

---

## Transaction Client Mocking

Order creation and other transactional operations need special handling.

### WARNING: Forgetting client.release()

**The Problem:**

```typescript
// BAD - Missing release causes connection pool exhaustion
const mockClient = { query: jest.fn() };
(pool.connect as jest.Mock).mockResolvedValue(mockClient);
```

**Why This Breaks:**
1. Service calls `client.release()` in finally block
2. Missing mock throws: `release is not a function`
3. In real code, unreleased clients exhaust pool

**The Fix:**

```typescript
// GOOD - Complete client mock
const mockClient = {
  query: jest.fn(),
  release: jest.fn()
};

beforeEach(() => {
  (pool.connect as jest.Mock).mockResolvedValue(mockClient);
  mockClient.query.mockReset();
  mockClient.release.mockReset();
});

afterEach(() => {
  expect(mockClient.release).toHaveBeenCalled(); // Verify cleanup
});
```

### Sequencing Transaction Queries

```typescript
it('executes transaction in correct order', async () => {
  mockClient.query
    .mockResolvedValueOnce({}) // BEGIN
    .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // INSERT order
    .mockResolvedValueOnce({ rows: [{ id: 1, inventory: 100 }] }) // SELECT product
    .mockResolvedValueOnce({}) // INSERT order_item
    .mockResolvedValueOnce({}) // UPDATE inventory
    .mockResolvedValueOnce({}); // COMMIT

  await orderService.create(payload);

  const calls = mockClient.query.mock.calls.map(c => c[0]);
  expect(calls[0]).toBe('BEGIN');
  expect(calls[calls.length - 1]).toBe('COMMIT');
});
```

---

## JWT and Authentication Mocking

### Mock JWT Module

```typescript
// Test file
import jwt from 'jsonwebtoken';

jest.mock('jsonwebtoken');

describe('auth', () => {
  it('generates token with correct payload', async () => {
    (jwt.sign as jest.Mock).mockReturnValue('mock-token');

    await authService.validateCredentials('admin@test.com', 'password');

    expect(jwt.sign).toHaveBeenCalledWith(
      expect.objectContaining({
        id: expect.any(Number),
        email: 'admin@test.com',
        role: expect.any(String)
      }),
      expect.any(String),
      expect.objectContaining({ expiresIn: '8h' })
    );
  });
});
```

### Token Factory for Route Tests

```typescript
// backend/src/test/factories/token.ts
import jwt from 'jsonwebtoken';

const TEST_SECRET = 'test-jwt-secret';

export function createAdminToken(overrides = {}) {
  return jwt.sign(
    { id: 1, email: 'admin@test.com', role: 'admin', ...overrides },
    TEST_SECRET,
    { expiresIn: '1h' }
  );
}

export function createUserToken(overrides = {}) {
  return jwt.sign(
    { userId: 1, email: 'user@test.com', ...overrides },
    TEST_SECRET,
    { expiresIn: '1h' }
  );
}

// Usage in tests
const adminToken = createAdminToken({ id: 5, role: 'superadmin' });
```

---

## External API Mocking

### Mocking bcryptjs

```typescript
import bcrypt from 'bcryptjs';

jest.mock('bcryptjs');

beforeEach(() => {
  (bcrypt.compare as jest.Mock).mockResolvedValue(true);
  (bcrypt.hash as jest.Mock).mockResolvedValue('$2b$10$hashed');
});

it('hashes password before storing', async () => {
  await userService.create({ email: 'test@test.com', password: 'secret' });

  expect(bcrypt.hash).toHaveBeenCalledWith('secret', 10);
});
```

### Mocking Nodemailer

```typescript
// backend/src/test/__mocks__/nodemailer.ts
export const createTransport = jest.fn(() => ({
  sendMail: jest.fn().mockResolvedValue({ messageId: 'test-id' })
}));

// Test file
jest.mock('nodemailer');
import nodemailer from 'nodemailer';

it('sends email notification', async () => {
  const mockSendMail = jest.fn().mockResolvedValue({});
  (nodemailer.createTransport as jest.Mock).mockReturnValue({ sendMail: mockSendMail });

  await emailService.sendOrderConfirmation(order);

  expect(mockSendMail).toHaveBeenCalledWith(
    expect.objectContaining({
      to: order.customer.email,
      subject: expect.stringContaining('Order Confirmation')
    })
  );
});
```

### Mocking AI Providers (OpenAI/Anthropic)

```typescript
// backend/src/test/__mocks__/openai.ts
export default jest.fn().mockImplementation(() => ({
  chat: {
    completions: {
      create: jest.fn().mockResolvedValue({
        choices: [{ message: { content: 'Generated content' } }],
        usage: { total_tokens: 100 }
      })
    }
  }
}));

// Test file
jest.mock('openai');

it('generates product description', async () => {
  const result = await aiService.generateDescription({ productName: 'Serum' });
  expect(result).toContain('Generated content');
});
```

---

## File System and Sharp Mocking

### Mocking Sharp for Image Processing

```typescript
// backend/src/test/__mocks__/sharp.ts
const sharpMock = jest.fn(() => ({
  resize: jest.fn().mockReturnThis(),
  webp: jest.fn().mockReturnThis(),
  toFile: jest.fn().mockResolvedValue({ width: 800, height: 600 }),
  toBuffer: jest.fn().mockResolvedValue(Buffer.from('fake-image'))
}));

export default sharpMock;

// Test file
jest.mock('sharp');

it('converts image to webp', async () => {
  const sharp = require('sharp');
  
  await mediaService.processImage(buffer, 'test.jpg');

  expect(sharp).toHaveBeenCalled();
  expect(sharp().webp).toHaveBeenCalledWith({ quality: 85 });
});
```

---

## Environment Variable Mocking

### Setup for Test Environment

```typescript
// backend/src/test/setup.ts
process.env.JWT_SECRET = 'test-secret-key';
process.env.NODE_ENV = 'test';
process.env.DB_HOST = 'localhost';
process.env.DB_NAME = 'luxia_test';

// Mock the env module
jest.mock('../config/env', () => ({
  env: {
    jwtSecret: 'test-secret-key',
    nodeEnv: 'test',
    dbHost: 'localhost',
    dbPort: 5432,
    dbName: 'luxia_test',
    dbUser: 'postgres',
    dbPassword: 'test'
  }
}));
```

### Per-Test Environment Override

```typescript
describe('with different config', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv, JWT_SECRET: 'different-secret' };
  });

  afterEach(() => {
    process.env = originalEnv;
  });
});
```