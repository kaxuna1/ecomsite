---
name: zustand
description: |
  Zustand lightweight state management with persistence and middleware.
  Use when: managing client-side state (cart, auth, UI preferences), replacing React Context with simpler API, accessing state outside React components, implementing localStorage persistence
allowed-tools: Read, Edit, Write, Glob, Grep, Bash
---

# Zustand Skill

Lightweight state management that replaces verbose Context + useReducer patterns with minimal boilerplate. Zustand stores are plain objects with actions - no providers, reducers, or action types needed.

## WARNING: Missing Professional State Management

**Detected:** No zustand in frontend/package.json - currently using React Context
**Impact:** Verbose boilerplate, provider hell, can't access state outside React

### Install

```bash
cd frontend && npm install zustand
```

## Quick Start

### Basic Store

```typescript
// src/stores/cartStore.ts
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
  addItem: (product: Product, quantity?: number, variant?: ProductVariant) => void;
  removeItem: (productId: number, variantId?: number) => void;
  updateQuantity: (productId: number, quantity: number, variantId?: number) => void;
  applyPromoCode: (promoCode: PromoCode, discount: number) => void;
  clear: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      promoCode: null,
      discount: 0,

      addItem: (product, quantity = 1, variant) => set((state) => {
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

      removeItem: (productId, variantId) => set((state) => ({
        items: state.items.filter(
          (item) => !(item.product.id === productId && item.variant?.id === variantId)
        ),
      })),

      updateQuantity: (productId, quantity, variantId) => set((state) => ({
        items: state.items.map((item) =>
          item.product.id === productId && item.variant?.id === variantId
            ? { ...item, quantity: Math.max(quantity, 1) }
            : item
        ),
      })),

      applyPromoCode: (promoCode, discount) => set({ promoCode, discount }),

      clear: () => set({ items: [], promoCode: null, discount: 0 }),
    }),
    { name: 'luxia-cart' }
  )
);
```

### Using in Components

```typescript
// Direct selector - only re-renders when items change
const items = useCartStore((state) => state.items);
const addItem = useCartStore((state) => state.addItem);

// Multiple selectors with shallow equality
import { useShallow } from 'zustand/react/shallow';
const { items, total } = useCartStore(
  useShallow((state) => ({ items: state.items, total: state.total }))
);
```

## Key Concepts

| Concept | Usage | Example |
|---------|-------|---------|
| Store creation | `create<Type>()((set, get) => ({}))` | State + actions in one object |
| Selectors | `useStore(state => state.field)` | Prevents unnecessary re-renders |
| Persistence | `persist(store, { name: 'key' })` | Auto localStorage sync |
| Outside React | `useStore.getState()` | Access in API clients, utils |
| Computed values | Derive in selector or store | `get().items.reduce(...)` |

## Common Patterns

### Computed Values (Derived State)

```typescript
// Option 1: Compute in selector (recommended for simple derivations)
const subtotal = useCartStore((state) =>
  state.items.reduce((sum, item) => {
    const price = item.variant?.price ?? item.product.price;
    return sum + price * item.quantity;
  }, 0)
);

// Option 2: Add getter to store (for complex/reused derivations)
export const useCartStore = create<CartState>()((set, get) => ({
  items: [],
  getSubtotal: () => get().items.reduce((sum, item) => {
    const price = item.variant?.price ?? item.product.price;
    return sum + price * item.quantity;
  }, 0),
}));
```

### Access Outside React

```typescript
// src/api/client.ts - Attach auth token to requests
import { useAuthStore } from '../stores/authStore';

export const apiClient = axios.create({ baseURL: '/api' });

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

## See Also

- [patterns](references/patterns.md)
- [workflows](references/workflows.md)

## Related Skills

For server state (API data), see the **tanstack-query** skill - NEVER use Zustand for server state.
For form state, see the **react-hook-form** skill.
For component patterns, see the **react** skill.
For type definitions, see the **typescript** skill.