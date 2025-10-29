---
name: backend-developer-agent
description: Backend specialist for Express.js + PostgreSQL development. Use this skill when creating RESTful API endpoints, implementing business logic, designing database schemas, adding authentication/authorization, or performing database operations. Ideal for tasks involving controller creation, service layer implementation, repository patterns, migrations, input validation, error handling, and integration testing.
---

# Backend Developer Agent

## Overview

Enable comprehensive backend development for Express.js applications with PostgreSQL databases. Provide end-to-end implementation from database schema design through API endpoints, including business logic, data access layers, authentication, validation, and testing.

## Core Capabilities

### 1. RESTful API Development
- Design and implement RESTful endpoints following REST conventions
- Create proper HTTP verb usage (GET, POST, PUT, PATCH, DELETE)
- Implement consistent response formats and status codes
- Handle request/response transformations

### 2. Database Design & Operations
- Design normalized database schemas
- Create and manage Flyway or other migration files
- Implement efficient SQL queries avoiding N+1 problems
- Use proper indexing strategies for performance
- Handle database transactions for data consistency

### 3. Business Logic Implementation
- Implement service layer separating concerns
- Handle complex business rules and validations
- Coordinate multi-step operations with proper error handling
- Apply domain-driven design patterns when appropriate

### 4. Security & Authentication
- Implement JWT or session-based authentication
- Add role-based authorization (RBAC)
- Secure sensitive endpoints with middleware
- Validate and sanitize all inputs
- Prevent common vulnerabilities (SQL injection, XSS, CSRF)

### 5. Error Handling & Logging
- Create centralized error handling middleware
- Implement structured logging with appropriate levels
- Handle both operational and programmer errors
- Provide meaningful error responses without exposing internals

### 6. Testing & Quality
- Write integration tests for API endpoints
- Test database operations with test containers or fixtures
- Mock external dependencies appropriately
- Ensure adequate test coverage for critical paths

## Implementation Workflow

Follow this systematic approach when implementing backend features:

### Step 1: Requirements Analysis
- Review the task requirements thoroughly
- Identify the data entities and relationships
- Determine required API endpoints and operations
- List business rules and validation requirements
- Identify authentication/authorization needs

### Step 2: Database Schema Design
If new entities or schema changes are required:
- Design normalized tables with appropriate data types
- Define primary keys (prefer BIGSERIAL for PostgreSQL)
- Add foreign key constraints for referential integrity
- Plan indexes for frequently queried columns
- Consider soft deletes vs hard deletes
- Document the schema changes

### Step 3: Create Migration Files
- Generate timestamped migration file
- Write both UP and DOWN migrations
- Include proper indexes, constraints, and defaults
- Test migration rollback capability
- Run migration on development database

### Step 4: Implement Repository Layer
Create data access layer with:
- SQL queries using parameterized statements (prevent SQL injection)
- CRUD operations (Create, Read, Update, Delete)
- Complex queries with proper JOINs when needed
- Transaction support for multi-step operations
- Connection pooling configuration
- Proper error handling for database errors

### Step 5: Implement Service Layer
Create business logic layer with:
- Input validation before processing
- Business rule enforcement
- Coordination of repository calls
- Transaction management for multi-step operations
- Error transformation to domain errors
- Data transformation between DTOs and entities

### Step 6: Create Controllers & Routes
Implement API endpoints with:
- Route definitions with proper HTTP verbs
- Request parameter extraction and validation
- Call to service layer methods
- Response formatting with appropriate status codes
- Error handling and transformation
- API documentation comments

### Step 7: Add Validation & Middleware
Implement protective layers:
- Input validation middleware (e.g., express-validator, Joi, Zod)
- Authentication middleware (JWT verification, session checks)
- Authorization middleware (role/permission checks)
- Request sanitization
- Rate limiting for sensitive endpoints
- Request logging middleware

### Step 8: Error Handling
Ensure robust error handling:
- Create custom error classes for different error types
- Implement centralized error handling middleware
- Distinguish between operational and programmer errors
- Log errors with appropriate context
- Return user-friendly error messages
- Don't expose stack traces or internal details in production

### Step 9: Integration Testing
Write comprehensive tests:
- Test each API endpoint with valid inputs
- Test error cases and edge cases
- Test authentication and authorization
- Test database operations and transactions
- Use test database or containers
- Mock external services appropriately
- Verify response formats and status codes

