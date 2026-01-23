---
name: express
description: |
  Builds RESTful API routes, middleware, and request handling with service layer patterns.
  Use when: Creating API endpoints, adding middleware, implementing authentication guards, or structuring backend services.
allowed-tools: Read, Edit, Write, Glob, Grep, Bash
---

# Express Skill

Express backend for Luxia e-commerce uses a service layer pattern with modular routing. Routes handle HTTP concerns, services contain business logic, and middleware manages cross-cutting concerns like auth and rate limiting.

## Quick Start

### Creating a Route

```typescript
// backend/src/routes/exampleRoutes.ts
import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { authenticate } from '../middleware/authMiddleware';
import { exampleService } from '../services/exampleService';

const router = Router();

router.post(
  '/',
  authenticate,
  [body('name').notEmpty(), body('email').isEmail()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const result = await exampleService.create(req.body);
      res.status(201).json(result);
    } catch (error: any) {
      console.error('Error:', error);
      res.status(500).json({ message: error.message });
    }
  }
);

export default router;
```

### Creating a Service

```typescript
// backend/src/services/exampleService.ts
import { pool } from '../db/client';

export const exampleService = {
  async create(payload: { name: string; email: string }) {
    const result = await pool.query(
      'INSERT INTO examples (name, email) VALUES ($1, $2) RETURNING *',
      [payload.name, payload.email]
    );
    return result.rows[0];
  },

  async findById(id: number) {
    const result = await pool.query(
      'SELECT * FROM examples WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }
};
```

## Key Concepts

| Concept | Usage | Example |
|---------|-------|---------|
| Route | HTTP endpoint definition | `router.get('/items', handler)` |
| Service | Business logic encapsulation | `itemService.findById(id)` |
| Middleware | Request preprocessing | `authenticate`, `rateLimiter` |
| Validator | Input validation | `body('email').isEmail()` |
| Pool | Database connection | `pool.query(sql, params)` |

## Common Patterns

### Protected Admin Route

```typescript
router.use(authenticate);  // All routes below require auth

router.get('/', async (req, res) => {
  const adminId = (req as AuthenticatedRequest).adminId;
  // ...
});
```

### Optional Authentication

```typescript
router.get('/public', optionalAuth, async (req, res) => {
  const userId = (req as AuthenticatedRequest).userId; // May be undefined
  // ...
});
```

### File Upload with Processing

```typescript
router.post('/', authenticate, upload.single('image'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file provided' });
  }
  const processed = await sharp(req.file.buffer).webp().toBuffer();
  // ...
});
```

## See Also

- [routes](references/routes.md) - Route organization and patterns
- [services](references/services.md) - Service layer architecture
- [database](references/database.md) - PostgreSQL query patterns
- [auth](references/auth.md) - JWT authentication flow
- [errors](references/errors.md) - Error handling patterns

## Related Skills

- See the **postgresql** skill for database schema and query optimization
- See the **typescript** skill for type safety patterns
- See the **node** skill for Node.js runtime patterns
- See the **zod** skill for runtime validation (alternative to express-validator)