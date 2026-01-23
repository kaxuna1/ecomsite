---
name: jest
description: |
  Jest unit testing and test configuration for Express + TypeScript backend services.
  Use when: Writing unit tests, mocking services, testing business logic, setting up test infrastructure, or validating service layer functions.
allowed-tools: Read, Edit, Write, Glob, Grep, Bash
---

# Jest Skill

Writes unit tests and mocks for Express + TypeScript backend services. This codebase uses a service layer pattern with object literal exports and direct PostgreSQL `pool.query()` calls requiring manual mocking.

## Quick Start

### Install Dependencies

```bash
cd backend
npm install -D jest @types/jest ts-jest @faker-js/faker
npx ts-jest config:init
```

### Basic Service Test

```typescript
// backend/src/services/__tests__/authService.test.ts
import { authService } from '../authService';
import { pool } from '../../db/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

jest.mock('../../db/client');
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');

describe('authService', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('validateCredentials', () => {
    it('returns token for valid credentials', async () => {
      const mockUser = { id: 1, email: 'admin@test.com', password_hash: 'hash', name: 'Admin', role: 'admin', is_active: true };
      (pool.query as jest.Mock).mockResolvedValueOnce({ rows: [mockUser] });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (jwt.sign as jest.Mock).mockReturnValue('mock-token');

      const result = await authService.validateCredentials('admin@test.com', 'password');

      expect(result).toEqual({ token: 'mock-token', user: expect.objectContaining({ email: 'admin@test.com' }) });
    });

    it('returns null for invalid password', async () => {
      (pool.query as jest.Mock).mockResolvedValueOnce({ rows: [{ is_active: true, password_hash: 'hash' }] });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      expect(await authService.validateCredentials('admin@test.com', 'wrong')).toBeNull();
    });
  });
});
```

## Key Concepts

| Concept | Usage | Example |
|---------|-------|---------|
| Mock pool.query | Replace database calls | `jest.mock('../../db/client')` |
| Test transactions | Mock client.connect() | See integration reference |
| JWT token factory | Generate test tokens | `jwt.sign({ userId: 1 }, secret)` |
| Type factories | Create typed test data | `createProduct({ name: 'Test' })` |

## Configuration

### jest.config.ts

```typescript
export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  setupFilesAfterEnv: ['<rootDir>/src/test/setup.ts'],
  clearMocks: true,
  collectCoverageFrom: ['src/services/**/*.ts', '!src/**/*.d.ts']
};
```

### Test Setup File

```typescript
// backend/src/test/setup.ts
jest.mock('../db/client', () => ({
  pool: {
    query: jest.fn(),
    connect: jest.fn()
  }
}));

// Reset env for tests
process.env.JWT_SECRET = 'test-secret';
process.env.NODE_ENV = 'test';
```

## Common Patterns

### Testing Service Methods

**When:** Testing exported object literal services

```typescript
// Services export object literals - mock at module level
jest.mock('../../db/client');

describe('orderService.create', () => {
  const mockClient = {
    query: jest.fn(),
    release: jest.fn()
  };

  beforeEach(() => {
    (pool.connect as jest.Mock).mockResolvedValue(mockClient);
  });

  it('creates order with transaction', async () => {
    mockClient.query
      .mockResolvedValueOnce({}) // BEGIN
      .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // INSERT order
      .mockResolvedValueOnce({ rows: [{ id: 1, inventory: 10 }] }) // SELECT product
      .mockResolvedValueOnce({}) // INSERT order_item
      .mockResolvedValueOnce({}) // UPDATE inventory
      .mockResolvedValueOnce({}); // COMMIT

    const order = await orderService.create(mockOrderPayload);
    expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
  });
});
```

## See Also

- [Unit Testing](references/unit.md) - Service method testing patterns
- [Integration Testing](references/integration.md) - Route and database testing
- [Mocking](references/mocking.md) - Database, JWT, and external API mocks
- [Fixtures](references/fixtures.md) - Test data factories and type builders

## Related Skills

- See the **typescript** skill for type safety patterns in tests
- See the **postgresql** skill for understanding query patterns to mock
- See the **express** skill for route handler testing approaches
- See the **playwright** skill for E2E testing (complementary to Jest unit tests)