# Express PostgreSQL API Template

A production-ready Express.js API template with TypeScript, PostgreSQL, and best practices.

## Features

- **TypeScript** - Type-safe development
- **PostgreSQL** - Robust relational database with connection pooling
- **Layered Architecture** - Routes → Controllers → Services → Repositories
- **Authentication** - JWT-based authentication with bcrypt password hashing
- **Validation** - Request validation with Zod
- **Error Handling** - Centralized error handling with custom error classes
- **Security** - Helmet, CORS, rate limiting
- **Logging** - Winston logger with different log levels
- **Docker** - PostgreSQL setup with Docker Compose
- **Database Migrations** - node-pg-migrate for schema management

## Project Structure

```
src/
├── config/          # Configuration (database, env)
├── controllers/     # Request handlers
├── middleware/      # Express middleware (auth, validation, errors)
├── models/          # TypeScript interfaces and Zod schemas
├── repositories/    # Database access layer
├── routes/          # API route definitions
├── services/        # Business logic
├── utils/           # Helpers (errors, response, logger)
├── app.ts           # Express app setup
└── server.ts        # Server entry point
```

## Prerequisites

- Node.js 18+
- PostgreSQL 14+ (or use Docker)
- npm or yarn

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Database

**Option A: Using Docker (Recommended)**

```bash
docker-compose up -d
```

**Option B: Local PostgreSQL**

Create a database and update the `.env` file with your credentials.

### 3. Configure Environment

Copy `.env.example` to `.env` and update the values:

```bash
cp .env.example .env
```

**Important**: Change `JWT_SECRET` and `JWT_REFRESH_SECRET` to secure random strings in production.

### 4. Run Migrations

```bash
npm run migrate:up
```

### 5. Start Development Server

```bash
npm run dev
```

The API will be available at `http://localhost:3000/api/v1`

## API Endpoints

### Authentication

- `POST /api/v1/users/register` - Register a new user
- `POST /api/v1/users/login` - Login and get JWT token

### Users (Protected)

- `GET /api/v1/users` - Get all users (paginated)
- `GET /api/v1/users/:id` - Get user by ID
- `PUT /api/v1/users/:id` - Update user
- `DELETE /api/v1/users/:id` - Delete user

### Health Check

- `GET /api/v1/health` - Health check endpoint

## Authentication

Include the JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Example Requests

### Register

```bash
curl -X POST http://localhost:3000/api/v1/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "firstName": "John",
    "lastName": "Doe"
  }'
```

### Login

```bash
curl -X POST http://localhost:3000/api/v1/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

### Get Users (Protected)

```bash
curl http://localhost:3000/api/v1/users \
  -H "Authorization: Bearer <your-jwt-token>"
```

## Database Migrations

### Create a new migration

```bash
npm run migrate:create <migration-name>
```

### Run migrations

```bash
npm run migrate:up
```

### Rollback migrations

```bash
npm run migrate:down
```

## Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm test` - Run tests
- `npm run lint` - Lint code
- `npm run format` - Format code with Prettier

## Production Deployment

1. Set `NODE_ENV=production`
2. Use strong, random values for JWT secrets
3. Configure proper database credentials
4. Set up SSL/TLS for PostgreSQL
5. Configure proper CORS origins
6. Set up monitoring and logging
7. Use environment-specific rate limits

## Best Practices Implemented

- ✅ Parameterized queries (SQL injection prevention)
- ✅ Password hashing with bcrypt
- ✅ JWT authentication
- ✅ Input validation with Zod
- ✅ Centralized error handling
- ✅ Database connection pooling
- ✅ Transaction support
- ✅ Structured logging
- ✅ Security headers (Helmet)
- ✅ Rate limiting
- ✅ CORS configuration
- ✅ Health check endpoint
- ✅ Graceful shutdown

## License

MIT
