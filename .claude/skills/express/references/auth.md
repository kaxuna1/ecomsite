# Authentication Reference

## Contents
- JWT Structure
- Auth Middleware
- Token Generation
- Protected Routes
- Dual Auth System
- Anti-Patterns

## JWT Structure

Two token types for different user types:

```typescript
// Admin token payload
{
  id: 1,
  email: 'admin@example.com',
  role: 'admin',
  iat: 1234567890,
  exp: 1234596690  // 8 hours
}

// Customer token payload
{
  userId: 5,
  email: 'customer@example.com',
  iat: 1234567890,
  exp: 1235172690  // 7 days
}
```

## Auth Middleware

Three variants in `backend/src/middleware/authMiddleware.ts`:

**Required Authentication:**

```typescript
export const authenticate = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const token = header.replace('Bearer ', '');
  try {
    const payload = jwt.verify(token, env.jwtSecret) as JWTPayload;
    req.user = { email: payload.email };
    
    if (payload.userId) req.userId = payload.userId;
    if (payload.id && payload.role) {
      req.adminId = payload.id;
      req.role = payload.role;
    }
    
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};
```

**User-Only Authentication:**

```typescript
export const userAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  // ... token extraction ...
  if (!payload.userId) {
    return res.status(403).json({ message: 'User authentication required' });
  }
  req.userId = payload.userId;
  next();
};
```

**Optional Authentication:**

```typescript
export const optionalAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return next();  // Continue as guest
  }
  // ... try to extract auth ...
  next();
};
```

## Token Generation

In `authService.ts`:

```typescript
export const authService = {
  async validateCredentials(email: string, password: string) {
    const result = await pool.query(
      'SELECT id, email, password_hash, name, role, is_active FROM admin_users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) return null;
    const user = result.rows[0];
    if (!user.is_active) return null;

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return null;

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      env.jwtSecret,
      { expiresIn: '8h' }
    );

    return {
      token,
      user: { id: user.id, email: user.email, name: user.name, role: user.role }
    };
  }
};
```

## Protected Routes

**Admin-Only Route File:**

```typescript
const router = Router();
router.use(authenticate);  // Apply to all routes

router.get('/', async (req, res) => {
  const adminId = (req as AuthenticatedRequest).adminId;
  // ...
});

router.post('/', async (req, res) => {
  // Already authenticated
});
```

**Mixed Protection:**

```typescript
// Public
router.get('/products', handler);

// Customer-only
router.post('/favorites', userAuth, handler);

// Admin-only
router.post('/products', authenticate, handler);
```

## Dual Auth System

| Aspect | Admin | Customer |
|--------|-------|----------|
| Table | `admin_users` | `users` |
| Login | `POST /api/auth/login` | `POST /api/user/auth/login` |
| Token field | `id`, `role` | `userId` |
| Middleware | `authenticate` | `userAuth` |
| Duration | 8 hours | 7 days |

**Accessing Auth Data in Routes:**

```typescript
// Admin routes
router.get('/', authenticate, async (req, res) => {
  const { adminId, role } = req as AuthenticatedRequest;
  if (role !== 'admin') {
    return res.status(403).json({ message: 'Admin required' });
  }
});

// Customer routes
router.get('/', userAuth, async (req, res) => {
  const { userId } = req as AuthenticatedRequest;
  const orders = await orderService.findByUser(userId);
});
```

---

## Anti-Patterns

### WARNING: Weak JWT Secret

**The Problem:**

```typescript
// BAD - Predictable secret
const token = jwt.sign(payload, 'secret123');

// BAD - Using fallback in production
jwt.sign(payload, process.env.JWT_SECRET || 'fallback-secret');
```

**Why This Breaks:**
1. Weak secrets can be brute-forced
2. Fallbacks mean production runs without proper secret
3. Anyone can forge valid tokens

**The Fix:**

```typescript
// config/env.ts
export const env = {
  jwtSecret: (() => {
    const secret = process.env.JWT_SECRET;
    if (!secret && process.env.NODE_ENV === 'production') {
      throw new Error('JWT_SECRET required in production');
    }
    return secret || 'dev-only-secret';
  })()
};
```

Generate strong secret: `openssl rand -base64 32`

### WARNING: Not Checking Token Expiry

**The Problem:**

```typescript
// BAD - Only checking signature
const payload = jwt.decode(token);  // No verification!
```

**The Fix:**

```typescript
// GOOD - verify() checks signature AND expiry
try {
  const payload = jwt.verify(token, env.jwtSecret);
} catch (error) {
  if (error.name === 'TokenExpiredError') {
    return res.status(401).json({ message: 'Token expired' });
  }
  return res.status(401).json({ message: 'Invalid token' });
}
```

### WARNING: Storing Sensitive Data in Token

**The Problem:**

```typescript
// BAD - Password hash in token
jwt.sign({ email, passwordHash, creditCard }, secret);
```

**The Fix:**

```typescript
// GOOD - Minimal identifying info only
jwt.sign({ id: user.id, email: user.email, role: user.role }, secret);
```