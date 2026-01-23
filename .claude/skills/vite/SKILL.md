---
name: vite
description: |
  Configures Vite 5.x build tool, dev server, and frontend asset optimization for the Luxia e-commerce platform.
  Use when: configuring builds, adding environment variables, optimizing bundle size, setting up testing, debugging HMR issues, or adding Vite plugins.
allowed-tools: Read, Edit, Write, Glob, Grep, Bash
---

# Vite Skill

This e-commerce frontend uses Vite 5.2 with React 18. The configuration prioritizes code splitting via lazy-loaded routes (41+ pages), theme-aware Tailwind CSS with CSS variables, and environment-based API proxy configuration.

## Quick Start

### Development Server

```bash
cd frontend
npm run dev     # http://localhost:5173 with HMR
npm run build   # tsc -b && vite build
npm run preview # Preview production build
```

### API Proxy (Development)

```typescript
// vite.config.ts
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true
      }
    }
  }
});
```

## Key Concepts

| Concept | Usage | Example |
|---------|-------|---------|
| Environment Variables | Prefix with `VITE_` | `import.meta.env.VITE_API_URL` |
| Dev Mode Detection | Built-in flag | `import.meta.env.DEV` |
| Lazy Loading | Route-based splitting | `lazy(() => import('./pages/X'))` |
| Proxy Config | Backend during dev | `/api` → `localhost:4000` |
| Production API | Relative path | `VITE_API_URL=/api` |

## Common Patterns

### Environment Variables with Fallbacks

```typescript
// src/api/client.ts
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api'
});
```

### Route-Based Code Splitting

```typescript
// src/App.tsx
const ProductsPage = lazy(() => import('./pages/ProductsPage'));

<Suspense fallback={<LoadingScreen />}>
  <Routes>{/* routes */}</Routes>
</Suspense>
```

## WARNING: Missing Testing Framework

**Detected:** No Vitest in `frontend/package.json`

```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom
```

## See Also

- [config](references/config.md) - Configuration patterns
- [environment](references/environment.md) - Environment variables
- [optimization](references/optimization.md) - Build optimization
- [testing](references/testing.md) - Vitest setup

## Related Skills

- See the **react** skill for component patterns
- See the **typescript** skill for type configuration
- See the **tailwind** skill for styling integration
- See the **playwright** skill for E2E testing