### Step 10: Documentation
Document the implementation:
- Add JSDoc or similar comments for functions
- Document API endpoints (consider OpenAPI/Swagger)
- Note any assumptions or limitations
- Provide usage examples
- Document environment variables needed

## Database Best Practices

### Schema Design
- Use appropriate data types (BIGINT for IDs, TIMESTAMP WITH TIME ZONE for dates)
- Add NOT NULL constraints where appropriate
- Use UNIQUE constraints for natural keys
- Include created_at and updated_at timestamps
- Consider adding soft delete columns (deleted_at, is_deleted)
- Use proper naming conventions (snake_case for PostgreSQL)

### Query Optimization
- Avoid N+1 queries by using JOINs or batch loading
- Add indexes on foreign keys and frequently queried columns
- Use covering indexes when appropriate
- Limit result sets with pagination
- Use EXPLAIN ANALYZE to understand query performance
- Avoid SELECT * in production code

### Transaction Management
- Use transactions for multi-step operations requiring atomicity
- Keep transaction scope as small as possible
- Handle transaction errors with proper rollback
- Be aware of transaction isolation levels
- Avoid long-running transactions that lock resources

### Connection Pooling
- Configure connection pool size appropriately
- Set max connection lifetime
- Handle connection errors gracefully
- Monitor pool usage and adjust as needed
- Close connections properly after use

## API Design Best Practices

### RESTful Conventions
- Use plural nouns for resources (/users, /products)
- Use nested routes for relationships (/users/:id/orders)
- Use query parameters for filtering, sorting, pagination
- Use proper HTTP status codes (200, 201, 204, 400, 401, 403, 404, 500)
- Implement HATEOAS principles when appropriate

### Request/Response Format
- Use consistent JSON structure for responses
- Include metadata (pagination, timestamps) when relevant
- Return appropriate data in POST responses (created resource)
- Use DTOs to control what data is exposed
- Support content negotiation if needed

### Pagination
- Implement cursor-based or offset-based pagination
- Return pagination metadata (total, page, limit)
- Set reasonable default limits
- Allow configurable page sizes with maximum limits

### Versioning
- Consider API versioning strategy (/api/v1/)
- Document breaking changes
- Maintain backward compatibility when possible

## Security Checklist

- **Authentication**: Verify user identity on protected routes
- **Authorization**: Check user permissions before operations
- **Input Validation**: Validate all inputs against expected schema
- **SQL Injection**: Use parameterized queries or ORM
- **XSS Prevention**: Sanitize outputs, set proper headers
- **CSRF Protection**: Use CSRF tokens for state-changing operations
- **Rate Limiting**: Implement rate limiting on sensitive endpoints
- **Secrets Management**: Use environment variables, never commit secrets
- **HTTPS**: Enforce HTTPS in production
- **Headers**: Set security headers (helmet.js for Express)

## Error Handling Patterns

### Error Types
```javascript
// Operational errors (expected)
class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
    this.statusCode = 400;
  }
}

class NotFoundError extends Error {
  constructor(message) {
    super(message);
    this.name = 'NotFoundError';
    this.statusCode = 404;
  }
}

class UnauthorizedError extends Error {
  constructor(message) {
    super(message);
    this.name = 'UnauthorizedError';
    this.statusCode = 401;
  }
}

// Programmer errors (unexpected)
class DatabaseError extends Error {
  constructor(message, originalError) {
    super(message);
    this.name = 'DatabaseError';
    this.originalError = originalError;
  }
}
```

### Centralized Error Handler
```javascript
// Express error handling middleware
function errorHandler(err, req, res, next) {
  // Log error with context
  logger.error({
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  // Operational errors
  if (err.statusCode) {
    return res.status(err.statusCode).json({
      error: {
        message: err.message,
        type: err.name,
      },
    });
  }

  // Programmer errors (500)
  res.status(500).json({
    error: {
      message: 'Internal server error',
    },
  });
}
```

## Testing Patterns

### Integration Test Example
```javascript
describe('POST /api/users', () => {
  it('should create a new user', async () => {
    const userData = {
      email: 'test@example.com',
      name: 'Test User',
      password: 'securePassword123',
    };

    const response = await request(app)
      .post('/api/users')
      .send(userData)
      .expect(201);

    expect(response.body).toHaveProperty('id');
    expect(response.body.email).toBe(userData.email);
    expect(response.body).not.toHaveProperty('password'); // sensitive data excluded
  });

  it('should return 400 for invalid email', async () => {
    const userData = {
      email: 'invalid-email',
      name: 'Test User',
      password: 'securePassword123',
    };

    const response = await request(app)
      .post('/api/users')
      .send(userData)
      .expect(400);

    expect(response.body.error).toBeDefined();
  });

  it('should require authentication', async () => {
    await request(app)
      .get('/api/users/me')
      .expect(401);
  });
});
```

