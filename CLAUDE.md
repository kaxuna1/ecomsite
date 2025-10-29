# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Luxia Products is a **full-stack TypeScript e-commerce platform** for luxury scalp and hair-care products. The application features a comprehensive CMS, multilingual support, advanced product management, and a modern admin dashboard.

### Architecture

- **Frontend**: Vite + React 18 + TypeScript + Tailwind CSS with mobile-first design
- **Backend**: Express + TypeScript API with PostgreSQL database
- **Database**: PostgreSQL 14 with connection pooling (pg library)
- **Authentication**: JWT-based auth for both admin users and customers
- **Image Processing**: Sharp for automatic WebP optimization (70-90% file size reduction)
- **Internationalization**: i18next with URL-based language routing (`/en/`, `/ka/`)
- **Deployment**: Docker single-container deployment with PostgreSQL, Nginx, and Supervisor

## Development Commands

### Backend (Express + PostgreSQL)

```bash
cd backend
npm install
npm run migrate          # Run PostgreSQL migrations (creates/updates tables)
npm run dev              # Start development server with hot reload (port 4000)
npm run build            # TypeScript compilation to dist/
npm start                # Run compiled production server
npm run seed             # Seed database with sample data (optional)
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

### Docker Deployment

```bash
# Build and run with Docker Compose
docker-compose up -d

# Or build manually
docker build -t luxia-ecommerce:latest .
docker run -d -p 80:80 \
  -e JWT_SECRET=your-secret \
  -e DB_PASSWORD=your-password \
  -e POSTGRES_PASSWORD=your-password \
  luxia-ecommerce:latest
