# Redis Workflows Reference

## Contents
- Installation & Setup
- Bull Queue Integration
- Cache Manager Migration
- Monitoring & Debugging
- Docker Configuration

---

## Installation & Setup

### Step 1: Install Dependencies

```bash
cd backend
npm install ioredis bullmq
npm install -D @types/ioredis
```

### Step 2: Environment Configuration

```bash
# Add to backend/.env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
```

### Step 3: Create Redis Client

```typescript
// src/config/redis.ts
import Redis from 'ioredis';

const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD || undefined,
  db: parseInt(process.env.REDIS_DB || '0'),
  maxRetriesPerRequest: 3,
  retryDelayOnFailover: 100,
  enableReadyCheck: true,
  lazyConnect: true,
};

export const redis = new Redis(redisConfig);

// Separate connection for pub/sub (required by ioredis)
export const redisSub = new Redis(redisConfig);

redis.on('error', (err) => console.error('Redis Client Error:', err));
redis.on('connect', () => console.log('Redis Client Connected'));

export async function initRedis(): Promise<void> {
  await redis.connect();
}

export async function closeRedis(): Promise<void> {
  await redis.quit();
  await redisSub.quit();
}
```

### Step 4: Initialize in Server

```typescript
// src/server.ts
import { initRedis, closeRedis } from './config/redis';

async function startServer() {
  try {
    await initRedis();
    console.log('Redis initialized');
    
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

process.on('SIGTERM', async () => {
  await closeRedis();
  process.exit(0);
});
```

Copy this checklist and track progress:
- [ ] Install ioredis and bullmq packages
- [ ] Add REDIS_* environment variables
- [ ] Create src/config/redis.ts
- [ ] Update server.ts with Redis initialization
- [ ] Test connection with `redis-cli ping`

---

## Bull Queue Integration

### Email Queue Setup

Replace direct email sending with background jobs:

```typescript
// src/queues/emailQueue.ts
import { Queue, Worker } from 'bullmq';
import { redis } from '../config/redis';
import { emailService } from '../services/emailService';

export const emailQueue = new Queue('emails', {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 1000 },
    removeOnComplete: 100,
    removeOnFail: 50,
  },
});

// Worker to process email jobs
export const emailWorker = new Worker(
  'emails',
  async (job) => {
    const { to, subject, html, template, data } = job.data;
    
    if (template) {
      await emailService.sendTemplated(template, to, data);
    } else {
      await emailService.send({ to, subject, html });
    }
    
    return { sent: true, timestamp: Date.now() };
  },
  { connection: redis, concurrency: 5 }
);

emailWorker.on('completed', (job) => {
  console.log(`Email job ${job.id} completed`);
});

emailWorker.on('failed', (job, err) => {
  console.error(`Email job ${job?.id} failed:`, err);
});
```

### Queue Usage in Services

```typescript
// src/services/orderService.ts
import { emailQueue } from '../queues/emailQueue';

export async function createOrder(orderData: CreateOrderInput): Promise<Order> {
  const order = await db.query('INSERT INTO orders...');
  
  // Queue email instead of sending directly
  await emailQueue.add('order-confirmation', {
    template: 'order-confirmation',
    to: orderData.email,
    data: { orderId: order.id, items: order.items },
  });
  
  return order;
}
```

### Review Reminder Queue

```typescript
// src/queues/reviewReminderQueue.ts
import { Queue, Worker } from 'bullmq';
import { redis } from '../config/redis';

export const reviewReminderQueue = new Queue('review-reminders', {
  connection: redis,
});

// Schedule reminder 7 days after order fulfillment
export async function scheduleReviewReminder(orderId: number, email: string) {
  await reviewReminderQueue.add(
    'send-reminder',
    { orderId, email },
    { delay: 7 * 24 * 60 * 60 * 1000 } // 7 days
  );
}
```

---

## Cache Manager Migration

Migrate `CacheManager.ts` from in-memory to Redis:

