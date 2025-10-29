---
name: express-postgres-api
description: Express.js + TypeScript + PostgreSQL API development with RESTful patterns, error handling, validation, and database best practices. Use when building REST APIs with Node.js and PostgreSQL, creating CRUD endpoints, implementing authentication, or adding new features to existing Express applications.
---

# Express PostgreSQL API Development

## Overview

This skill provides guidance, templates, and tools for building production-ready Express.js APIs with TypeScript and PostgreSQL. It includes a complete project template with layered architecture, authentication, validation, database best practices, and utility scripts for generating endpoints and migrations.

## When to Use This Skill

Use this skill when:
- Building a new REST API from scratch with Express.js and PostgreSQL
- Adding new CRUD endpoints to an existing Express API
- Implementing JWT authentication and authorization
- Creating database migrations or modifying schema
- Refactoring Express APIs to follow best practices
- Setting up proper error handling, validation, and security

## Quick Start

### Building a New API from Scratch

To create a complete Express + PostgreSQL API project:

1. **Copy the project template** from `assets/express-postgres-template/` to the desired location
2. **Review the template structure**:
   - `src/config/` - Database connection and environment configuration
   - `src/models/` - TypeScript interfaces and Zod validation schemas
   - `src/repositories/` - Database access layer (SQL queries)
   - `src/services/` - Business logic
   - `src/controllers/` - Request handlers
   - `src/routes/` - API route definitions
   - `src/middleware/` - Authentication, validation, error handling
   - `src/utils/` - Helper utilities (errors, response, logger)
   - `migrations/` - Database migration files

3. **Customize the template**:
   - Update `package.json` with project name and details
   - Modify `.env.example` and create `.env` with actual credentials
   - Review the example User model/repository/service/controller/routes
   - Run database migrations to create tables

4. **Install and run**:
   ```bash
   npm install
   docker-compose up -d  # Start PostgreSQL
   npm run migrate:up    # Run migrations
   npm run dev           # Start development server
   ```

### Adding New Endpoints to Existing API

To generate a complete CRUD endpoint (model, repository, service, controller, routes, migration):

1. **Use the endpoint generator script** from `scripts/generate_endpoint.py`:
   ```bash
   python scripts/generate_endpoint.py product \
     --fields name:string price:number description:text inStock:boolean \
     --output /path/to/project
   ```

2. **The script generates**:
   - `src/models/product.model.ts` - TypeScript interface and Zod schemas
   - `src/repositories/product.repository.ts` - Database queries
   - `src/services/product.service.ts` - Business logic
   - `src/controllers/product.controller.ts` - Request handlers
   - `src/routes/product.routes.ts` - Express routes
   - `migrations/TIMESTAMP_create_products_table.sql` - Database migration

3. **Import the routes** in `src/routes/index.ts`:
   ```typescript
   import productRoutes from './product.routes';
   router.use('/products', productRoutes);
   ```

4. **Run the migration**:
   ```bash
   npm run migrate:up
   ```

### Creating Database Migrations

To create a new database migration:

1. **Use the migration generator script** from `scripts/generate_migration.py`:
   ```bash
   python scripts/generate_migration.py add_status_to_users \
     --output /path/to/project/migrations
   ```

2. **Edit the generated migration file** to add SQL:
   ```sql
   ALTER TABLE users ADD COLUMN status VARCHAR(50) DEFAULT 'active';
   CREATE INDEX idx_users_status ON users(status);
   ```

3. **Run the migration**:
   ```bash
   npm run migrate:up
   ```

## Architecture Patterns

### Layered Architecture

Follow the layered architecture pattern for separation of concerns:

**Routes** → **Controllers** → **Services** → **Repositories** → **Database**

- **Routes**: Define HTTP endpoints and apply middleware
- **Controllers**: Handle HTTP requests/responses, call services
- **Services**: Contain business logic, orchestrate operations
- **Repositories**: Execute database queries, handle data access
- **Models**: Define TypeScript types and Zod validation schemas

Example flow:
```typescript
// Route
router.get('/:id', authenticate, validate(getUserSchema), userController.getById);

// Controller
async getById(req: Request, res: Response, next: NextFunction) {
  const id = parseInt(req.params.id);
  const user = await userService.getUserById(id);
  success(res, user, 'User retrieved successfully');
}

// Service
async getUserById(id: number): Promise<UserResponseDto> {
  const user = await userRepository.findById(id);
  if (!user) throw new NotFoundError('User not found');
  return toUserResponse(user);
}

// Repository
async findById(id: number): Promise<User | null> {
  const query = 'SELECT * FROM users WHERE id = $1';
  const result = await db.query<User>(query, [id]);
  return result.rows[0] || null;
}
```

### Request Validation

Use Zod schemas for type-safe validation:

