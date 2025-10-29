# PostgreSQL Database Patterns and Best Practices

## Connection Pooling

Always use connection pooling for production applications:

```typescript
const pool = new Pool({
  host: env.DB_HOST,
  port: env.DB_PORT,
  database: env.DB_NAME,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  min: 2,                    // Minimum pool size
  max: 10,                   // Maximum pool size
  idleTimeoutMillis: 30000,  // Close idle connections after 30s
  connectionTimeoutMillis: 2000, // Timeout for new connections
});
```

**Pool Size Guidelines:**
- Development: 2-5 connections
- Production (small): 10-20 connections
- Production (large): 50-100 connections
- Formula: `connections = ((core_count * 2) + effective_spindle_count)`

## Parameterized Queries (SQL Injection Prevention)

**ALWAYS** use parameterized queries. Never concatenate user input into SQL:

```typescript
// ✅ CORRECT - Parameterized query
const result = await db.query(
  'SELECT * FROM users WHERE email = $1',
  [userEmail]
);

// ❌ WRONG - SQL injection vulnerability
const result = await db.query(
  `SELECT * FROM users WHERE email = '${userEmail}'`
);
```

## Transaction Management

Use transactions for operations that must be atomic:

```typescript
async function transferFunds(fromUserId: number, toUserId: number, amount: number) {
  return await db.transaction(async (client) => {
    // Debit from sender
    await client.query(
      'UPDATE accounts SET balance = balance - $1 WHERE user_id = $2',
      [amount, fromUserId]
    );

    // Credit to receiver
    await client.query(
      'UPDATE accounts SET balance = balance + $1 WHERE user_id = $2',
      [amount, toUserId]
    );

    // Record transaction
    await client.query(
      'INSERT INTO transactions (from_user, to_user, amount) VALUES ($1, $2, $3)',
      [fromUserId, toUserId, amount]
    );

    // If any query fails, entire transaction rolls back automatically
  });
}
```

### Transaction Isolation Levels

```typescript
await client.query('BEGIN ISOLATION LEVEL READ COMMITTED');
await client.query('BEGIN ISOLATION LEVEL REPEATABLE READ');
await client.query('BEGIN ISOLATION LEVEL SERIALIZABLE');
```

**When to use:**
- `READ COMMITTED` (default): Most cases
- `REPEATABLE READ`: When you need consistent reads within transaction
- `SERIALIZABLE`: Banking/financial operations requiring strict consistency

## Indexing Strategy

### When to Create Indexes

Create indexes on:
- Primary keys (automatic)
- Foreign keys
- Columns frequently used in WHERE clauses
- Columns used in JOIN conditions
- Columns used in ORDER BY or GROUP BY

```sql
-- Single column index
CREATE INDEX idx_users_email ON users(email);

-- Composite index (order matters!)
CREATE INDEX idx_orders_user_created ON orders(user_id, created_at DESC);

-- Partial index (for specific conditions)
CREATE INDEX idx_active_users ON users(email) WHERE is_active = true;

-- Unique index
CREATE UNIQUE INDEX idx_users_email_unique ON users(email);
```

### Index Performance Tips

1. **Index order in composite indexes matters:**
   ```sql
   -- ✅ Good for: WHERE user_id = X ORDER BY created_at
   CREATE INDEX idx_orders_user_created ON orders(user_id, created_at DESC);

   -- ❌ Bad: Won't be used efficiently for the above query
   CREATE INDEX idx_orders_created_user ON orders(created_at DESC, user_id);
   ```

2. **Don't over-index:**
   - Each index slows down INSERT/UPDATE/DELETE
   - Aim for 3-5 indexes per table (excluding primary key)

3. **Use EXPLAIN ANALYZE:**
   ```sql
   EXPLAIN ANALYZE SELECT * FROM users WHERE email = 'test@example.com';
   ```

## Query Optimization

### Use LIMIT and OFFSET for Pagination

```typescript
// Basic pagination
async function getUsers(page: number, limit: number) {
  const offset = (page - 1) * limit;

  const query = `
    SELECT * FROM users
    ORDER BY created_at DESC
    LIMIT $1 OFFSET $2
  `;

  return await db.query(query, [limit, offset]);
}
```

### Cursor-Based Pagination (Better for Large Datasets)

