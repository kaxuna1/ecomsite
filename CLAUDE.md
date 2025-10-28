# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Luxia Rituals is a full-stack TypeScript e-commerce application for luxury scalp and hair-care products. The architecture consists of:

- **Frontend**: Vite + React + Tailwind CSS storefront with mobile-first design
- **Backend**: Express + SQLite API with JWT authentication
- **Payment Flow**: Manual payment processing with email/SMS notifications

## Development Commands

### Backend (Express + SQLite)

```bash
cd backend
npm install
npm run migrate          # Create/update SQLite database tables
npm run dev              # Start development server with hot reload (port 4000)
npm run build            # TypeScript compilation to dist/
npm start                # Run compiled production server
```

### Frontend (Vite + React)

```bash
cd frontend
npm install
npm run dev              # Start Vite dev server (http://localhost:5173)
npm run build            # Build production assets (outputs to dist/)
npm run preview          # Preview production build locally
npm run lint             # Run ESLint on TypeScript/React code
```

## Architecture

### Backend Structure

- **Entry Point**: `src/server.ts` → `src/app.ts` (Express app configuration)
- **Routes**: `src/routes/` - Express routers for auth, products, and orders
- **Services**: `src/services/` - Business logic layer (authService, productService, orderService)
- **Database**: `src/db/client.ts` - better-sqlite3 instance with WAL mode
- **Migrations**: `src/scripts/migrate.ts` - SQL table definitions (products, orders, order_items)
- **Middleware**: `src/middleware/authMiddleware.ts` - JWT authentication guard for admin routes
- **Types**: `src/types/index.ts` - Shared TypeScript interfaces
- **Config**: `src/config/env.ts` - Environment variable validation and defaults
- **Notifications**: `src/utils/notifications.ts` - Email/SMS template system

### Frontend Structure

- **Entry Point**: `src/main.tsx` → `src/App.tsx` (React Router setup)
- **Pages**: `src/pages/` - Route components for storefront and admin
  - Storefront: HomePage, ProductsPage, ProductDetailPage, CartPage, CheckoutPage
  - Admin: AdminLogin, AdminDashboard, AdminProducts, AdminOrders
- **API Layer**: `src/api/` - Axios client with interceptors and typed API functions
  - `client.ts` - Base Axios instance with JWT token injection
  - `auth.ts`, `products.ts`, `orders.ts` - API endpoint wrappers
- **Context**: `src/context/CartContext.tsx` - React Context for shopping cart state with localStorage persistence
- **Components**: `src/components/` - Reusable UI components
- **Types**: `src/types/` - TypeScript interfaces matching backend models

### Key Architectural Patterns

1. **Service Layer Pattern**: Backend uses services (productService, orderService) to isolate business logic from routes
2. **Context API**: Frontend cart state managed via CartContext with localStorage sync
3. **React Query**: Frontend uses @tanstack/react-query for server state caching and mutations
4. **JWT Authentication**: Admin routes protected by JWT tokens stored in localStorage
5. **Multipart Upload**: Product images handled via multer middleware, stored in `backend/uploads/`
6. **SQLite Persistence**: Database stored at `data/luxia.db` (path configurable via DATABASE_PATH env var)

## Database Schema

- **products**: id, name, short_description, description, price, image_url, inventory, categories, highlights, usage, timestamps
- **orders**: id, customer_name, customer_email, customer_phone, customer_notes, customer_address, total, status (pending/paid/fulfilled), created_at
- **order_items**: id, order_id, product_id, name, price, quantity (foreign keys to orders and products)

## Authentication

- Admin credentials configured via environment variables: `ADMIN_EMAIL` and `ADMIN_PASSWORD_HASH`
- Default password (if ADMIN_PASSWORD_HASH not set): `LuxiaAdmin2024!`
- Generate bcrypt hash: `node -e "console.log(require('bcryptjs').hashSync('YourPassword', 10))"`
- JWT_SECRET environment variable required for token signing

## Environment Configuration

### Backend `.env` (copy from `.env.example`)

Required:
- `PORT` - API server port (default: 4000)
- `DATABASE_PATH` - SQLite file location (default: ./data/luxia.db)
- `JWT_SECRET` - Secret key for JWT signing
- `ADMIN_EMAIL` - Admin login email

Optional:
- `ADMIN_PASSWORD_HASH` - Bcrypt hash of admin password
- SMTP settings: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`
- SMS settings: `SMS_WEBHOOK_URL`, `SMS_API_KEY`, `SMS_FROM`
- `NOTIFY_FROM` - Email sender address for notifications

### Frontend `.env`

- `VITE_API_URL` - Backend API base URL (default: http://localhost:4000/api)

## API Endpoints

All API routes prefixed with `/api`:

**Public:**
- `GET /api/products` - List all products
- `GET /api/products/:id` - Get single product
- `POST /api/orders` - Create order (decrements inventory)
- `POST /api/auth/login` - Admin login (returns JWT)
- `GET /api/health` - Health check

**Admin (requires JWT):**
- `POST /api/products` - Create product with image upload (multipart/form-data)
- `PUT /api/products/:id` - Update product (multipart/form-data)
- `DELETE /api/products/:id` - Delete product and image file
- `GET /api/orders` - List all orders
- `PATCH /api/orders/:id` - Update order status

## Manual Payment Workflow

1. Customer completes checkout → backend creates order with status `pending`
2. Notification sent to customer with payment instructions (email/SMS)
3. Admin views orders at `/admin/orders`
4. Once payment received offline, admin updates status: Pending → Paid → Fulfilled
5. Inventory automatically decremented when order created

## File Upload Handling

- Product images uploaded to `backend/uploads/` directory
- Images served statically at `/uploads/:filename`
- Multer middleware in `productRoutes.ts` handles multipart/form-data
- Old images deleted when products updated or removed

## Testing

No testing framework currently configured. To add tests:
- Backend: Consider Vitest or Jest with supertest for API testing
- Frontend: Consider Vitest + @testing-library/react
- Validation: Backend uses express-validator, frontend uses react-hook-form

## Common Tasks

### Reset Database
```bash
rm data/luxia.db
cd backend && npm run migrate
```

### Seed Sample Products
```bash
cd backend
npm run seed  # Creates sample products if script exists
```

### Check API Health
```bash
curl http://localhost:4000/api/health
```

### Build for Production
```bash
# Backend
cd backend && npm run build

# Frontend
cd frontend && npm run build
# Output: frontend/dist/ (serve via CDN or static host)
```