```

## Architecture Details

### Backend Structure

- **Entry Point**: `src/server.ts` → `src/app.ts` (Express app configuration)
- **Database**: `src/db/client.ts` - PostgreSQL connection pool using `pg` library
- **Migrations**: `src/scripts/migrate.ts` - Single file with all DDL (creates tables, indexes, functions)
- **Routes**: `src/routes/` - 15 Express routers organized by domain
  - `authRoutes.ts` - Admin authentication
  - `userAuthRoutes.ts` - Customer authentication
  - `productRoutes.ts` - Product CRUD with image upload (multipart/form-data)
  - `orderRoutes.ts` - Order management
  - `addressRoutes.ts` - Customer address management
  - `favoritesRoutes.ts` - Customer wishlist
  - `promoCodeRoutes.ts` - Discount code management
  - `cmsRoutes.ts` - CMS pages and blocks
  - `navigationRoutes.ts` - Menu management
  - `settingsRoutes.ts` - Site configuration
  - `attributeRoutes.ts` - Custom product attributes
  - `variantRoutes.ts` - Product variant management
  - `languageRoutes.ts` - Multilingual configuration
  - `adminUserRoutes.ts` - Admin user management
  - `apiKeysRoutes.ts` - Encrypted API keys management
- **Services**: `src/services/` - 17 business logic modules
  - Product, order, user, auth, CMS, media, navigation, settings, API keys, etc.
  - Service layer isolates business logic from routes
- **Middleware**: `src/middleware/authMiddleware.ts` - JWT authentication guards; `rateLimiter.ts` - Rate limiting
- **Types**: `src/types/` - Shared TypeScript interfaces and types
- **Config**: `src/config/env.ts` - Environment variable validation with defaults
- **Utilities**: `src/utils/` - Notification templates, image processing helpers

### Frontend Structure

- **Entry Point**: `src/main.tsx` → `src/App.tsx` (React Router with language routing)
- **Routing**: Language-prefixed URLs (`/:lang/*`) for all public routes
- **Pages**: `src/pages/` - 36 route components organized by section
  - **Storefront**: HomePage, ProductsPage, ProductDetailPage, CartPage, CheckoutPage, SearchPage
  - **Special Pages**: NewArrivalsPage, BestSellersPage, SalePage
  - **Auth**: LoginPage, SignupPage
  - **Account** (Protected): ProfilePage, OrdersPage, FavoritesPage
  - **Admin** (Protected): Dashboard, Products, Orders, CMS, Navigation, Settings, etc.
  - **Dynamic**: CMSPage (handles `/:lang/:slug` for CMS content)
- **Components**: `src/components/` - 56 reusable UI components
  - Layout components (Layout, AdminLayout, Navbar, Footer)
  - Product components (ProductCard, VariantSelector, ImageZoom)
  - Admin components (DataTable, ProductEditor, ImageEditor, block editors)
  - CMS components (BlockRenderer, EditableBlock, 10+ block editors)
  - Utility components (SEOHead, LanguageSwitcher, LoadingScreen)
- **API Layer**: `src/api/` - 15 typed API client modules with Axios
  - Base client with JWT token injection and error handling
  - Typed functions for all endpoints (auth, products, orders, cms, etc.)
- **Context**: `src/context/` - React Context providers
  - `CartContext.tsx` - Shopping cart with localStorage persistence
  - `AuthContext.tsx` - User authentication state
  - `I18nContext.tsx` - Language switching and i18n configuration
- **Hooks**: `src/hooks/` - Custom React hooks (useAutoSave, etc.)
- **Types**: `src/types/` - TypeScript interfaces matching backend models
- **Internationalization**: `src/i18n/` + `public/locales/` - i18next configuration and translations

### Key Architectural Patterns

1. **Service Layer Pattern**: Backend uses service modules to isolate business logic from HTTP concerns
2. **Context API**: Frontend uses React Context for global state (cart, auth, i18n)
3. **React Query**: Server state caching, mutations, and automatic refetching with TanStack Query
4. **JWT Authentication**: Dual auth systems (admin and customer) with localStorage token storage
5. **Multipart Upload**: Product/media images via multer middleware with in-memory storage
6. **PostgreSQL with `pg`**: Direct SQL queries with connection pooling
7. **Automatic Image Optimization**: Sharp library converts all uploads to WebP format
8. **URL-based i18n**: Language prefix in URLs (`/en/products`, `/ka/products`)
9. **Block-Based CMS**: Composable content blocks with visual editors
10. **Type-Safe API**: Shared TypeScript types between frontend and backend

## Database Schema

### Core E-commerce Tables

- **products**: Core product data (id, name, description, price, sale_price, image_url, inventory, categories, is_new, is_featured, sales_count, slug, SEO fields, custom_attributes)
- **product_translations**: Multilingual product content (name, description, highlights, usage, SEO per language)
- **orders**: Order records (customer info, total, status, address_id, user_id, promo_code_id)
- **order_items**: Line items for each order (product_id, name, price, quantity, variant_id)

### Product Variants & Attributes

- **variant_options**: Attribute definitions (e.g., "Size", "Color")
- **variant_option_values**: Values for each option (e.g., "Small", "Red")
- **product_variants**: Product SKUs with specific attribute combinations (sku, price, inventory, dimensions, image_url)
- **product_variant_options**: Junction table linking variants to option values

### User Management

- **users**: Customer accounts (email, password_hash, name, phone)
- **admin_users**: Admin accounts (separate from customers, with name and role)
- **user_addresses**: Saved shipping addresses (user_id, address details, is_default)
- **favorites**: Customer wishlist (user_id, product_id)

### Promo Codes

- **promo_codes**: Discount codes (code, type [percentage/fixed], value, usage limits, expiry)

### Content Management System (CMS)

- **cms_pages**: Page definitions (title, slug, template, is_published)
- **cms_page_translations**: Multilingual page metadata (title, slug, meta_title, meta_description per language)
- **cms_blocks**: Content blocks within pages (type, content as JSONB, display_order)
- **cms_block_translations**: Multilingual block content
- **cms_media**: Media library (url, alt_text, caption, dimensions, file_size, admin_user_id)

### Navigation & Settings

- **languages**: Language definitions (code, name, native_name, is_default, is_enabled, display_order)
- **menu_locations**: Navigation locations (code: header/footer/mobile)
- **menu_items**: Menu item definitions (location_id, parent_id, label, link_type, link_url, cms_page_id, display_order)
- **menu_item_translations**: Multilingual menu labels
- **site_settings**: Key-value configuration (logo_type, logo_text, logo_image_url)
- **footer_settings**: Footer configuration (brand_name, brand_tagline, columns, contact, newsletter, social)
- **footer_settings_translations**: Multilingual footer content

### API Keys Management

- **api_keys**: Encrypted API key storage (key_name UNIQUE, key_value encrypted, category, description, is_active, created_by, updated_by)
- **api_keys_audit_log**: Complete audit trail (key_name, action, admin_user_id, admin_user_email, ip_address, user_agent, old_value masked, new_value masked, metadata JSONB, created_at)

### Database Features

- **Full-text search**: `search_vector` TSVECTOR column on products with GIN index
- **JSONB storage**: Categories, highlights, custom_attributes stored as JSONB for flexibility
- **Foreign keys**: Referential integrity with CASCADE/RESTRICT policies
- **Indexes**: Optimized for common queries (created_at, language_code, slug, search)
- **Triggers**: Circular reference prevention for menu items
- **Unique constraints**: Prevents duplicate slugs per language, single default language

## Authentication

### Admin Users

- Stored in `admin_users` table (separate from customer users)
- Login endpoint: `POST /api/auth/login`
- JWT token returned with admin_user data
- Protected routes use `authMiddleware` to verify JWT
- Initial admin created via environment variables or script
- Default credentials (if not configured):
  - Email: `admin@luxia.local`
  - Password: `LuxiaAdmin2024!` (change immediately in production)

### Customer Users

- Stored in `users` table
- Registration: `POST /api/user/auth/register`
- Login: `POST /api/user/auth/login`
- JWT token with user data
- Protected routes: account pages, favorites, saved addresses

### JWT Configuration

- Secret key: `JWT_SECRET` environment variable (required)
- Token expiry: Configurable (default 7 days)
- Token storage: localStorage in frontend
- Automatic injection: Axios interceptor adds Authorization header

### Password Security

- Bcrypt hashing with salt rounds: 10
- No plaintext passwords stored
- Generate admin password hash: `node -e "console.log(require('bcryptjs').hashSync('YourPassword', 10))"`

## Environment Configuration

### Backend `.env` (copy from `.env.example`)

**Required:**
```bash
# Database (PostgreSQL)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=luxia
DB_USER=postgres
DB_PASSWORD=your-secure-password

# Authentication
JWT_SECRET=your-jwt-secret-key-change-in-production

# Admin User
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD_HASH=$2b$10$...  # Generate with bcryptjs

# Server
PORT=4000
NODE_ENV=production
```

**Optional:**
```bash
# Email Notifications (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@example.com
SMTP_PASSWORD=app-password
NOTIFY_FROM=Luxia Products <noreply@example.com>

# SMS Notifications
SMS_WEBHOOK_URL=https://api.sms-provider.com/send
SMS_API_KEY=your-sms-api-key
SMS_FROM=+1234567890

# S3/Object Storage (currently disabled)
S3_ENDPOINT=https://s3.amazonaws.com
S3_REGION=us-east-1
S3_BUCKET=luxia-uploads
S3_ACCESS_KEY_ID=your-access-key
S3_SECRET_ACCESS_KEY=your-secret-key
S3_PUBLIC_URL=https://cdn.example.com
S3_FORCE_PATH_STYLE=true

# Initial Admin (created on first run)
INITIAL_ADMIN_EMAIL=admin@luxia.local
INITIAL_ADMIN_PASSWORD=LuxiaAdmin2024!
INITIAL_ADMIN_NAME=Super Administrator
```

### Frontend `.env`

```bash
VITE_API_URL=http://localhost:4000/api
```

For production, set to `/api` to use same-origin requests through Nginx proxy.

## API Endpoints

All API routes are prefixed with `/api`:

### Public Endpoints

**Products:**
- `GET /api/products` - List products with filters (category, search, attributes, language, page, limit)
- `GET /api/products/:id` - Get single product with translations and variants
- `GET /api/products/search` - Search products with full-text search

**Orders:**
- `POST /api/orders` - Create order (decrements inventory, validates promo codes)

**Promo Codes:**
- `POST /api/promo-codes/validate` - Validate promo code

**CMS:**
- `GET /api/cms/pages/:slug?lang=en` - Get CMS page with blocks and translations
- `GET /api/cms/pages` - List all published pages

**Navigation:**
- `GET /api/navigation/:location?lang=en` - Get menu items for location (header/footer/mobile)

**Settings:**
- `GET /api/settings` - Get site settings (logo, footer)

**Languages:**
- `GET /api/languages` - Get enabled languages

**Health Check:**
- `GET /api/health` - API health check (returns `{status: "ok"}`)

### Customer Endpoints (JWT Required)

**Authentication:**
- `POST /api/user/auth/register` - Register new customer
- `POST /api/user/auth/login` - Customer login
- `GET /api/user/auth/me` - Get current user profile

**Addresses:**
- `GET /api/addresses` - List user's saved addresses
- `POST /api/addresses` - Create new address
- `PUT /api/addresses/:id` - Update address
- `DELETE /api/addresses/:id` - Delete address
- `PATCH /api/addresses/:id/default` - Set default address

**Favorites:**
- `GET /api/favorites` - List user's favorite products
- `POST /api/favorites` - Add product to favorites
- `DELETE /api/favorites/:id` - Remove from favorites

**Orders:**
- `GET /api/orders/user` - Get user's order history

### Admin Endpoints (JWT Required)

**Authentication:**
- `POST /api/auth/login` - Admin login (returns JWT)

**Products:**
- `POST /api/products` - Create product (multipart/form-data with image)
- `PUT /api/products/:id` - Update product (multipart/form-data)
- `DELETE /api/products/:id` - Delete product and image files
- `POST /api/products/:id/translations` - Add/update product translation

**Product Variants:**
- `GET /api/products/:productId/variants` - List product variants
- `POST /api/products/:productId/variants` - Create variant
- `PUT /api/variants/:id` - Update variant
- `DELETE /api/variants/:id` - Delete variant

**Attributes:**
- `GET /api/attributes` - List variant options
- `POST /api/attributes` - Create variant option
- `PUT /api/attributes/:id` - Update variant option
- `DELETE /api/attributes/:id` - Delete variant option
- `POST /api/attributes/:id/values` - Add option value

**Orders:**
- `GET /api/orders` - List all orders with filters
- `GET /api/orders/:id` - Get order details
- `PATCH /api/orders/:id` - Update order status (pending → paid → fulfilled)

**Promo Codes:**
- `GET /api/promo-codes` - List all promo codes
- `POST /api/promo-codes` - Create promo code
- `PUT /api/promo-codes/:id` - Update promo code
- `DELETE /api/promo-codes/:id` - Delete promo code

**CMS:**
- `GET /api/cms/pages` - List all pages (including unpublished)
- `POST /api/cms/pages` - Create CMS page
- `PUT /api/cms/pages/:id` - Update page
- `DELETE /api/cms/pages/:id` - Delete page
- `POST /api/cms/pages/:id/blocks` - Add block to page
- `PUT /api/cms/blocks/:id` - Update block
- `DELETE /api/cms/blocks/:id` - Delete block
- `POST /api/cms/media` - Upload media (multipart/form-data)

**Navigation:**
- `GET /api/navigation` - List all menu locations and items
- `POST /api/navigation/:locationId/items` - Create menu item
- `PUT /api/navigation/items/:id` - Update menu item
- `DELETE /api/navigation/items/:id` - Delete menu item

**Settings:**
- `PUT /api/settings` - Update site settings (logo, footer)

**Languages:**
- `GET /api/languages?includeDisabled=true` - List all languages
- `POST /api/languages` - Create language
- `PUT /api/languages/:code` - Update language
- `DELETE /api/languages/:code` - Delete language

**Admin Users:**
- `GET /api/admin` - List admin users
- `POST /api/admin` - Create admin user
- `PUT /api/admin/:id` - Update admin user
- `DELETE /api/admin/:id` - Delete admin user

**Regular Users (Customers):**
- `GET /api/admin/users` - List customer accounts
- `GET /api/admin/users/:id` - Get customer details
- `PUT /api/admin/users/:id` - Update customer

**API Keys:**
- `GET /api/admin/api-keys` - List all API keys (masked values)
- `GET /api/admin/api-keys/:keyName?decrypt=true` - Get specific API key (optionally decrypted)
- `POST /api/admin/api-keys` - Create or update single API key
- `PUT /api/admin/api-keys` - Bulk update multiple API keys
- `DELETE /api/admin/api-keys/:keyName` - Permanently delete API key
- `PATCH /api/admin/api-keys/:keyName/deactivate` - Soft delete (deactivate) API key
- `POST /api/admin/api-keys/validate/:feature` - Validate required keys for a feature
- `GET /api/admin/api-keys/audit-log?keyName=xxx&limit=100` - Get audit log entries

## Key Features

### 1. Multilingual Support (i18next)

**Languages**: English (en), Georgian (ka) - configurable via admin panel

**Translatable Content:**
- Product names, descriptions, highlights, usage instructions
- CMS pages and blocks
- Navigation menus
- Footer content
- All UI strings

**URL Structure:**
- Public routes: `/:lang/path` (e.g., `/en/products`, `/ka/products`)
- Admin routes: `/admin/*` (not language-specific)
- Automatic redirect: `/` → `/:defaultLang/`

**Implementation:**
- Backend: Separate translation tables (product_translations, cms_page_translations, etc.)
- Frontend: i18next with react-i18next, language detection from URL
- API: `?lang=en` query parameter for fetching translated content

### 2. Content Management System (CMS)

**Visual Block-Based Editor:**
- Create pages with composable blocks
- 10+ block types: Hero, Text+Image, Features, Testimonials, Stats, FAQ, Newsletter, CTA, Products
- Live preview in admin panel
- Drag-and-drop reordering
- Per-block translations

**Block Types:**
- **Hero**: Multiple templates (full-screen, split, minimal) with images, CTA buttons
- **Text + Image**: Content sections with image placement options
- **Features**: Grid of feature items with icons
- **Testimonials**: Customer reviews carousel
- **Statistics**: Number counters with animations
- **FAQ**: Expandable accordion sections
- **Newsletter**: Email signup form
- **CTA**: Call-to-action banners
- **Products**: Featured product showcases

**Page Management:**
- Custom slugs per language
- SEO metadata (title, description)
- Publish/unpublish toggle
- Dynamic routing (`/:lang/:slug`)

### 3. Product Management

**Core Features:**
- Name, short description, full description
- Price and sale price support
- Inventory tracking with automatic decrements
- Categories (multi-select, stored as JSONB)
- Product highlights (bullet points)
- Usage instructions
- Custom slugs for SEO

**Product Variants (SKU System):**
- Define custom attributes (Size, Color, Material, etc.)
- Create variants with attribute combinations
- Per-variant pricing, inventory, and images
- Default variant designation
- Active/inactive variants

**Product Attributes:**
- Admin-defined custom attributes (JSONB)
- Filterable on frontend
- Examples: Brand, Scent, Volume, Ingredients

**Product Metadata:**
- `is_new`: New arrivals flag
- `is_featured`: Featured products
- `sales_count`: Best sellers tracking
- SEO fields: meta_title, meta_description, meta_keywords, og_image_url, canonical_url

**Image Optimization:**
- Automatic WebP conversion via Sharp
- Max dimensions: 1920x1920px
- Quality: 85%
- 70-90% file size reduction
- Fallback to original if optimization fails

**Full-Text Search:**
- PostgreSQL TSVECTOR with GIN index
- Searches name, description, highlights
- Automatic indexing on product changes

### 4. Shopping Cart & Checkout

**Cart Features:**
- Add to cart with quantity selection
- Variant selection support
- localStorage persistence
- Quantity updates
- Item removal
- Promo code application
- Real-time total calculation

**Checkout Flow:**
1. Customer information (name, email, phone)
2. Address selection (saved addresses or new address)
3. Order notes (optional)
4. Promo code validation
5. Order summary with totals
6. Submit order (creates order, decrements inventory)

**Manual Payment Workflow:**
- Order created with status: `pending`
- Email/SMS notification sent to customer with payment instructions
- Admin reviews order in dashboard
- Admin updates status: Pending → Paid → Fulfilled
- Each status change can trigger notifications (templates exist)

### 5. User Accounts

**Customer Features:**
- Registration and login
- Profile management (name, email, phone)
- Order history with status tracking
- Saved addresses (multiple, with default)
- Favorites/wishlist
- JWT-based authentication

**Admin Features:**
- Separate admin user system
- Full dashboard access
- Role-based permissions (ready for expansion)
- Manage all entities (products, orders, CMS, settings)

### 6. Navigation Management

**Menu System:**
- Multiple locations: Header, Footer, Mobile
- Hierarchical menus (parent/child items)
- Link types: Internal routes, External URLs, CMS pages, None (labels only)
- Per-language menu item labels
- Display order control
- Open in new tab option
- CSS class customization
- Circular reference prevention (database trigger)

### 7. Site Settings

**Logo Configuration:**
- Text logo or image upload
- Editable via admin panel

**Footer Settings:**
- Brand name and tagline
- Multi-column links
- Contact information
- Newsletter signup
- Social media links
- Copyright text
- Bottom links (Privacy, Terms, etc.)
- All translatable per language

### 8. Promo Codes

**Features:**
- Percentage or fixed amount discounts
- Usage limits (per code and per user)
- Expiry dates
- Minimum order amount requirements
- Active/inactive status
- Usage tracking

### 9. Order Management

**Admin Dashboard:**
- View all orders
- Filter by status, date, customer
- View order details (items, customer, address)
- Update order status
- Order timeline view

**Order Statuses:**
- `pending`: Awaiting payment
- `paid`: Payment received
- `fulfilled`: Shipped/completed

**Inventory Management:**
- Automatic decrements on order creation
- Manual adjustments in product editor
- Low stock indicators (can be added)

### 10. API Keys Management

**Secure Storage & Encryption:**
- AES-256-GCM encryption for all stored API keys
- PBKDF2 key derivation (100,000 iterations)
- Individual salt and IV per encrypted value
- Automatic value masking in UI
- Environment-based encryption key (ENCRYPTION_KEY)

**Supported Service Categories:**
- **Payment Gateways**: Stripe, PayPal (5 keys)
- **Communication**: Twilio SMS, SendGrid, Mailgun (6 keys)
- **AI & ML**: OpenAI, Anthropic Claude (3 keys)
- **Analytics**: Google Analytics, Facebook Pixel, TikTok, Mixpanel (5 keys)
- **Shipping**: Shippo, EasyPost, ShipStation (4 keys)
- **Storage & CDN**: AWS S3, Cloudflare (6 keys)
- **Search**: Algolia (3 keys)
- **Marketing**: Klaviyo, Mailchimp, HubSpot (3 keys)
- **Other**: Google Maps, reCAPTCHA, Exchange Rate API (4 keys)

**Admin Interface:**
- Organized by category with 8 sections
- Toggle visibility (masked by default)
- Copy to clipboard functionality
- Clear individual keys
- Auto-save with loading states
- Security notice banner

**API Endpoints:**
- `GET /api/admin/api-keys` - List all keys (masked)
- `GET /api/admin/api-keys/:keyName` - Get specific key (with decrypt option)
- `POST /api/admin/api-keys` - Create/update single key
- `PUT /api/admin/api-keys` - Bulk update multiple keys
- `DELETE /api/admin/api-keys/:keyName` - Permanently delete key
- `PATCH /api/admin/api-keys/:keyName/deactivate` - Soft delete (deactivate)
- `POST /api/admin/api-keys/validate/:feature` - Validate required keys for features
- `GET /api/admin/api-keys/audit-log` - View audit log entries

**Security Features:**
- Audit logging for all key access and modifications
- Tracks: admin user, IP address, user agent, timestamp
- Rate limiting: 30 requests per 15 minutes per user
- Admin-only access (JWT required)
- Masked values in audit logs
- Row-level tracking of created_by/updated_by

**Feature Validation:**
- Validates required keys for specific integrations
- 25+ predefined feature mappings
- Examples: `stripe`, `paypal`, `openai`, `twilio`, `aws_s3`, etc.
- Returns missing required keys and optional keys

**Setup Instructions:**

1. **Generate Encryption Key** (Production):
   ```bash
   cd backend
   npm run generate-key
   # Copy the generated key to your .env file
   ```

2. **Set Environment Variable**:
   ```bash
   # Add to backend/.env
   ENCRYPTION_KEY=your-generated-256-bit-key-here
   ```

3. **Access Admin Interface**:
   - Navigate to `/admin/settings`
   - Click "API Keys" tab
   - Add keys by category
   - Keys are automatically encrypted on save

4. **Use Keys in Code**:
   ```typescript
   import { getAPIKey } from '../services/apiKeysService';

   // Get decrypted key value
   const stripeKey = await getAPIKey('stripe_secret_key');

   // Validate feature requirements
   import { validateAPIKeysForFeature } from '../services/apiKeysService';
   const validation = await validateAPIKeysForFeature('stripe');
   // Returns: { valid: boolean, missing: string[], optional?: string[] }
   ```

**Database Tables:**
- `api_keys`: Encrypted key storage with metadata
- `api_keys_audit_log`: Complete audit trail of all operations

**Important Notes:**
- Never commit ENCRYPTION_KEY to version control
- Use strong, unique keys for production
- Rotate encryption keys periodically
- Monitor audit logs for suspicious activity
- Consider Redis for distributed deployments (current: in-memory rate limiting)

## Image Handling

### Upload Locations

```
backend/uploads/
├── product-images/       # Product main images
├── cms/                  # CMS media library
└── logo/                 # Site logo
```

### Processing Pipeline

1. User uploads image (JPG/PNG/GIF/WebP)
2. Multer receives file in memory (memoryStorage)
3. Sharp processes buffer
4. Resize to max dimensions (if needed)
5. Convert to WebP format
6. Compress with quality settings
7. Save to appropriate directory
8. Store URL and metadata in database
9. Return URL to client

### Configuration

**Product Images:**
- Max dimensions: 1920 x 1920px
- Format: WebP
- Quality: 85%
- Location: `/uploads/product-images/`

**CMS Media:**
- Max dimensions: 2560 x 2560px
- Format: WebP
- Quality: 90%
- Location: `/uploads/cms/`

**Image URLs:**
- Served statically at `/uploads/:path`
- Nginx handles caching and compression
- Example: `http://localhost/uploads/product-images/1234567890-product.webp`

### Browser Support

WebP is supported by 95%+ of browsers (Chrome 23+, Firefox 65+, Safari 14+, Edge 18+).

For older browsers, consider implementing `<picture>` element with fallback formats.

## Deployment

### Docker Single-Container Deployment

The application ships with a production-ready Dockerfile that includes:

1. **PostgreSQL 14** - Database server
2. **Node.js 20** - Backend runtime (using tsx, no compilation needed)
3. **Nginx** - Reverse proxy and static file server
4. **Supervisor** - Process management for all services

**Build & Run:**

```bash
# Using Docker Compose (recommended)
docker-compose up -d

# Manual build
docker build -t luxia-ecommerce:latest .
docker run -d -p 80:80 \
  -e DB_PASSWORD=secure_password \
  -e POSTGRES_PASSWORD=secure_password \
  -e JWT_SECRET=$(openssl rand -base64 32) \
  -v luxia-postgres:/var/lib/postgresql/data \
  -v luxia-uploads:/app/backend/uploads \
  luxia-ecommerce:latest

# Health check
curl http://localhost/api/health
```

**Service Startup Order:**
1. PostgreSQL (priority 1)
2. Database migrations (priority 2)
3. Backend API (priority 3)
4. Nginx (priority 4)

**Port Mapping:**
- External: Port 80 (HTTP)
- Internal Backend: Port 4000
- Internal PostgreSQL: Port 5432 (localhost only)

**Data Persistence:**
Mount these volumes for data persistence:
- `/var/lib/postgresql/data` - Database
- `/app/backend/uploads` - Uploaded images

**Multi-Architecture:**
Supports both AMD64 and ARM64 architectures. Use `docker/build-multiarch.sh` for multi-platform builds.

### Environment Variables for Production

**Critical:**
- Set strong `JWT_SECRET`: `openssl rand -base64 32`
- Set secure database passwords
- Configure `ADMIN_PASSWORD_HASH` with bcrypt hash
- Set `NODE_ENV=production`

**Optional but Recommended:**
- SMTP settings for email notifications
- SMS provider settings for SMS notifications
- S3/CDN configuration for scalable image storage

### Nginx Configuration

Nginx serves as reverse proxy:
- `/api/*` → Backend (port 4000)
- `/uploads/*` → Static files with caching (30 days)
- `/*` → Frontend static files (Vite build)

### Health Check

- **Endpoint**: `http://localhost/api/health`
- **Returns**: `{"status": "ok"}`
- **Interval**: 30 seconds
- **Start period**: 60 seconds
- **Retries**: 3

## Common Development Tasks

### Adding a New Product

**Via API:**
```bash
# With multipart form data
curl -X POST http://localhost:4000/api/products \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -F "name=Scalp Serum" \
  -F "shortDescription=Revitalizing serum" \
  -F "description=Full description here" \
  -F "price=49.99" \
  -F "inventory=100" \
  -F "categories=[\"Serums\",\"Treatments\"]" \
  -F "image=@/path/to/image.jpg"
```

**Via Admin Panel:**
1. Navigate to `/admin/products/new`
2. Fill in product details
3. Upload image (auto-optimized to WebP)
4. Add variants if needed
5. Set categories and attributes
6. Configure SEO metadata
7. Click Save (auto-save enabled)

### Adding a Translation

**Product Translation:**
```typescript
// POST /api/products/:id/translations
{
  "languageCode": "ka",
  "name": "სკალპის სერუმი",
  "shortDescription": "აღმდგენი სერუმი",
  "description": "სრული აღწერა აქ",
  "highlights": ["უპირატესობა 1", "უპირატესობა 2"],
  "usage": "გამოყენების ინსტრუქცია"
}
```

**CMS Page Translation:**
1. Edit page in `/admin/cms`
2. Switch language in editor
3. Translate page title and slug
4. Translate each block's content
5. Save

### Creating a CMS Page

1. Navigate to `/admin/cms`
2. Click "New Page"
3. Set title and slug (e.g., "about-us")
4. Add blocks:
   - Hero block for header
   - Text+Image blocks for content sections
   - Features block for highlights
   - CTA block for actions
5. Configure SEO metadata
6. Add translations for other languages
7. Publish page
8. Access at `/:lang/about-us`

### Running Migrations

**Initial setup:**
```bash
cd backend
npm run migrate
```

This creates all tables, indexes, triggers, and inserts default data (languages, menu locations, default settings).

**After schema changes:**
Edit `src/scripts/migrate.ts` and add new DDL statements. Then run:
```bash
npm run migrate
```

**Note**: Current migration system uses a single file. Consider implementing versioned migrations with a tracking table for production.

### Database Backup & Restore

**Backup:**
```bash
# Docker container
docker exec luxia-app pg_dump -U luxia luxia > backup.sql

# Local PostgreSQL
pg_dump -U postgres luxia > backup.sql
```

**Restore:**
```bash
# Docker container
docker exec -i luxia-app psql -U luxia luxia < backup.sql

# Local PostgreSQL
psql -U postgres luxia < backup.sql
```

### Checking Logs

**Docker:**
```bash
# All logs
docker logs -f luxia-app

# Backend logs
docker exec luxia-app tail -f /var/log/supervisor/backend.log

# PostgreSQL logs
docker exec luxia-app tail -f /var/log/supervisor/postgresql.log

# Nginx logs
docker exec luxia-app tail -f /var/log/nginx/access.log
docker exec luxia-app tail -f /var/log/nginx/error.log
```

**Local Development:**
Backend logs appear in terminal where `npm run dev` is running.

### Resetting Database

**Complete reset:**
```bash
# Docker
docker exec luxia-app psql -U postgres -c "DROP DATABASE IF EXISTS luxia;"
docker exec luxia-app psql -U postgres -c "CREATE DATABASE luxia;"
docker exec luxia-app npm --prefix /app/backend run migrate

# Local
psql -U postgres -c "DROP DATABASE IF EXISTS luxia;"
psql -U postgres -c "CREATE DATABASE luxia;"
cd backend && npm run migrate
```

## Testing

**Current State:** No testing framework configured.

**Recommended Setup:**

**Backend:**
- Framework: Vitest
- API testing: Supertest
- Database: Separate test database or in-memory PostgreSQL

**Frontend:**
- Framework: Vitest
- Component testing: Testing Library
- E2E testing: Playwright or Cypress

**Priority Test Areas:**
1. Authentication (JWT generation, validation)
2. Product CRUD operations
3. Order creation and inventory decrements
4. Cart functionality
5. CMS page rendering
6. Search functionality
7. Multilingual content fetching

## Known Issues & Technical Debt

### Critical

1. **Migration Strategy**: Multiple migration approaches exist. Need to consolidate to a single versioned system with tracking table.

2. **SQL Injection Risk**: Some dynamic queries may be vulnerable. Audit all services for proper parameterization.

3. **No Rate Limiting**: API endpoints lack rate limiting. Add `express-rate-limit` for production.

### Important

4. **Email/SMS Not Implemented**: Templates exist but no actual sending. Implement nodemailer for SMTP.

5. **No CSRF Protection**: Add CSRF tokens for state-changing operations.

6. **S3 Integration Incomplete**: S3 code exists but is disabled. Either implement fully or remove.

7. **No Admin Audit Log**: Track who changed what in admin panel.

### Enhancements

8. **No Database Backups**: Implement automated pg_dump to S3 or similar.

9. **No Monitoring**: Add Sentry for error tracking, structured logging with Winston/Pino.

10. **No CDN**: Images served directly from app server. Consider CloudFront or Cloudflare.

11. **Payment Gateway Missing**: Manual payment workflow only. Add Stripe or PayPal.

12. **Limited Analytics**: Add tracking for sales, popular products, user behavior.

## Security Considerations

**Implemented:**
- ✅ JWT authentication
- ✅ Bcrypt password hashing (10 rounds)
- ✅ CORS configuration
- ✅ Separate admin/customer auth
- ✅ File upload size limits (10MB)
- ✅ SQL parameterized queries (mostly)

**Needed:**
- ⚠️ Rate limiting on API endpoints
- ⚠️ CSRF protection for state-changing operations
- ⚠️ Strong JWT_SECRET enforcement (currently has weak fallback)
- ⚠️ Password complexity requirements
- ⚠️ Account lockout after failed login attempts
- ⚠️ HTTPS enforcement (relies on reverse proxy)
- ⚠️ Input sanitization beyond express-validator
- ⚠️ Content Security Policy (CSP) headers

## Performance Optimization

**Current:**
- ✅ PostgreSQL connection pooling (20 connections)
- ✅ React Query for API caching
- ✅ Automatic image optimization (WebP, 70-90% reduction)
- ✅ Nginx static file caching (30 days for uploads)
- ✅ Lazy loading of route components
- ✅ Database indexes on common queries

**Potential Improvements:**
- Redis for session storage and API caching
- CDN for static assets and images
- Database query optimization (explain analyze slow queries)
- Frontend bundle size reduction
- Service worker for offline support
- Progressive image loading (blur-up effect)
- Pagination on all list endpoints

## Project Metrics

- **Backend Services**: 16 modules
- **Backend Routes**: 14 routers
- **Frontend Pages**: 36 components
- **Frontend Components**: 56 reusable components
- **API Endpoints**: 60+ endpoints
- **Database Tables**: 30+ tables
- **Languages Supported**: 2 (English, Georgian) - extensible
- **CMS Block Types**: 10+ types

## Additional Resources

- **BUILD.md**: Detailed Docker deployment guide
- **IMAGE_OPTIMIZATION.md**: Image processing documentation
- **ADMIN_USER_SETUP.md**: Admin user configuration guide
- **README.md**: High-level project overview
- **docker/README.md**: Docker-specific documentation

## Support & Contribution

When working on this codebase:

1. **Follow TypeScript**: Use strict types, avoid `any`
2. **Service Layer**: Keep business logic in services, not routes
3. **Type Safety**: Share types between frontend and backend
4. **Parameterized Queries**: Always use `$1, $2` placeholders in SQL
5. **Error Handling**: Use try-catch, return meaningful error messages
6. **Logging**: Use `console.log` for info, `console.error` for errors
7. **Translations**: Add keys to translation files when adding UI strings
8. **Migrations**: Update `migrate.ts` when changing database schema
9. **Documentation**: Update this file when adding major features

---

**Last Updated**: January 2025 (PostgreSQL architecture with full CMS and multilingual support)