```typescript
async function getUsersAfter(cursor: number, limit: number) {
  const query = `
    SELECT * FROM users
    WHERE id > $1
    ORDER BY id ASC
    LIMIT $2
  `;

  return await db.query(query, [cursor, limit]);
}
```

### Avoid N+1 Queries

```typescript
// ❌ BAD - N+1 queries
async function getBadUserPosts() {
  const users = await db.query('SELECT * FROM users');

  for (const user of users.rows) {
    user.posts = await db.query('SELECT * FROM posts WHERE user_id = $1', [user.id]);
  }
}

// ✅ GOOD - Single query with JOIN
async function getGoodUserPosts() {
  const query = `
    SELECT
      u.*,
      json_agg(json_build_object(
        'id', p.id,
        'title', p.title,
        'content', p.content
      )) as posts
    FROM users u
    LEFT JOIN posts p ON p.user_id = u.id
    GROUP BY u.id
  `;

  return await db.query(query);
}
```

## Data Types

### Choose Appropriate Types

```sql
-- ✅ Optimized types
CREATE TABLE products (
  id SERIAL PRIMARY KEY,           -- Auto-incrementing integer
  name VARCHAR(255) NOT NULL,      -- Limited string
  description TEXT,                 -- Unlimited string
  price DECIMAL(10, 2) NOT NULL,   -- Monetary value (never use FLOAT!)
  quantity INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT true,
  tags TEXT[],                      -- Array
  metadata JSONB,                   -- JSON data (JSONB is faster than JSON)
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### JSONB vs JSON

Always use `JSONB` instead of `JSON`:
- `JSONB` is binary format (faster)
- Supports indexing
- Removes duplicate keys automatically

```sql
-- Create JSONB column with GIN index for fast queries
CREATE TABLE events (
  id SERIAL PRIMARY KEY,
  data JSONB NOT NULL
);

CREATE INDEX idx_events_data ON events USING GIN (data);

-- Query JSONB efficiently
SELECT * FROM events WHERE data @> '{"type": "purchase"}';
SELECT * FROM events WHERE data->>'user_id' = '123';
```

## Naming Conventions

```sql
-- Tables: plural, snake_case
CREATE TABLE user_profiles (...);

-- Columns: snake_case
CREATE TABLE users (
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  created_at TIMESTAMP
);

-- Indexes: idx_{table}_{columns}
CREATE INDEX idx_users_email ON users(email);

-- Foreign keys: {table}_id
CREATE TABLE orders (
  user_id INTEGER REFERENCES users(id)
);

-- Constraints: {table}_{column}_{type}
ALTER TABLE users ADD CONSTRAINT users_email_unique UNIQUE (email);
```

## Common Patterns

### Soft Delete

```sql
ALTER TABLE users ADD COLUMN deleted_at TIMESTAMP;

-- Create partial index for active records
CREATE INDEX idx_users_active ON users(id) WHERE deleted_at IS NULL;

-- Query active records
SELECT * FROM users WHERE deleted_at IS NULL;
```

### Timestamps

```sql
-- Add timestamp columns
ALTER TABLE users
  ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### Optimistic Locking (Version Control)

```sql
CREATE TABLE documents (
  id SERIAL PRIMARY KEY,
  content TEXT,
  version INTEGER DEFAULT 1
);

-- Update with version check
UPDATE documents
SET content = $1, version = version + 1
WHERE id = $2 AND version = $3;
```

## Performance Monitoring

### Essential Queries

```sql
-- Find slow queries
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;

-- Find missing indexes
SELECT
  schemaname,
  tablename,
  seq_scan,
  seq_tup_read,
  idx_scan,
  idx_tup_fetch
FROM pg_stat_user_tables
WHERE seq_scan > 0
ORDER BY seq_tup_read DESC
LIMIT 10;

-- Check table sizes
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

## Migration Best Practices

1. **Always include rollback SQL** in migration comments
2. **Use IF EXISTS/IF NOT EXISTS** to make migrations idempotent
3. **Add indexes concurrently** in production:
   ```sql
   CREATE INDEX CONCURRENTLY idx_users_email ON users(email);
   ```
4. **Test migrations on staging** before production
5. **Backup before running migrations** in production

## Security

1. **Never store passwords in plain text** - use bcrypt
2. **Use SSL/TLS** for database connections in production
3. **Limit database user permissions** - principle of least privilege
4. **Enable query logging** for audit trails
5. **Use environment variables** for credentials
