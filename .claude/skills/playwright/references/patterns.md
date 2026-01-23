# Playwright Patterns Reference

## Contents
- Selector Strategies
- Page Object Model
- Test Data Management
- API Mocking
- Visual Testing
- Anti-Patterns

## Selector Strategies

### WARNING: Fragile Selectors

**The Problem:**

```typescript
// BAD - Breaks when CSS changes
await page.click('.btn-primary.mt-4.px-6');

// BAD - Breaks when text changes or i18n applied
await page.click('text=Add to Cart');
```

**Why This Breaks:**
1. CSS class names change during refactors
2. Text content changes with translations
3. Structural selectors break with layout changes

**The Fix:**

```typescript
// GOOD - Stable test IDs
await page.click('[data-testid="add-to-cart"]');

// GOOD - Role-based for accessibility
await page.getByRole('button', { name: /add to cart/i });
```

### Selector Priority

| Priority | Selector Type | Example | When to Use |
|----------|--------------|---------|-------------|
| 1 | data-testid | `[data-testid="checkout"]` | Always preferred |
| 2 | ARIA role | `getByRole('button')` | Interactive elements |
| 3 | Label text | `getByLabel('Email')` | Form fields |
| 4 | Placeholder | `getByPlaceholder('Search')` | Search inputs |
| 5 | CSS/XPath | `.product-card` | Last resort only |

## Page Object Model

### Cart Page Object

```typescript
// e2e/pages/CartPage.ts
import { Page, Locator, expect } from '@playwright/test';

export class CartPage {
  readonly page: Page;
  readonly items: Locator;
  readonly totalPrice: Locator;
  readonly promoInput: Locator;
  readonly applyPromoButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.items = page.locator('[data-testid="cart-item"]');
    this.totalPrice = page.locator('[data-testid="cart-total"]');
    this.promoInput = page.locator('[data-testid="promo-input"]');
    this.applyPromoButton = page.locator('[data-testid="apply-promo"]');
  }

  async goto(lang = 'en') {
    await this.page.goto(`/${lang}/cart`);
    await this.page.waitForLoadState('networkidle');
  }

  async applyPromoCode(code: string) {
    await this.promoInput.fill(code);
    await this.applyPromoButton.click();
    await this.page.waitForResponse('/api/promo-codes/validate');
  }

  async expectTotal(amount: string) {
    await expect(this.totalPrice).toContainText(amount);
  }

  async updateQuantity(itemIndex: number, quantity: number) {
    const item = this.items.nth(itemIndex);
    await item.locator('[data-testid="quantity-input"]').fill(String(quantity));
    await this.page.waitForResponse('/api/cart');
  }
}
```

### Checkout Page Object

```typescript
// e2e/pages/CheckoutPage.ts
export class CheckoutPage {
  readonly page: Page;
  
  constructor(page: Page) {
    this.page = page;
  }

  async fillCustomerInfo(data: { name: string; email: string; phone: string }) {
    await this.page.fill('[name="name"]', data.name);
    await this.page.fill('[name="email"]', data.email);
    await this.page.fill('[name="phone"]', data.phone);
  }

  async selectSavedAddress(index = 0) {
    await this.page.click(`[data-testid="saved-address-${index}"]`);
  }

  async submitOrder() {
    await this.page.click('[data-testid="submit-order"]');
    return this.page.waitForResponse('/api/orders');
  }
}
```

## Test Data Management

### Database Seeding

```typescript
// e2e/fixtures/seed.ts
import { Pool } from 'pg';

export async function seedTestData(pool: Pool) {
  await pool.query(`
    INSERT INTO products (name, price, inventory, slug)
    VALUES ('Test Product', 29.99, 100, 'test-product')
    ON CONFLICT (slug) DO NOTHING
  `);
  
  await pool.query(`
    INSERT INTO promo_codes (code, type, value, is_active)
    VALUES ('TEST10', 'percentage', 10, true)
    ON CONFLICT (code) DO NOTHING
  `);
}
```

### Test Fixtures

```typescript
// e2e/fixtures/test-data.ts
import { test as base } from '@playwright/test';
import { CartPage } from '../pages/CartPage';
import { CheckoutPage } from '../pages/CheckoutPage';

type Fixtures = {
  cartPage: CartPage;
  checkoutPage: CheckoutPage;
};

export const test = base.extend<Fixtures>({
  cartPage: async ({ page }, use) => {
    await use(new CartPage(page));
  },
  checkoutPage: async ({ page }, use) => {
    await use(new CheckoutPage(page));
  },
});

export { expect } from '@playwright/test';
```

## API Mocking

### Mock Order Creation

```typescript
test('handles order creation failure gracefully', async ({ page }) => {
  await page.route('/api/orders', (route) => {
    route.fulfill({
      status: 400,
      body: JSON.stringify({ error: 'Insufficient inventory' }),
    });
  });

  // Proceed through checkout
  await page.goto('/en/checkout');
  await page.click('[data-testid="submit-order"]');
  
  await expect(page.locator('[data-testid="error-message"]'))
    .toContainText('Insufficient inventory');
});
```

### Intercept and Modify Response

```typescript
test('displays products with modified prices', async ({ page }) => {
  await page.route('/api/products*', async (route) => {
    const response = await route.fetch();
    const json = await response.json();
    json.products = json.products.map((p: any) => ({
      ...p,
      price: p.price * 0.9, // Apply 10% discount
    }));
    route.fulfill({ response, json });
  });

  await page.goto('/en/products');
});
```

## Visual Testing

### CMS Page Snapshots

```typescript
test('homepage hero matches snapshot', async ({ page }) => {
  await page.goto('/en/');
  await page.waitForLoadState('networkidle');
  
  const hero = page.locator('[data-testid="hero-block"]');
  await expect(hero).toHaveScreenshot('homepage-hero.png', {
    maxDiffPixels: 100,
  });
});
```

## Anti-Patterns

### WARNING: Hardcoded Waits

**The Problem:**

```typescript
// BAD - Flaky, slow tests
await page.click('[data-testid="submit"]');
await page.waitForTimeout(3000);
await expect(page.locator('.success')).toBeVisible();
```

**The Fix:**

```typescript
// GOOD - Wait for specific conditions
await page.click('[data-testid="submit"]');
await page.waitForResponse('/api/orders');
await expect(page.locator('[data-testid="success"]')).toBeVisible();
```

### WARNING: Test Interdependence

**The Problem:**

```typescript
// BAD - Test 2 depends on Test 1's state
test('add product to cart', async ({ page }) => { /* ... */ });
test('checkout with cart items', async ({ page }) => { /* assumes cart has items */ });
```

**The Fix:**

```typescript
// GOOD - Each test sets up its own state
test('checkout with cart items', async ({ page }) => {
  // Setup: Add item to cart via API
  await page.request.post('/api/cart', { data: { productId: 1 } });
  await page.goto('/en/checkout');
  // Test checkout
});