```typescript
// src/ai/infrastructure/RedisCacheManager.ts
import { redis } from '../../config/redis';
import { createHash } from 'crypto';
import { GenerateTextParams, GenerateTextResponse } from '../types';

export class RedisCacheManager {
  private prefix: string;
  private defaultTTL: number;

  constructor(prefix: string = 'ai:cache', defaultTTL: number = 3600) {
    this.prefix = prefix;
    this.defaultTTL = defaultTTL;
  }

  generateCacheKey(params: GenerateTextParams, provider: string): string {
    const keyData = {
      provider,
      prompt: params.prompt,
      systemPrompt: params.systemPrompt || '',
      maxTokens: params.maxTokens,
      temperature: params.temperature,
    };
    
    const hash = createHash('sha256')
      .update(JSON.stringify(keyData))
      .digest('hex');
    
    return `${this.prefix}:${hash}`;
  }

  async get(key: string): Promise<GenerateTextResponse | null> {
    try {
      const data = await redis.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Redis cache get error:', error);
      return null;
    }
  }

  async set(key: string, response: GenerateTextResponse, ttl?: number): Promise<void> {
    try {
      const ttlSeconds = ttl || this.defaultTTL;
      await redis.setex(key, ttlSeconds, JSON.stringify(response));
    } catch (error) {
      console.error('Redis cache set error:', error);
    }
  }

  async delete(key: string): Promise<boolean> {
    const result = await redis.del(key);
    return result === 1;
  }

  async clear(): Promise<void> {
    const keys = await this.scanKeys(`${this.prefix}:*`);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  }

  private async scanKeys(pattern: string): Promise<string[]> {
    const keys: string[] = [];
    let cursor = '0';
    
    do {
      const [nextCursor, batch] = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
      cursor = nextCursor;
      keys.push(...batch);
    } while (cursor !== '0');
    
    return keys;
  }

  async getStats(): Promise<{ size: number }> {
    const keys = await this.scanKeys(`${this.prefix}:*`);
    return { size: keys.length };
  }
}
```

---

## Monitoring & Debugging

### Health Check Endpoint

```typescript
// src/routes/healthRoutes.ts
import { redis } from '../config/redis';

router.get('/health', async (req, res) => {
  const checks = {
    api: 'ok',
    database: 'unknown',
    redis: 'unknown',
  };
  
  try {
    await redis.ping();
    checks.redis = 'ok';
  } catch {
    checks.redis = 'error';
  }
  
  const allHealthy = Object.values(checks).every(v => v === 'ok');
  res.status(allHealthy ? 200 : 503).json(checks);
});
```

### Queue Dashboard (Optional)

```typescript
// src/routes/adminRoutes.ts
import { emailQueue, reviewReminderQueue } from '../queues';

router.get('/admin/queues', authMiddleware, async (req, res) => {
  const [emailCounts, reminderCounts] = await Promise.all([
    emailQueue.getJobCounts(),
    reviewReminderQueue.getJobCounts(),
  ]);
  
  res.json({
    emails: emailCounts,
    reviewReminders: reminderCounts,
  });
});
```

### Debug Commands

```bash
# Connect to Redis CLI
redis-cli

# Check memory usage
INFO memory

# List all keys (dev only!)
KEYS *

# Monitor real-time commands
MONITOR

# Check specific key TTL
TTL ai:cache:abc123

# Flush development database
FLUSHDB
```

---

## Docker Configuration

### Add Redis to docker-compose.yml

```yaml
# docker-compose.yml
services:
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
    command: redis-server --appendonly yes --maxmemory 256mb --maxmemory-policy allkeys-lru
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 3

  backend:
    depends_on:
      redis:
        condition: service_healthy
    environment:
      - REDIS_HOST=redis
      - REDIS_PORT=6379

volumes:
  redis-data:
```

### Dockerfile Update

```dockerfile
# Add to Dockerfile for production
ENV REDIS_HOST=redis
ENV REDIS_PORT=6379
```

Copy this checklist and track progress:
- [ ] Add redis service to docker-compose.yml
- [ ] Set maxmemory and eviction policy
- [ ] Add REDIS_HOST environment to backend service
- [ ] Enable persistence with appendonly
- [ ] Verify health check works
- [ ] Test connection from backend container

---

## Validation Loop

After setup, validate Redis integration:

1. Run `docker-compose up -d`
2. Verify: `docker-compose exec redis redis-cli ping` → PONG
3. Check backend logs for "Redis Client Connected"
4. If connection fails, check REDIS_HOST matches service name
5. Repeat steps 1-4 until connection succeeds

For queue validation:
1. Add a test job: `await emailQueue.add('test', { test: true })`
2. Check queue: `redis-cli LLEN bull:emails:wait`
3. If job not processed, check worker logs
4. Verify worker is running and connected