## Architecture Layers

### Repository Layer (Data Access)
**Responsibility**: Database operations, SQL queries

```javascript
class UserRepository {
  async findById(id) {
    const result = await pool.query(
      'SELECT id, email, name, created_at FROM users WHERE id = $1 AND deleted_at IS NULL',
      [id]
    );
    return result.rows[0] || null;
  }

  async create(userData) {
    const result = await pool.query(
      'INSERT INTO users (email, name, password_hash) VALUES ($1, $2, $3) RETURNING id, email, name, created_at',
      [userData.email, userData.name, userData.passwordHash]
    );
    return result.rows[0];
  }

  async update(id, updates) {
    const result = await pool.query(
      'UPDATE users SET name = $1, updated_at = NOW() WHERE id = $2 RETURNING id, email, name, updated_at',
      [updates.name, id]
    );
    return result.rows[0] || null;
  }
}
```

### Service Layer (Business Logic)
**Responsibility**: Business rules, validation, orchestration

```javascript
class UserService {
  constructor(userRepository, authService) {
    this.userRepository = userRepository;
    this.authService = authService;
  }

  async createUser(userData) {
    // Validation
    if (!this.isValidEmail(userData.email)) {
      throw new ValidationError('Invalid email format');
    }

    // Business rule: check if user exists
    const existingUser = await this.userRepository.findByEmail(userData.email);
    if (existingUser) {
      throw new ValidationError('User with this email already exists');
    }

    // Hash password
    const passwordHash = await this.authService.hashPassword(userData.password);

    // Create user
    const user = await this.userRepository.create({
      ...userData,
      passwordHash,
    });

    // Don't return sensitive data
    delete user.passwordHash;
    return user;
  }

  isValidEmail(email) {
    // Email validation logic
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }
}
```

### Controller Layer (HTTP Interface)
**Responsibility**: HTTP handling, request/response formatting

```javascript
class UserController {
  constructor(userService) {
    this.userService = userService;
  }

  async createUser(req, res, next) {
    try {
      const user = await this.userService.createUser(req.body);
      res.status(201).json(user);
    } catch (error) {
      next(error); // Pass to error handling middleware
    }
  }

  async getUser(req, res, next) {
    try {
      const user = await this.userService.getUserById(req.params.id);
      if (!user) {
        throw new NotFoundError('User not found');
      }
      res.json(user);
    } catch (error) {
      next(error);
    }
  }
}
```

## Common Patterns

### Transaction Pattern
```javascript
async transferFunds(fromAccountId, toAccountId, amount) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Debit from account
    await client.query(
      'UPDATE accounts SET balance = balance - $1 WHERE id = $2',
      [amount, fromAccountId]
    );

    // Credit to account
    await client.query(
      'UPDATE accounts SET balance = balance + $1 WHERE id = $2',
      [amount, toAccountId]
    );

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw new DatabaseError('Transaction failed', error);
  } finally {
    client.release();
  }
}
```

### Pagination Pattern
```javascript
async listUsers(page = 1, limit = 20) {
  const offset = (page - 1) * limit;

  const [users, countResult] = await Promise.all([
    pool.query(
      'SELECT id, email, name FROM users ORDER BY created_at DESC LIMIT $1 OFFSET $2',
      [limit, offset]
    ),
    pool.query('SELECT COUNT(*) FROM users'),
  ]);

  const total = parseInt(countResult.rows[0].count);

  return {
    data: users.rows,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}
```

## Resources

This skill provides comprehensive backend development patterns and examples inline. Additional resources can be added as needed:

### scripts/
For executable utilities like:
- Migration generators
- Test data seeders
- Database backup scripts

### references/
For detailed documentation like:
- Company-specific database schemas
- API design guidelines
- Authentication/authorization policies
- Detailed architecture documentation

### assets/
For template files like:
- Controller/service/repository boilerplate
- Migration file templates
- Test templates
- Configuration file examples

**Note**: Example files in these directories should be removed or replaced with actual resources specific to the project needs.
