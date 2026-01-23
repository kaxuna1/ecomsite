# Node.js Error Handling Reference

## Contents
- Error Types and Patterns
- Database Error Handling
- Async Error Patterns
- Process-Level Errors

---

## Error Types and Patterns

### Custom Error Classes

```typescript
// Define custom errors for different scenarios
class NotFoundError extends Error {
  constructor(resource: string, id: number | string) {
    super(`${resource} with id ${id} not found`);
    this.name = 'NotFoundError';
  }
}

class ValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

// Usage in service
async get(id: number) {
  const result = await pool.query('SELECT * FROM products WHERE id = $1', [id]);
  if (!result.rows[0]) {
    throw new NotFoundError('Product', id);
  }
  return mapProduct(result.rows[0]);
}
```

### Error Response Pattern

```typescript
// Express error handler middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  
  if (err.name === 'NotFoundError') {
    return res.status(404).json({ message: err.message });
  }
  
  if (err.name === 'ValidationError') {
    return res.status(400).json({ message: err.message });
  }
  
  // Don't expose internal errors
  res.status(500).json({ message: 'Internal server error' });
});
```

---

## Database Error Handling

### Transaction Rollback Pattern

```typescript
// backend/src/services/orderService.ts:57-134
const client = await pool.connect();
try {
  await client.query('BEGIN');
  
  // Validate before insert
  const productResult = await client.query(
    'SELECT inventory FROM products WHERE id = $1',
    [item.productId]
  );
  
  if (productResult.rows.length === 0) {
    throw new Error(`Product ${item.productId} not found`);
  }
  
  if (productResult.rows[0].inventory < item.quantity) {
    throw new Error(`Insufficient inventory for product ${item.productId}`);
  }
  
  await client.query('INSERT...', [...]);
  await client.query('COMMIT');
  
} catch (error) {
  await client.query('ROLLBACK');
  throw error;  // Re-throw for route handler
} finally {
  client.release();  // Always release client!
}
```

### Pool Error Handler

```typescript
// backend/src/db/client.ts:18-21
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);  // Let process manager restart
});
```

---

## Async Error Patterns

### Route Handler Wrapper

```typescript
// Wrap async handlers to catch errors
const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Usage
router.get('/:id', asyncHandler(async (req, res) => {
  const product = await productService.get(parseInt(req.params.id));
  if (!product) {
    return res.status(404).json({ message: 'Product not found' });
  }
  res.json(product);
}));
```

### Email Queue Error Handling

```typescript
// backend/src/services/emailService.ts:121-198
async function processEmail(email: QueuedEmail) {
  email.status = 'sending';
  email.attempts++;

  try {
    await emailProvider.send(email);
    email.status = 'sent';
    email.sentAt = new Date();
    
  } catch (error: any) {
    console.error(`Email sending failed: ${email.id}`, error);

    if (email.attempts >= email.maxAttempts) {
      email.status = 'failed';
      email.error = error.message;
    } else {
      // Exponential backoff retry
      const retryDelay = Math.pow(2, email.attempts) * 60 * 1000;
      email.nextRetryAt = new Date(Date.now() + retryDelay);
      email.status = 'pending';
    }
  }
}
```

---

## Process-Level Errors

### Uncaught Exception Handler

```typescript
// Add to server.ts for production
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  // Log to monitoring service
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Log but don't exit - may be recoverable
});
```

### Graceful Shutdown

```typescript
const server = app.listen(env.port);

process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(async () => {
    await pool.end();
    console.log('Pool closed');
    process.exit(0);
  });
  
  // Force shutdown after 10s
  setTimeout(() => {
    console.error('Forced shutdown');
    process.exit(1);
  }, 10000);
});
```

---

## WARNING: Silent Failures

**The Problem:**

```typescript
// BAD - Error swallowed, continues silently
try {
  await sendNotification(order);
} catch (error) {
  // Empty catch block!
}

// BAD - Only logs, no recovery
try {
  await processPayment(order);
} catch (error) {
  console.log(error);  // Order marked complete anyway!
}
```

**Why This Breaks:**
1. Failures are invisible
2. Data integrity issues
3. Users not notified of problems

**The Fix:**

```typescript
// GOOD - Log and handle appropriately
try {
  await sendNotification(order);
} catch (error) {
  console.error('Notification failed:', error);
  // Queue for retry or mark order needs attention
  await markOrderNeedsFollowup(order.id);
}

// GOOD - Re-throw for critical operations
try {
  await processPayment(order);
} catch (error) {
  console.error('Payment failed:', error);
  throw error;  // Let caller handle
}
```

---

## Error Logging Best Practices

```typescript
// Include context in error logs
console.error('Order creation failed', {
  orderId: orderId,
  userId: userId,
  error: error.message,
  stack: error.stack
});

// Use structured logging for production
import pino from 'pino';
const logger = pino();

logger.error({
  err: error,
  orderId,
  userId,
  operation: 'createOrder'
}, 'Order creation failed');
```

For Express middleware error handling, see the **express** skill.