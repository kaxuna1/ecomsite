# Zustand Workflows Reference

## Contents
- Migration from Context
- Testing Stores
- DevTools Integration
- Subscription Patterns

---

## Migration from Context

### Converting CartContext to Zustand

**Before (Context + useReducer):** 193 lines in `frontend/src/context/CartContext.tsx`
**After (Zustand):** ~60 lines

Copy this checklist and track progress:
- [ ] Step 1: Create store file at `src/stores/cartStore.ts`
- [ ] Step 2: Move state interface and actions to store
- [ ] Step 3: Replace `useContext(CartContext)` with `useCartStore(selector)`
- [ ] Step 4: Remove CartProvider from App.tsx
- [ ] Step 5: Delete old CartContext.tsx

### Step-by-Step Migration

```typescript
// Step 1-2: src/stores/cartStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Product, ProductVariant, PromoCode } from '../types/product';

interface CartItem {
  product: Product;
  variant?: ProductVariant;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  promoCode: PromoCode | null;
  discount: number;
  // Actions
  addItem: (product: Product, quantity?: number, variant?: ProductVariant) => void;
  removeItem: (productId: number, variantId?: number) => void;
  updateQuantity: (productId: number, quantity: number, variantId?: number) => void;
  applyPromoCode: (promoCode: PromoCode, discount: number) => void;
  removePromoCode: () => void;
  clear: () => void;
  // Computed (accessed via selectors)
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      promoCode: null,
      discount: 0,

      addItem: (product, quantity = 1, variant) =>
        set((state) => {
          const existing = state.items.find(
            (item) => item.product.id === product.id && item.variant?.id === variant?.id
          );
          if (existing) {
            return {
              items: state.items.map((item) =>
                item.product.id === product.id && item.variant?.id === variant?.id
                  ? { ...item, quantity: item.quantity + quantity }
                  : item
              ),
            };
          }
          return { items: [...state.items, { product, variant, quantity }] };
        }),

      removeItem: (productId, variantId) =>
        set((state) => ({
          items: state.items.filter(
            (item) => !(item.product.id === productId && item.variant?.id === variantId)
          ),
        })),

      updateQuantity: (productId, quantity, variantId) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.product.id === productId && item.variant?.id === variantId
              ? { ...item, quantity: Math.max(quantity, 1) }
              : item
          ),
        })),

      applyPromoCode: (promoCode, discount) => set({ promoCode, discount }),
      removePromoCode: () => set({ promoCode: null, discount: 0 }),
      clear: () => set({ items: [], promoCode: null, discount: 0 }),
    }),
    { name: 'luxia-cart' }
  )
);

// Selector for computed subtotal
export const selectSubtotal = (state: CartState) =>
  state.items.reduce((sum, item) => {
    const price = item.variant?.salePrice ?? item.variant?.price ?? 
                  item.product.salePrice ?? item.product.price;
    return sum + price * item.quantity;
  }, 0);

export const selectTotal = (state: CartState) =>
  Math.max(selectSubtotal(state) - state.discount, 0);
```

```typescript
// Step 3: Update component usage
// Before
import { useCart } from '../context/CartContext';
const { items, addItem, total } = useCart();

// After
import { useCartStore, selectTotal } from '../stores/cartStore';
const items = useCartStore((state) => state.items);
const addItem = useCartStore((state) => state.addItem);
const total = useCartStore(selectTotal);
```

```typescript
// Step 4: Remove provider from App.tsx
// Before
<CartProvider>
  <AuthProvider>
    <App />
  </AuthProvider>
</CartProvider>

// After - No wrapper needed!
<AuthProvider>
  <App />
</AuthProvider>
```

---

## Testing Stores

### Reset Store Between Tests

```typescript
// src/stores/cartStore.ts - Add reset for testing
const initialState = {
  items: [],
  promoCode: null,
  discount: 0,
};

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      ...initialState,
      // ... actions
      _reset: () => set(initialState), // Test helper
    }),
    { name: 'luxia-cart' }
  )
);
```

```typescript
// __tests__/cartStore.test.ts
import { useCartStore } from '../stores/cartStore';
import { act } from '@testing-library/react';

describe('cartStore', () => {
  beforeEach(() => {
    // Reset store before each test
    act(() => {
      useCartStore.getState()._reset();
    });
  });

  it('adds item to cart', () => {
    const product = { id: 1, name: 'Test', price: 10 };
    
    act(() => {
      useCartStore.getState().addItem(product, 2);
    });

    expect(useCartStore.getState().items).toHaveLength(1);
    expect(useCartStore.getState().items[0].quantity).toBe(2);
  });

  it('increments quantity for existing item', () => {
    const product = { id: 1, name: 'Test', price: 10 };
    
    act(() => {
      useCartStore.getState().addItem(product, 1);
      useCartStore.getState().addItem(product, 2);
    });

    expect(useCartStore.getState().items).toHaveLength(1);
    expect(useCartStore.getState().items[0].quantity).toBe(3);
  });
});
```

---

## DevTools Integration

### Enable Redux DevTools

```typescript
import { devtools } from 'zustand/middleware';

export const useCartStore = create<CartState>()(
  devtools(
    persist(
      (set) => ({ /* store */ }),
      { name: 'luxia-cart' }
    ),
    { 
      name: 'cart-store',
      enabled: process.env.NODE_ENV === 'development',
    }
  )
);
```

### Named Actions for Better Debugging

```typescript
export const useCartStore = create<CartState>()(
  devtools(
    (set) => ({
      items: [],
      addItem: (product) =>
        set(
          (state) => ({ items: [...state.items, { product, quantity: 1 }] }),
          false, // replace: false
          'cart/addItem' // action name in devtools
        ),
    }),
    { name: 'cart-store' }
  )
);
```

---

## Subscription Patterns

### React to State Changes Outside Components

```typescript
import { useCartStore } from '../stores/cartStore';

// Subscribe to cart changes for analytics
const unsubscribe = useCartStore.subscribe(
  (state) => state.items,
  (items, prevItems) => {
    if (items.length > prevItems.length) {
      analytics.track('item_added_to_cart', {
        itemCount: items.length,
      });
    }
  },
  { equalityFn: (a, b) => a.length === b.length }
);

// Later: unsubscribe()
```

### Sync with External Systems

```typescript
// Sync theme mode to document
useThemeStore.subscribe(
  (state) => state.mode,
  (mode) => {
    document.documentElement.setAttribute('data-theme', 
      mode === 'system' 
        ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
        : mode
    );
  },
  { fireImmediately: true }
);
```

---

## Integration with TanStack Query

### Syncing Auth State with Query Client

```typescript
// src/stores/authStore.ts
import { useQueryClient } from '@tanstack/react-query';

// In component that handles logout
function LogoutButton() {
  const queryClient = useQueryClient();
  const logout = useAuthStore((state) => state.userLogout);

  const handleLogout = () => {
    logout();
    // Clear all cached queries on logout
    queryClient.clear();
  };

  return <button onClick={handleLogout}>Logout</button>;
}
```

### Invalidate Queries on Store Change

```typescript
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../stores/authStore';

function AuthQuerySync() {
  const queryClient = useQueryClient();
  const userToken = useAuthStore((state) => state.userToken);

  useEffect(() => {
    // When user logs in/out, invalidate user-specific queries
    queryClient.invalidateQueries({ queryKey: ['favorites'] });
    queryClient.invalidateQueries({ queryKey: ['orders'] });
  }, [userToken, queryClient]);

  return null;
}
```