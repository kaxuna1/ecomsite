# Zustand Patterns Reference

## Contents
- Store Structure Patterns
- Selector Patterns
- Middleware Patterns
- Anti-Patterns

---

## Store Structure Patterns

### Sliced Store (Recommended for Large Stores)

Split large stores into logical slices:

```typescript
// src/stores/authStore.ts
import { create } from 'zustand';
import { persist, devtools } from 'zustand/middleware';

interface AdminSlice {
  adminToken: string | null;
  adminLogin: (token: string) => void;
  adminLogout: () => void;
}

interface UserSlice {
  user: User | null;
  userToken: string | null;
  isLoading: boolean;
  userLogin: (payload: LoginPayload) => Promise<void>;
  userLogout: () => void;
}

type AuthState = AdminSlice & UserSlice;

const createAdminSlice = (set: any): AdminSlice => ({
  adminToken: null,
  adminLogin: (token) => {
    set({ adminToken: token });
    localStorage.setItem('luxia-admin-token', token);
  },
  adminLogout: () => {
    set({ adminToken: null });
    localStorage.removeItem('luxia-admin-token');
  },
});

const createUserSlice = (set: any, get: any): UserSlice => ({
  user: null,
  userToken: null,
  isLoading: false,
  userLogin: async (payload) => {
    set({ isLoading: true });
    try {
      const response = await authApi.login(payload);
      set({ user: response.user, userToken: response.token, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },
  userLogout: () => set({ user: null, userToken: null }),
});

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set, get) => ({
        ...createAdminSlice(set),
        ...createUserSlice(set, get),
      }),
      {
        name: 'luxia-auth',
        partialize: (state) => ({
          adminToken: state.adminToken,
          userToken: state.userToken,
        }),
      }
    ),
    { name: 'auth-store' }
  )
);
```

### Theme Store with System Preference Detection

```typescript
// src/stores/themeStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type ThemeMode = 'light' | 'dark' | 'system';
type SpacingPreset = 'compact' | 'normal' | 'spacious';

interface ThemeState {
  mode: ThemeMode;
  spacing: SpacingPreset;
  setMode: (mode: ThemeMode) => void;
  setSpacing: (spacing: SpacingPreset) => void;
  getEffectiveMode: () => 'light' | 'dark';
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      mode: 'system',
      spacing: 'normal',
      setMode: (mode) => set({ mode }),
      setSpacing: (spacing) => set({ spacing }),
      getEffectiveMode: () => {
        const { mode } = get();
        if (mode !== 'system') return mode;
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      },
    }),
    { name: 'luxia-theme' }
  )
);
```

---

## Selector Patterns

### WARNING: Selecting Entire State

**The Problem:**

```typescript
// BAD - Component re-renders on ANY state change
const state = useCartStore();
return <div>{state.items.length}</div>;
```

**Why This Breaks:**
1. Every state update triggers re-render, even unrelated changes
2. Defeats Zustand's automatic render optimization
3. Performance degrades as store grows

**The Fix:**

```typescript
// GOOD - Only re-renders when items change
const items = useCartStore((state) => state.items);
return <div>{items.length}</div>;
```

### Multiple Selectors with Shallow Equality

```typescript
import { useShallow } from 'zustand/react/shallow';

// GOOD - Compares object properties shallowly
const { items, promoCode, discount } = useCartStore(
  useShallow((state) => ({
    items: state.items,
    promoCode: state.promoCode,
    discount: state.discount,
  }))
);
```

---

## Middleware Patterns

### Combining Multiple Middleware

```typescript
import { create } from 'zustand';
import { devtools, persist, subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

export const useCartStore = create<CartState>()(
  devtools(
    persist(
      subscribeWithSelector(
        immer((set) => ({
          items: [],
          addItem: (product) =>
            set((state) => {
              // Immer allows direct mutation
              state.items.push({ product, quantity: 1 });
            }),
        }))
      ),
      { name: 'luxia-cart' }
    ),
    { name: 'cart-store' }
  )
);
```

### Persist with Custom Storage

```typescript
import { createJSONStorage, persist } from 'zustand/middleware';

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({ /* ... */ }),
    {
      name: 'luxia-auth',
      storage: createJSONStorage(() => sessionStorage), // Use sessionStorage
      partialize: (state) => ({ token: state.token }), // Only persist token
    }
  )
);
```

---

## Anti-Patterns

### WARNING: Storing Server State in Zustand

**The Problem:**

```typescript
// BAD - Duplicating server state management
const useProductStore = create((set) => ({
  products: [],
  isLoading: false,
  fetchProducts: async () => {
    set({ isLoading: true });
    const products = await api.getProducts();
    set({ products, isLoading: false });
  },
}));
```

**Why This Breaks:**
1. No automatic cache invalidation
2. No background refetching
3. No deduplication of requests
4. Stale data problems

**The Fix:**

```typescript
// GOOD - Use TanStack Query for server state
import { useQuery } from '@tanstack/react-query';

function ProductList() {
  const { data: products, isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: api.getProducts,
  });
}
```

**When You Might Be Tempted:**
When you want "global" access to API data. Instead, TanStack Query already caches globally - just call useQuery with the same key anywhere.

### WARNING: Actions That Don't Use set()

**The Problem:**

```typescript
// BAD - Direct mutation doesn't trigger re-render
const useStore = create((set) => ({
  items: [],
  addItem: (item) => {
    useStore.getState().items.push(item); // Silent mutation!
  },
}));
```

**Why This Breaks:**
1. Components never re-render
2. State appears unchanged in devtools
3. Persistence middleware doesn't detect change

**The Fix:**

```typescript
// GOOD - Always use set() for state changes
const useStore = create((set) => ({
  items: [],
  addItem: (item) => set((state) => ({ items: [...state.items, item] })),
}));
```