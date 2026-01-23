# Playwright Workflows Reference

## Contents
- Project Setup
- Running Tests
- CI/CD Integration
- Debugging Failures
- Parallel Execution
- Authentication Flows

## Project Setup

### Configuration

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html', { open: 'never' }],
    ['json', { outputFile: 'test-results/results.json' }],
  ],
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'setup', testMatch: /.*\.setup\.ts/ },
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['setup'],
    },
    {
      name: 'mobile',
      use: { ...devices['iPhone 13'] },
      dependencies: ['setup'],
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    cwd: '../frontend',
  },
});
```

### Directory Structure

```
e2e/
├── fixtures/
│   ├── seed.ts          # Database seeding
│   └── test-data.ts     # Custom fixtures
├── pages/
│   ├── CartPage.ts      # Cart page object
│   ├── CheckoutPage.ts  # Checkout page object
│   └── ProductPage.ts   # Product page object
├── tests/
│   ├── auth.spec.ts     # Authentication tests
│   ├── cart.spec.ts     # Cart functionality
│   ├── checkout.spec.ts # Checkout flow
│   └── cms.spec.ts      # CMS page tests
├── auth.setup.ts        # Auth setup
└── global-setup.ts      # Global setup
```

## Running Tests

### Development Workflow

```bash
# Run all tests
npx playwright test

# Run specific test file
npx playwright test e2e/tests/checkout.spec.ts

# Run tests with UI mode (debugging)
npx playwright test --ui

# Run tests in headed mode
npx playwright test --headed

# Run specific test by name
npx playwright test -g "completes checkout"

# Update snapshots
npx playwright test --update-snapshots
```

### Test Workflow Checklist

Copy this checklist and track progress:
- [ ] Step 1: Start backend server (`cd backend && npm run dev`)
- [ ] Step 2: Start frontend server (`cd frontend && npm run dev`)
- [ ] Step 3: Run database migrations (`npm run migrate`)
- [ ] Step 4: Seed test data (`npm run seed:test`)
- [ ] Step 5: Run tests (`npx playwright test`)
- [ ] Step 6: Review HTML report (`npx playwright show-report`)

## CI/CD Integration

### GitHub Actions

```yaml
# .github/workflows/e2e.yml
name: E2E Tests

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_DB: luxia_test
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: postgres
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v4
      
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
      
      - name: Install dependencies
        run: |
          cd backend && npm ci
          cd ../frontend && npm ci
          npx playwright install --with-deps
      
      - name: Setup database
        run: cd backend && npm run migrate
        env:
          DB_HOST: localhost
          DB_NAME: luxia_test
          DB_USER: postgres
          DB_PASSWORD: postgres
      
      - name: Run E2E tests
        run: npx playwright test
        env:
          CI: true
      
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
```

## Debugging Failures

### Trace Viewer

```typescript
// Enable traces in config
use: {
  trace: 'on-first-retry', // or 'on' for all tests
}

// View trace after failure
// npx playwright show-trace test-results/trace.zip
```

### Debug Mode

```typescript
test('debug checkout flow', async ({ page }) => {
  await page.goto('/en/cart');
  
  // Pause execution for manual inspection
  await page.pause();
  
  // Continue test
  await page.click('[data-testid="checkout"]');
});
```

### Console Logging

```typescript
test('log network requests', async ({ page }) => {
  page.on('request', (request) => {
    if (request.url().includes('/api/')) {
      console.log('API Request:', request.method(), request.url());
    }
  });

  page.on('response', (response) => {
    if (response.url().includes('/api/')) {
      console.log('API Response:', response.status(), response.url());
    }
  });

  await page.goto('/en/checkout');
});
```

### Debug Iteration Pattern

1. Run failing test with traces: `npx playwright test --trace on`
2. Open trace viewer: `npx playwright show-trace`
3. Identify failure point in timeline
4. Add debug logging or `page.pause()`
5. Fix selector or timing issue
6. Re-run test to verify
7. Only proceed when test passes consistently

## Parallel Execution

### Sharding for CI

```bash
# Split tests across multiple CI jobs
npx playwright test --shard=1/4
npx playwright test --shard=2/4
npx playwright test --shard=3/4
npx playwright test --shard=4/4
```

### Worker Configuration

```typescript
// playwright.config.ts
export default defineConfig({
  // Parallel tests within files
  fullyParallel: true,
  
  // Number of parallel workers
  workers: process.env.CI ? 4 : undefined,
  
  // Isolate tests that modify shared state
  projects: [
    {
      name: 'isolated',
      testMatch: /.*\.isolated\.spec\.ts/,
      fullyParallel: false,
    },
  ],
});
```

## Authentication Flows

### Customer Authentication Setup

```typescript
// e2e/auth.setup.ts
import { test as setup, expect } from '@playwright/test';

const CUSTOMER_FILE = 'e2e/.auth/customer.json';

setup('authenticate as customer', async ({ page }) => {
  await page.goto('/en/login');
  await page.fill('[name="email"]', process.env.TEST_CUSTOMER_EMAIL!);
  await page.fill('[name="password"]', process.env.TEST_CUSTOMER_PASSWORD!);
  await page.click('[type="submit"]');
  
  await expect(page).toHaveURL('/en/');
  await page.context().storageState({ path: CUSTOMER_FILE });
});
```

### Admin Authentication Setup

```typescript
// e2e/admin-auth.setup.ts
import { test as setup, expect } from '@playwright/test';

const ADMIN_FILE = 'e2e/.auth/admin.json';

setup('authenticate as admin', async ({ page }) => {
  await page.goto('/admin/login');
  await page.fill('[name="email"]', process.env.TEST_ADMIN_EMAIL!);
  await page.fill('[name="password"]', process.env.TEST_ADMIN_PASSWORD!);
  await page.click('[type="submit"]');
  
  await expect(page).toHaveURL('/admin/dashboard');
  await page.context().storageState({ path: ADMIN_FILE });
});
```

### Using Auth State

```typescript
// e2e/tests/account.spec.ts
import { test, expect } from '@playwright/test';

test.use({ storageState: 'e2e/.auth/customer.json' });

test('displays order history', async ({ page }) => {
  await page.goto('/en/account/orders');
  await expect(page.locator('[data-testid="order-list"]')).toBeVisible();
});
```

### Test Isolation with Fresh Auth

```typescript
test.describe('fresh login tests', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('shows login page for protected route', async ({ page }) => {
    await page.goto('/en/account');
    await expect(page).toHaveURL(/\/login/);
  });
});