```typescript
// Define schema in model
export const createUserSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    firstName: z.string().min(1, 'First name is required'),
  }),
});

// Apply in route
router.post('/', validate(createUserSchema), userController.create);
```

The validation middleware automatically validates request body, query, and params, returning 422 status with detailed errors if validation fails.

### Error Handling

Use custom error classes for consistent error responses:

```typescript
// Throw errors in services
throw new NotFoundError('User not found');
throw new BadRequestError('Invalid input');
throw new UnauthorizedError('Invalid credentials');
throw new ConflictError('Email already exists');
throw new ValidationError('Validation failed', errors);

// Errors are caught by centralized error handler
// Returns appropriate HTTP status code and error format
```

### Authentication & Authorization

Implement JWT-based authentication:

```typescript
// Protected route - requires valid JWT
router.get('/', authenticate, userController.getAll);

// Optional auth - token not required
router.get('/posts', optionalAuth, postController.getAll);

// Authorization - check resource ownership
router.delete('/posts/:id', authenticate, authorize('userId'), postController.delete);
```

Token flow:
1. User logs in with email/password
2. Service verifies credentials and generates JWT
3. Client includes token in Authorization header: `Bearer <token>`
4. Middleware verifies token and extracts userId
5. Controller accesses userId from req.userId

## Database Best Practices

### Parameterized Queries

**Always** use parameterized queries to prevent SQL injection. Consult `references/database_patterns.md` for comprehensive guidance.

```typescript
// ✅ CORRECT
await db.query('SELECT * FROM users WHERE email = $1', [email]);

// ❌ WRONG
await db.query(`SELECT * FROM users WHERE email = '${email}'`);
```

### Connection Pooling

The template includes properly configured connection pooling. Key settings:

- `min`: Minimum pool size (2 for dev, 5+ for production)
- `max`: Maximum pool size (10-20 for most apps)
- `idleTimeoutMillis`: Close idle connections (30 seconds)
- `connectionTimeoutMillis`: Connection timeout (2 seconds)

### Transactions

Use transactions for operations that must be atomic:

```typescript
await db.transaction(async (client) => {
  await client.query('UPDATE accounts SET balance = balance - $1 WHERE id = $2', [amount, fromId]);
  await client.query('UPDATE accounts SET balance = balance + $1 WHERE id = $2', [amount, toId]);
  await client.query('INSERT INTO transactions (...) VALUES (...)', [fromId, toId, amount]);
  // Automatically commits if all succeed, rolls back if any fail
});
```

### Indexing

Create indexes on frequently queried columns. See `references/database_patterns.md` for indexing strategies:

```sql
-- Single column index
CREATE INDEX idx_users_email ON users(email);

-- Composite index (order matters!)
CREATE INDEX idx_orders_user_created ON orders(user_id, created_at DESC);

-- Partial index
CREATE INDEX idx_active_users ON users(email) WHERE is_active = true;
```

## API Conventions

Follow RESTful conventions for consistent APIs. Consult `references/api_conventions.md` for detailed standards.

### URL Structure

```
✅ GOOD
GET    /api/v1/users              # List users
GET    /api/v1/users/123          # Get user by ID
POST   /api/v1/users              # Create user
PUT    /api/v1/users/123          # Update user
DELETE /api/v1/users/123          # Delete user
GET    /api/v1/users?page=1&limit=10&status=active  # Filtering/pagination

❌ BAD
GET    /api/v1/getUsers           # Don't use verbs
POST   /api/v1/user               # Use plural nouns
```

### HTTP Status Codes

- `200 OK` - Successful GET, PUT, PATCH, DELETE
- `201 Created` - Successful POST (resource created)
- `204 No Content` - Successful DELETE (no response body)
- `400 Bad Request` - Invalid request
- `401 Unauthorized` - Authentication required/failed
- `403 Forbidden` - Not authorized to access resource
- `404 Not Found` - Resource doesn't exist
- `409 Conflict` - Resource conflict (duplicate email)
- `422 Unprocessable Entity` - Validation errors
- `500 Internal Server Error` - Unexpected server error

### Response Format

Use consistent response structure:

```typescript
// Success
{
  "success": true,
  "data": { ... },
  "message": "User created successfully",
  "meta": { "page": 1, "total": 100 }  // For paginated responses
}

// Error
{
  "success": false,
  "error": {
    "message": "User not found"
  }
}

// Validation error
{
  "success": false,
  "error": {
    "message": "Validation failed",
    "details": [
      { "field": "email", "message": "Invalid email format" }
    ]
  }
}
```

Use the response utility functions:
```typescript
success(res, data, 'Message');           // 200 OK
created(res, data, 'Message');           // 201 Created
error(res, 'Message', statusCode);       // Error response
```

### Pagination

Implement pagination for list endpoints:

```typescript
GET /api/v1/users?page=1&limit=10

Response:
{
  "success": true,
  "data": [...],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  }
}
```

## Security Best Practices

Consult `references/security_checklist.md` for comprehensive security guidance.

### Essential Security Measures

1. **Environment Variables**: Store secrets in `.env`, never commit to git
2. **JWT Secrets**: Use strong, random strings (minimum 32 characters)
3. **Password Hashing**: Use bcrypt with appropriate salt rounds (10-12)
4. **Rate Limiting**: Protect against brute force attacks
5. **Security Headers**: Use Helmet.js for security headers
6. **Input Validation**: Validate all inputs with Zod
7. **SQL Injection**: Use parameterized queries exclusively
8. **CORS**: Configure restrictive CORS policy
9. **HTTPS**: Force HTTPS in production
10. **Dependencies**: Keep dependencies updated (`npm audit`)

### Pre-Production Checklist

Before deploying to production:
- [ ] Environment variables configured
- [ ] Strong JWT secrets set
- [ ] HTTPS enforced
- [ ] Rate limiting enabled
- [ ] Security headers configured
- [ ] CORS properly restricted
- [ ] Input validation on all endpoints
- [ ] Error messages don't leak sensitive info
- [ ] Dependencies updated (`npm audit fix`)
- [ ] Database uses least privilege access

## Reference Documentation

The skill includes detailed reference files for deeper guidance:

- **`references/database_patterns.md`**: PostgreSQL best practices, connection pooling, transactions, indexing strategies, query optimization, performance monitoring
- **`references/api_conventions.md`**: RESTful standards, HTTP methods and status codes, URL structure, response formats, pagination, filtering, authentication patterns
- **`references/security_checklist.md`**: Authentication/authorization, input validation, XSS/CSRF protection, rate limiting, security headers, file uploads, production checklist

**When to consult references:**
- When implementing complex database operations (consult `database_patterns.md`)
- When designing API endpoints (consult `api_conventions.md`)
- When hardening security (consult `security_checklist.md`)
- When encountering performance issues (consult `database_patterns.md`)

## Common Workflows

### Adding Authentication to Existing Resource

1. Import auth middleware in routes file
2. Apply `authenticate` middleware to protected routes:
   ```typescript
   router.get('/', authenticate, controller.getAll);
   ```
3. Access `req.userId` in controller/service for user-specific operations

### Implementing Resource Authorization

1. Create authorization check in service:
   ```typescript
   if (resource.userId !== req.userId) {
     throw new ForbiddenError('Access denied');
   }
   ```
2. Or use authorization middleware in routes:
   ```typescript
   router.delete('/:id', authenticate, authorize('userId'), controller.delete);
   ```

### Adding Complex Validation

1. Define Zod schema in model:
   ```typescript
   export const createOrderSchema = z.object({
     body: z.object({
       items: z.array(z.object({
         productId: z.number(),
         quantity: z.number().min(1),
       })).min(1),
       totalAmount: z.number().positive(),
     }),
   });
   ```
2. Apply in route:
   ```typescript
   router.post('/', authenticate, validate(createOrderSchema), controller.create);
   ```

### Implementing Transactions

1. Use `db.transaction()` in repository or service:
   ```typescript
   return await db.transaction(async (client) => {
     const order = await client.query('INSERT INTO orders ...');
     await client.query('INSERT INTO order_items ...');
     await client.query('UPDATE products SET stock = stock - $1 ...');
     return order;
   });
   ```

## Extending the Template

### Adding New Dependencies

1. Install the package:
   ```bash
   npm install <package-name>
   npm install --save-dev @types/<package-name>
   ```
2. Configure in appropriate config file
3. Update documentation

### Adding New Middleware

1. Create middleware in `src/middleware/`
2. Export from middleware file
3. Apply in routes or app.ts:
   ```typescript
   router.use(newMiddleware);
   ```

### Adding Background Jobs

1. Install bull or similar:
   ```bash
   npm install bull @types/bull
   ```
2. Create queue configuration in `src/config/`
3. Create job processors in `src/jobs/`
4. Add jobs to queue from services

## Troubleshooting

### Database Connection Issues
- Verify PostgreSQL is running: `docker ps` or `pg_isready`
- Check credentials in `.env`
- Test connection: `psql -h localhost -U postgres -d myapp_dev`

### Migration Errors
- Check migration SQL syntax
- Verify migration hasn't already been run
- Review migration table: `SELECT * FROM pgmigrations;`

### Authentication Issues
- Verify JWT_SECRET is set and matches between environments
- Check token expiration
- Verify Authorization header format: `Bearer <token>`

### Validation Errors
- Check Zod schema matches request data
- Review error details in 422 response
- Ensure field names match (camelCase in JSON, snake_case in DB)
