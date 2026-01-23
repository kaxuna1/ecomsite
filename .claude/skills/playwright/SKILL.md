---
name: playwright
description: |
  Playwright E2E testing for Luxia e-commerce platform. Builds tests for checkout flows, cart operations, authentication, CMS pages, and multilingual routing.
  Use when: Writing E2E tests, debugging test failures, testing payment flows, checkout sessions, cart operations, user authentication, or admin panel functionality.
allowed-tools: Read, Edit, Write, Glob, Grep, Bash
---

# Playwright Skill

E2E testing framework for the Luxia e-commerce platform. Tests critical user journeys including product browsing, cart management, checkout flows, user authentication, and admin operations. All tests run against the full stack (Vite frontend + Express backend + PostgreSQL).

## Quick Start

### Basic Test Structure

```typescript
// e2e/checkout.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Checkout Flow', () => {
  test('completes checkout as guest', async ({ page }) => {
    await page.goto('/en/products');
    await page.click('[data-testid="product-card"]');
    await page.click('[data-testid="add-to-cart"]');
    await page.goto('/en/cart');
    await page.click('[data-testid="checkout-button"]');
    
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="name"]', 'Test User');
    await page.click('[data-testid="submit-order"]');
    
    await expect(page.locator('[data-testid="order-confirmation"]')).toBeVisible();
  });
});
```

### Page Object Model

```typescript
// e2e/pages/CartPage.ts
import { Page, Locator } from '@playwright/test';

export class CartPage {
  readonly page: Page;
  readonly cartItems: Locator;
  readonly checkoutButton: Locator;
  readonly emptyCartMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.cartItems = page.locator('[data-testid="cart-item"]');
    this.checkoutButton = page.locator('[data-testid="checkout-button"]');
    this.emptyCartMessage = page.locator('[data-testid="empty-cart"]');
  }

  async goto(lang = 'en') {
    await this.page.goto(`/${lang}/cart`);
  }

  async getItemCount(): Promise<number> {
    return this.cartItems.count();
  }

  async proceedToCheckout() {
    await this.checkoutButton.click();
  }
}
```

## Key Concepts

| Concept | Usage | Example |
|---------|-------|---------|
| Language routing | All public routes use `/:lang/` prefix | `page.goto('/en/products')` |
| Data attributes | Use `data-testid` for stable selectors | `[data-testid="add-to-cart"]` |
| Auth state | Admin and customer use separate JWT flows | `storageState` for session reuse |
| API mocking | Mock payment/external APIs in tests | `page.route('/api/orders', ...)` |
| Visual testing | Snapshot comparisons for CMS pages | `expect(page).toHaveScreenshot()` |

## Common Patterns

### Authenticated User Tests

```typescript
// e2e/auth.setup.ts
import { test as setup } from '@playwright/test';

setup('authenticate customer', async ({ page }) => {
  await page.goto('/en/login');
  await page.fill('[name="email"]', 'customer@test.com');
  await page.fill('[name="password"]', 'TestPassword123');
  await page.click('[type="submit"]');
  await page.waitForURL('/en/');
  await page.context().storageState({ path: 'e2e/.auth/customer.json' });
});
```

### Testing Multilingual Content

```typescript
test('displays content in Georgian', async ({ page }) => {
  await page.goto('/ka/products');
  const heading = page.locator('h1');
  // Verify Georgian text renders correctly
  await expect(heading).toContainText('პროდუქტები');
});
```

## See Also

- [patterns](references/patterns.md) - Test patterns, selectors, assertions
- [workflows](references/workflows.md) - CI setup, debugging, parallel execution

## Related Skills

- See the **vite** skill for dev server configuration
- See the **typescript** skill for type-safe test utilities
- See the **jest** skill for unit testing patterns
- See the **postgresql** skill for test database seeding