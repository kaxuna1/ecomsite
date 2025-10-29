# RESTful API Conventions and Standards

## HTTP Methods

Use appropriate HTTP methods for CRUD operations:

| Method | Operation | Idempotent | Safe | Use Case |
|--------|-----------|------------|------|----------|
| GET | Read | ✅ | ✅ | Retrieve resources |
| POST | Create | ❌ | ❌ | Create new resources |
| PUT | Update/Replace | ✅ | ❌ | Replace entire resource |
| PATCH | Update/Modify | ❌ | ❌ | Partial update |
| DELETE | Delete | ✅ | ❌ | Remove resource |

### Examples

```typescript
// GET - Retrieve resources
GET /api/v1/users              // Get all users
GET /api/v1/users/123          // Get user by ID
GET /api/v1/users?status=active&page=1&limit=10  // With filters

// POST - Create new resource
POST /api/v1/users
Body: { "email": "user@example.com", "name": "John Doe" }

// PUT - Replace entire resource
PUT /api/v1/users/123
Body: { "email": "new@example.com", "name": "John Smith", "status": "active" }

// PATCH - Partial update
PATCH /api/v1/users/123
Body: { "name": "John Smith" }

// DELETE - Remove resource
DELETE /api/v1/users/123
```

## HTTP Status Codes

Use appropriate status codes to indicate the result of requests:

### Success Codes (2xx)

| Code | Name | Usage |
|------|------|-------|
| 200 | OK | Successful GET, PUT, PATCH, or DELETE |
| 201 | Created | Successful POST (resource created) |
| 204 | No Content | Successful DELETE (no response body) |

### Client Error Codes (4xx)

| Code | Name | Usage |
|------|------|-------|
| 400 | Bad Request | Malformed request, validation errors |
| 401 | Unauthorized | Authentication required or failed |
| 403 | Forbidden | Authenticated but not authorized |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Resource conflict (e.g., duplicate email) |
| 422 | Unprocessable Entity | Validation errors with details |
| 429 | Too Many Requests | Rate limit exceeded |

### Server Error Codes (5xx)

| Code | Name | Usage |
|------|------|-------|
| 500 | Internal Server Error | Unexpected server error |
| 502 | Bad Gateway | Upstream service error |
| 503 | Service Unavailable | Server temporarily unavailable |

### Implementation

```typescript
// 200 OK
res.status(200).json({ success: true, data: user });

// 201 Created
res.status(201).json({ success: true, data: newUser });

// 204 No Content
res.status(204).send();

// 400 Bad Request
res.status(400).json({ success: false, error: { message: 'Invalid input' } });

// 401 Unauthorized
res.status(401).json({ success: false, error: { message: 'Authentication required' } });

// 404 Not Found
res.status(404).json({ success: false, error: { message: 'User not found' } });

// 422 Validation Error
res.status(422).json({
  success: false,
  error: {
    message: 'Validation failed',
    details: [
      { field: 'email', message: 'Invalid email format' },
      { field: 'password', message: 'Password must be at least 8 characters' }
    ]
  }
});
```

## URL Structure

### Naming Conventions

```
✅ GOOD
/api/v1/users                  // Plural nouns
/api/v1/users/123              // Resource ID
/api/v1/users/123/posts        // Nested resources
/api/v1/posts?author=123       // Query parameters for filtering

❌ BAD
/api/v1/getUsers               // Don't use verbs
/api/v1/user                   // Use plural
/api/v1/users_posts            // Use hierarchy
/api/v1/user-profile           // Inconsistent naming
```

### API Versioning

Include version in URL path:

```
/api/v1/users
/api/v2/users
```

### Resource Hierarchy

```
// Nested resources (when resource belongs to parent)
/api/v1/users/123/posts
/api/v1/users/123/posts/456

// Separate resources (when relationship is loose)
/api/v1/posts?author=123
/api/v1/posts?category=tech
```

## Request/Response Format

### Standard Response Structure

```typescript
// Success response
{
  "success": true,
  "data": {
    "id": 1,
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe"
  },
  "message": "User retrieved successfully",
  "meta": {
    "timestamp": "2024-01-15T10:30:00Z"
  }
}

// List response with pagination
{
  "success": true,
  "data": [
    { "id": 1, "name": "Item 1" },
    { "id": 2, "name": "Item 2" }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 42,
    "totalPages": 5
  }
}

// Error response
{
  "success": false,
  "error": {
    "message": "User not found",
    "code": "USER_NOT_FOUND"
  }
}

// Validation error response
{
  "success": false,
  "error": {
    "message": "Validation failed",
    "details": [
      { "field": "email", "message": "Invalid email format" },
      { "field": "password", "message": "Must be at least 8 characters" }
    ]
  }
}
```

