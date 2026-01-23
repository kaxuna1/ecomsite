# Node.js Patterns Reference

## Contents
- Async/Await Patterns
- Event Loop Management
- Buffer and Crypto
- File System Operations
- Process and Environment

---

## Async/Await Patterns

### Parallel Operations with Promise.all

```typescript
// GOOD - Parallel execution
const [products, orders, users] = await Promise.all([
  productService.list(),
  orderService.list(),
  userService.list()
]);

// BAD - Sequential when not needed
const products = await productService.list();
const orders = await orderService.list();   // Waits for products!
const users = await userService.list();     // Waits for orders!
```

### Sequential Operations with Dependencies

```typescript
// backend/src/services/orderService.ts:57-133
async create(payload: OrderPayload, userId?: number) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const orderResult = await client.query(
      `INSERT INTO orders (...) VALUES (...) RETURNING *`,
      [...]
    );
    const orderId = orderResult.rows[0].id;
    
    // Process items sequentially - each depends on order
    for (const item of payload.items) {
      const productResult = await client.query(
        'SELECT id, name, price, inventory FROM products WHERE id = $1',
        [item.productId]
      );
      
      if (productResult.rows.length === 0) {
        throw new Error(`Product ${item.productId} not found`);
      }
      
      await client.query(
        'INSERT INTO order_items (...) VALUES (...)',
        [orderId, ...]
      );
    }
    
    await client.query('COMMIT');
    return mapOrder(orderResult.rows[0], items);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
```

### WARNING: Unhandled Promise Rejections

**The Problem:**

```typescript
// BAD - Fire and forget with no error handling
processEmailQueue().catch(err => console.error(err));

// Worse - No catch at all
processEmailQueue();
```

**Why This Breaks:**
1. Unhandled rejections crash Node.js in production
2. Errors are swallowed silently
3. No way to track or retry failed operations

**The Fix:**

```typescript
// GOOD - Proper async error handling
processEmailQueue().catch(err => {
  console.error('Email queue processing error:', err);
  // Log to monitoring service
  // Don't crash - queue will retry
});

// Or use setInterval for recurring tasks
setInterval(() => {
  processEmailQueue().catch(err =>
    console.error('Email queue processing error:', err)
  );
}, 30000);
```

---

## Event Loop Management

### Long-Running Operations

```typescript
// BAD - Blocks event loop
const result = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512');

// GOOD - Use async version
const result = await new Promise<Buffer>((resolve, reject) => {
  crypto.pbkdf2(password, salt, 100000, 64, 'sha512', (err, key) => {
    if (err) reject(err);
    else resolve(key);
  });
});
```

### Pool Error Handling

```typescript
// backend/src/db/client.ts:18-21
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);  // Restart process on pool failures
});
```

---

## Buffer and Crypto

### Secure Encryption Pattern

```typescript
// backend/src/utils/encryption.ts
import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 64;

export function encrypt(text: string): string {
  const salt = crypto.randomBytes(SALT_LENGTH);
  const iv = crypto.randomBytes(IV_LENGTH);
  const key = crypto.pbkdf2Sync(masterKey, salt, 100000, 32, 'sha512');
  
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const tag = cipher.getAuthTag();
  
  return [
    salt.toString('hex'),
    iv.toString('hex'),
    tag.toString('hex'),
    encrypted
  ].join(':');
}
```

### Secure Random Generation

```typescript
// Generate secure random key
export function generateSecureKey(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

// Generate unique ID
const emailId = `email_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
```

---

## File System Operations

### Path Resolution with ESM

```typescript
// backend/src/services/productService.ts:1-13
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadDir = path.resolve(__dirname, '../../uploads');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
```

### File Cleanup Pattern

```typescript
// Delete old file when updating
if (imagePath && current.imageUrl?.startsWith('/uploads/')) {
  const toDelete = path.join(uploadDir, path.basename(current.imageUrl));
  if (fs.existsSync(toDelete)) {
    fs.unlinkSync(toDelete);
  }
}
```

---

## Process and Environment

### Environment Variable Validation

```typescript
// backend/src/config/env.ts
const required = (value: string | undefined, fallback?: string) => {
  if (value) return value;
  if (fallback !== undefined) return fallback;
  throw new Error('Missing required environment variable');
};

export const env = {
  jwtSecret: required(process.env.JWT_SECRET, 'dev-only-secret'),
  // Optional with default
  nodeEnv: process.env.NODE_ENV ?? 'development',
  // Optional number
  smtpPort: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined,
};
```

### Graceful Shutdown

```typescript
// Not implemented in project - add for production
process.on('SIGTERM', async () => {
  console.log('Received SIGTERM, shutting down...');
  await pool.end();
  process.exit(0);
});