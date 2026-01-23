# AGENT.md

Guidance for coding agents working in this repository.

## Project Summary

Luxia Products is a full-stack TypeScript e-commerce platform for luxury scalp and hair-care products. It includes a CMS, multilingual support, advanced product management, and a modern admin dashboard.

## Stack

- Frontend: Vite + React 18 + TypeScript + Tailwind CSS
- Backend: Express + TypeScript API
- Database: PostgreSQL 14 (pg connection pool)
- Auth: JWT for admin and customer users
- i18n: i18next with URL-based language routing (/:lang/)
- Image processing: Sharp, auto-converts uploads to WebP
- Deployment: Docker single-container (PostgreSQL + Nginx + Supervisor)
- AI providers: OpenAI, Anthropic, Gemini (Google Gen AI SDK)

## Commands

### Backend
```bash
cd backend
npm install
npm run migrate
npm run dev
npm run build
npm start
npm run seed
```

### Frontend
```bash
cd frontend
npm install
npm run dev
npm run build
npm run preview
npm run lint
```

### Docker
```bash
docker-compose up -d
```

## Repo Map

- Backend entry: `backend/src/server.ts` -> `backend/src/app.ts`
- DB client: `backend/src/db/client.ts`
- Migrations: `backend/src/scripts/migrate.ts` (single file DDL)
- Routes: `backend/src/routes/`
- Services: `backend/src/services/`
- AI module: `backend/src/ai/`
- Frontend entry: `frontend/src/main.tsx` -> `frontend/src/App.tsx`
- Pages: `frontend/src/pages/`
- Components: `frontend/src/components/`
- API clients: `frontend/src/api/`
- Context providers: `frontend/src/context/`
- i18n: `frontend/src/i18n/` + `frontend/public/locales/`

## Architecture Notes

- Backend uses a service layer; keep routes thin and push business logic into services.
- Frontend uses React Context for global state and React Query for server state.
- i18n uses URL prefix `/:lang/` and `?lang=en` query param for API content.
- Uploads go through multer memory storage, then Sharp converts to WebP.

## Database

- PostgreSQL connection pool in `backend/src/db/client.ts`.
- Schema is managed in `backend/src/scripts/migrate.ts`.
- Always use parameterized SQL queries.
- Translation data lives in separate translation tables (products, cms pages, navigation, etc).

## Environment

Backend `.env` required:
- DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD
- JWT_SECRET
- ADMIN_EMAIL, ADMIN_PASSWORD_HASH
- PORT, NODE_ENV

Optional: SMTP, SMS, ENCRYPTION_KEY for API keys, S3 (currently disabled).
AI keys are stored in the API Keys admin UI (e.g., `openai_api_key`, `anthropic_api_key`, `gemini_api_key`).

Frontend `.env`:
- VITE_API_URL (dev: http://localhost:4000/api, prod: /api)

## Auth

- Admin login: POST `/api/auth/login`
- Customer login: POST `/api/user/auth/login`
- JWT stored in localStorage; Axios adds Authorization header
- Default admin (if not configured): admin@luxia.local / LuxiaAdmin2024!

## Conventions

- Components/pages: PascalCase
- Hooks: camelCase with `use` prefix
- Services: camelCase + Service suffix
- Routes: camelCase + Routes suffix
- DB columns: snake_case
- Import order: external packages, internal types, components, hooks/utils, styles

## Operational Notes

- Uploads stored under `backend/uploads/` (product-images, cms, logo).
- Nginx proxies `/api` to backend and serves `/uploads` as static.

## Known Issues / Risks

- Rate limiting is not applied to all endpoints.
- No CSRF protection for state-changing requests.
- Migration strategy is single-file; consider versioned migrations.
- Some dynamic queries may need audit for SQL injection risk.

## Testing

No test framework is configured. If adding tests, prefer:
- Backend: Vitest + Supertest
- Frontend: Vitest + Testing Library
- E2E: Playwright or Cypress

## Docs

See `README.md`, `BUILD.md`, `IMAGE_OPTIMIZATION.md`, `ADMIN_USER_SETUP.md`, and `docker/README.md`.

## When Editing

- Keep business logic in services.
- Update translation files when adding UI strings.
- Update `backend/src/scripts/migrate.ts` for schema changes.
- Update documentation when adding major features.
