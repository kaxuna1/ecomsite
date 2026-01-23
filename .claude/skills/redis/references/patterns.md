# Redis Patterns Reference

## Contents
- Caching Patterns
- Rate Limiting
- Session Management
- Distributed Locks
- Anti-Patterns

---

## Caching Patterns

### Cache-Aside (Lazy Loading)

```typescript
// src/services/cachedProductService.ts
import { redis } from '../config/redis';
import { productService } from './productService';

const CACHE_TTL = 300; // 5 minutes

export async function getCachedProducts(lang: string): Promise<Product[]> {
  const cacheKey = `products:list:${lang}`;
  
  // Check cache first
  const cached = await redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }
  
  // Cache miss: fetch from database
  const products = await productService.getAll(lang);
  
  // Store in cache (don't await - fire and forget)
  redis.setex(cacheKey, CACHE_TTL, JSON.stringify(products)).catch(console.error);
  
  return products;
}
```

### Write-Through Cache

```typescript
export async function updateProduct(id: number, data: ProductUpdate): Promise<Product> {
  // Update database
  const product = await productService.update(id, data);
  
  // Immediately update cache
  await redis.setex(`product:${id}`, CACHE_TTL, JSON.stringify(product));
  
  // Invalidate list caches
  await invalidateProductListCaches();
  
  return product;
}

async function invalidateProductListCaches(): Promise<void> {
  const keys = await redis.keys('products:list:*');
  if (keys.length > 0) {
    await redis.del(...keys);
  }
}
```

### WARNING: Unbounded Key Patterns

**The Problem:**

```typescript
// BAD - Creates unlimited cache keys
async function cacheSearch(query: string, results: Product[]) {
  await redis.setex(`search:${query}`, 300, JSON.stringify(results));
}
```

**Why This Breaks:**
1. Memory grows unbounded with unique search queries
2. No eviction policy means Redis OOM crashes
3. Attackers can exhaust memory with varied queries

**The Fix:**

```typescript
// GOOD - Use hash or bounded LRU
async function cacheSearch(query: string, results: Product[]) {
  const hash = createHash('sha256').update(query).digest('hex').slice(0, 16);
  await redis.setex(`search:${hash}`, 300, JSON.stringify(results));
}

// Or use Redis LRU with maxmemory-policy
// redis.conf: maxmemory-policy allkeys-lru
```

---

## Rate Limiting

### Sliding Window Rate Limiter

```typescript
// src/middleware/slidingWindowRateLimiter.ts
import { redis } from '../config/redis';

export function createSlidingWindowLimiter(
  maxRequests: number,
  windowSec: number
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const key = `ratelimit:${req.path}:${req.ip}`;
    const now = Date.now();
    const windowStart = now - windowSec * 1000;
    
    // Remove old entries
    await redis.zremrangebyscore(key, 0, windowStart);
    
    // Count current window
    const count = await redis.zcard(key);
    
    if (count >= maxRequests) {
      return res.status(429).json({ message: 'Rate limit exceeded' });
    }
    
    // Add current request
    await redis.zadd(key, now, `${now}`);
    await redis.expire(key, windowSec);
    
    res.setHeader('X-RateLimit-Remaining', maxRequests - count - 1);
    next();
  };
}
```

### Token Bucket for AI Features

Replace in-memory rate limiter in `rateLimiter.ts`:

```typescript
// src/middleware/aiRateLimiter.ts
import { redis } from '../config/redis';

export async function checkAIRateLimit(
  userId: number,
  feature: string,
  limit: number = 20
): Promise<{ allowed: boolean; remaining: number; resetIn: number }> {
  const key = `ai:ratelimit:${feature}:${userId}`;
  const windowMs = 60 * 60 * 1000; // 1 hour
  
  const multi = redis.multi();
  multi.incr(key);
  multi.pttl(key);
  
  const [[, count], [, ttl]] = await multi.exec() as [[null, number], [null, number]];
  
  if (count === 1) {
    await redis.pexpire(key, windowMs);
  }
  
  return {
    allowed: count <= limit,
    remaining: Math.max(0, limit - count),
    resetIn: ttl > 0 ? ttl : windowMs,
  };
}
```

