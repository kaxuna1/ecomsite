# Luxia Rituals Commerce Stack

Luxia Rituals is a luxury scalp and hair-care storefront with a full-stack TypeScript implementation. The project includes a Vite + React frontend optimized for mobile-first shopping experiences and an Express + PostgreSQL backend that powers products, orders, and manual payment workflows.

## Project layout

```
frontend/   # Vite + React + Tailwind storefront & admin UI
backend/    # Express API, PostgreSQL persistence, notification utilities
```

## Frontend (Vite + React)

- Mobile-first design with Tailwind CSS, semantic HTML, and accessible components.
- Storefront pages: home, product listing, product detail, cart, and checkout.
- Admin dashboard (`/admin`) to manage products and monitor orders after authentication.
- API communication handled through Axios with React Query caching.

### Commands

```bash
cd frontend
npm install
npm run dev        # start Vite dev server on http://localhost:5173
npm run build      # build production assets
npm run preview    # preview the production build
npm run lint       # run ESLint on TypeScript source
```

Create a `.env` file in `frontend/` as needed. The app defaults to `http://localhost:4000/api` for API requests:

```
VITE_API_URL=http://localhost:4000/api
```

## Backend (Express + PostgreSQL + S3)

- REST endpoints for products (`/api/products`), orders (`/api/orders`), and authentication (`/api/auth`).
- PostgreSQL persistence powered by the official `pg` driver; automatic migrations create tables on first run.
- Product image uploads streamed directly to S3-compatible object storage and served via their public URLs.
- Manual payment friendly workflow with email/SMS notifications prompting the customer to follow offline instructions.
- Admin authentication via JWT with configurable credentials.

### Commands

```bash
cd backend
npm install
npm run migrate    # create/update PostgreSQL tables
npm run dev        # start API with hot reload
npm run build      # type-check and emit dist/
npm start          # run compiled server (runs migrations + seeds default admin)
```

Copy `.env.example` to `.env` and adjust values as needed. The backend requires a PostgreSQL connection string plus S3 configuration for product media. On startup the API guarantees an admin user (`sa` / `123456`) exists—change the password immediately in production by updating the `admin_users` table.

> **Tip:** If you serve images from a CDN or custom S3 endpoint, set `S3_PUBLIC_URL` so product responses include the fully qualified URL you expect the storefront to render.

### API overview

| Method & Path              | Description                                      | Auth required |
|---------------------------|--------------------------------------------------|---------------|
| `POST /api/auth/login`    | Exchange admin credentials for a JWT (username/password) | No      |
| `GET /api/products`       | List published products                          | No            |
| `GET /api/products/:id`   | Retrieve a single product                        | No            |
| `POST /api/products`      | Create product with multipart form (image upload)| Yes           |
| `PUT /api/products/:id`   | Update product metadata and optional image       | Yes           |
| `DELETE /api/products/:id`| Remove a product and its media                   | Yes           |
| `POST /api/orders`        | Create a new order with cart + customer details  | No            |
| `GET /api/orders`         | List orders for manual payment processing        | Yes           |
| `PATCH /api/orders/:id`   | Update order status (`pending`, `paid`, `fulfilled`)| Yes       |

## Deployment

1. **Install dependencies** on the target host (Node.js 18+ recommended).
2. **Configure environment** variables (`backend/.env`). Provide SMTP and SMS settings for production notifications.
3. **Provision storage**: ensure a PostgreSQL database and S3-compatible bucket exist. Grant credentials to the backend runtime.
4. **Run migrations**: `npm run migrate` in `backend/` once per environment.
5. **Start backend**: `npm run start` (or run through a process manager like PM2/systemd). Ensure port `PORT` is exposed.
6. **Build frontend**: `npm run build` inside `frontend/`. Serve the `frontend/dist` folder via a static host (e.g., Nginx, Vercel, or S3/CloudFront).
7. **Configure reverse proxy** so the frontend can reach the backend API (`/api`). Product images are hosted from your S3 bucket/CDN, so no local static directory exposure is required.

For containerized deployments, build two images (frontend static assets, backend API) or leverage a monorepo workflow that serves `frontend/dist` from the backend by copying files into a CDN/static bucket.

## Operations guide for manual payments

1. **Order intake**
   - Customer submits checkout form; backend creates an order with status `pending` and sends email/SMS instructions.
   - Admin visits `/admin/orders` to review new entries, including cart contents, totals, and customer contact details.

2. **Manual payment verification**
   - Offline payment is received (bank transfer, invoice, etc.).
   - Admin confirms funds and updates status via dashboard buttons (Pending → Paid → Fulfilled). Each update triggers `PATCH /api/orders/:id`.

3. **Inventory updates**
   - Product inventory automatically decrements when orders are created.
   - If stock needs adjustment (returns, cancellations), update inventory via `/admin/products`.

4. **Customer communications**
   - Email/SMS templates reside in `backend/src/utils/notifications.ts`. Customize copy as needed.
   - Configure SMTP credentials for production email delivery and optionally integrate with an SMS provider via webhook/API key.

5. **Security**
   - Rotate `JWT_SECRET` and admin password regularly. Store secrets securely (environment manager, secret store).
   - Enable HTTPS at the proxy/CDN layer and restrict admin access via VPN/IP allow-listing when possible.

## Seed data (optional)

Use the admin dashboard to upload initial products. Ensure the configured S3 bucket is writable by the backend IAM/user credentials.

## Testing notes

- Frontend linting and React Query ensure lightweight runtime validation.
- Backend relies on TypeScript types and runtime validation via `express-validator`.
- Add your preferred testing framework (Vitest/Jest) as needed for future iterations.

## License

This project is provided as a reference implementation and does not include a formal license.