### Field Naming

Use `camelCase` for JSON fields (JavaScript convention):

```json
// ✅ GOOD
{
  "firstName": "John",
  "lastName": "Doe",
  "createdAt": "2024-01-15T10:30:00Z"
}

// ❌ BAD
{
  "first_name": "John",
  "LastName": "Doe",
  "created-at": "2024-01-15T10:30:00Z"
}
```

## Pagination

### Query Parameters

```
GET /api/v1/users?page=1&limit=10
```

### Response Format

```json
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

### Cursor-Based Pagination (for large datasets)

```
GET /api/v1/posts?cursor=eyJpZCI6MTIzfQ&limit=20
```

```json
{
  "success": true,
  "data": [...],
  "meta": {
    "nextCursor": "eyJpZCI6MTQzfQ",
    "hasMore": true
  }
}
```

## Filtering, Sorting, and Searching

### Filtering

```
GET /api/v1/users?status=active&role=admin
GET /api/v1/products?price[gte]=10&price[lte]=100
```

### Sorting

```
GET /api/v1/users?sort=createdAt:desc
GET /api/v1/products?sort=price:asc,name:asc
```

### Searching

```
GET /api/v1/users?search=john
GET /api/v1/products?q=laptop
```

### Field Selection (Sparse Fieldsets)

```
GET /api/v1/users?fields=id,email,firstName
```

## Authentication

### JWT Bearer Token

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Implementation

```typescript
// Protected route
router.get('/users', authenticate, userController.getAll);

// Optional auth
router.get('/posts', optionalAuth, postController.getAll);
```

## Rate Limiting

Include rate limit headers in responses:

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 87
X-RateLimit-Reset: 1642256400
```

Implementation:

```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests, please try again later.',
});

app.use('/api/', limiter);
```

## CORS

Configure CORS appropriately:

```typescript
import cors from 'cors';

// Development
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
}));

// Production
app.use(cors({
  origin: process.env.CORS_ORIGIN,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
```

## Error Handling

### Error Response Format

```typescript
interface ErrorResponse {
  success: false;
  error: {
    message: string;
    code?: string;
    details?: any;
    stack?: string; // Only in development
  };
}
```

### Custom Error Classes

```typescript
class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public code?: string
  ) {
    super(message);
  }
}

// Usage
throw new AppError(404, 'User not found', 'USER_NOT_FOUND');
```

## Idempotency

Implement idempotency for critical operations:

```http
POST /api/v1/payments
Idempotency-Key: unique-request-id-123
```

```typescript
// Store processed request IDs
const processedRequests = new Map();

app.post('/payments', async (req, res) => {
  const idempotencyKey = req.headers['idempotency-key'];

  if (processedRequests.has(idempotencyKey)) {
    return res.json(processedRequests.get(idempotencyKey));
  }

  const result = await processPayment(req.body);
  processedRequests.set(idempotencyKey, result);

  res.json(result);
});
```

## Health Check Endpoint

Every API should have a health check endpoint:

```typescript
GET /api/v1/health

Response:
{
  "status": "healthy",
  "uptime": 123456,
  "timestamp": "2024-01-15T10:30:00Z",
  "database": "connected",
  "dependencies": {
    "redis": "connected",
    "s3": "connected"
  }
}
```

## Documentation

Use OpenAPI/Swagger for API documentation:

```typescript
// Swagger annotations
/**
 * @swagger
 * /users:
 *   get:
 *     summary: Get all users
 *     tags: [Users]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *     responses:
 *       200:
 *         description: List of users
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 */
router.get('/users', userController.getAll);
```

## Best Practices Summary

1. ✅ Use plural nouns for resource names
2. ✅ Use HTTP methods correctly (GET, POST, PUT, PATCH, DELETE)
3. ✅ Return appropriate HTTP status codes
4. ✅ Use consistent response format
5. ✅ Implement pagination for list endpoints
6. ✅ Support filtering, sorting, and searching
7. ✅ Version your API
8. ✅ Implement rate limiting
9. ✅ Use JWT for authentication
10. ✅ Provide health check endpoint
11. ✅ Handle errors consistently
12. ✅ Document your API with OpenAPI/Swagger