---

## Session Management

### JWT Token Blacklist

```typescript
// src/services/tokenBlacklistService.ts
import { redis } from '../config/redis';

const BLACKLIST_PREFIX = 'jwt:blacklist:';

export async function blacklistToken(token: string, expiresIn: number): Promise<void> {
  const key = `${BLACKLIST_PREFIX}${token}`;
  await redis.setex(key, expiresIn, '1');
}

export async function isTokenBlacklisted(token: string): Promise<boolean> {
  const key = `${BLACKLIST_PREFIX}${token}`;
  const result = await redis.get(key);
  return result === '1';
}
```

### WARNING: Storing Full Sessions in Redis

**The Problem:**

```typescript
// BAD - Large session objects
await redis.set(`session:${userId}`, JSON.stringify({
  user: fullUserObject,
  cart: entireCartWithProducts,
  preferences: allPreferences,
}));
```

**Why This Breaks:**
1. Large payloads slow Redis operations
2. Serialization/deserialization overhead
3. Memory waste for rarely-accessed data

**The Fix:**

```typescript
// GOOD - Store references, not data
await redis.hset(`session:${userId}`, {
  'userId': userId,
  'cartId': cart.id,
  'lastActivity': Date.now(),
});

// Fetch full data only when needed
const cartId = await redis.hget(`session:${userId}`, 'cartId');
const cart = await cartService.getById(cartId);
```

---

## Distributed Locks

### Order Processing Lock

Prevent double-processing of orders across instances:

```typescript
// src/utils/redisLock.ts
import { redis } from '../config/redis';

export async function acquireLock(
  resource: string,
  ttlMs: number = 10000
): Promise<string | null> {
  const lockKey = `lock:${resource}`;
  const lockValue = `${Date.now()}-${Math.random()}`;
  
  const acquired = await redis.set(lockKey, lockValue, 'PX', ttlMs, 'NX');
  return acquired === 'OK' ? lockValue : null;
}

export async function releaseLock(resource: string, lockValue: string): Promise<boolean> {
  const lockKey = `lock:${resource}`;
  
  // Lua script for atomic check-and-delete
  const script = `
    if redis.call("get", KEYS[1]) == ARGV[1] then
      return redis.call("del", KEYS[1])
    else
      return 0
    end
  `;
  
  const result = await redis.eval(script, 1, lockKey, lockValue);
  return result === 1;
}
```

### Usage in Order Service

```typescript
async function processOrder(orderId: number): Promise<void> {
  const lockValue = await acquireLock(`order:${orderId}`, 30000);
  
  if (!lockValue) {
    throw new Error('Order is being processed by another instance');
  }
  
  try {
    await orderService.process(orderId);
  } finally {
    await releaseLock(`order:${orderId}`, lockValue);
  }
}
```

---

## Anti-Patterns

### WARNING: Blocking Operations in Event Loop

**The Problem:**

```typescript
// BAD - KEYS blocks Redis for all clients
const allProducts = await redis.keys('product:*');
```

**Why This Breaks:**
1. KEYS scans entire keyspace synchronously
2. Blocks Redis server during scan
3. Production databases with millions of keys freeze

**The Fix:**

```typescript
// GOOD - Use SCAN for iteration
async function* scanKeys(pattern: string): AsyncGenerator<string> {
  let cursor = '0';
  do {
    const [nextCursor, keys] = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
    cursor = nextCursor;
    for (const key of keys) {
      yield key;
    }
  } while (cursor !== '0');
}

// Usage
for await (const key of scanKeys('product:*')) {
  await redis.del(key);
}
```

### WARNING: Missing Connection Error Handling

**The Problem:**

```typescript
// BAD - No error handling
const redis = new Redis();
const data = await redis.get('key'); // Throws if disconnected
```

**The Fix:**

```typescript
// GOOD - Graceful degradation
async function getCached<T>(key: string): Promise<T | null> {
  try {
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Redis error, falling back to database:', error);
    return null; // Let caller fetch from database
  }
}
```