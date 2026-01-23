# State Management Reference

## Contents
- State Categories
- Context API Patterns
- Local State
- Server State
- Anti-Patterns

## State Categories

| Type | Solution | Example |
|------|----------|---------|
| Server State | React Query | Products, orders, reviews |
| Global Client State | Context API | Cart, auth, i18n, theme |
| Local UI State | useState | Modal open, form inputs |
| URL State | React Router | Filters, pagination, language |
| Persistent State | localStorage | Cart items, tokens, preferences |

## Context API Patterns

### CartContext - useReducer Pattern

```typescript
// frontend/src/context/CartContext.tsx
type CartAction =
  | { type: 'ADD_ITEM'; product: Product; quantity: number; variant?: ProductVariant }
  | { type: 'REMOVE_ITEM'; productId: number; variantId?: number }
  | { type: 'UPDATE_QUANTITY'; productId: number; quantity: number; variantId?: number }
  | { type: 'CLEAR' }
  | { type: 'LOAD_CART'; items: CartItem[] };

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existingIndex = state.items.findIndex(
        item => item.product.id === action.product.id &&
                item.variant?.id === action.variant?.id
      );
      if (existingIndex > -1) {
        const newItems = [...state.items];
        newItems[existingIndex].quantity += action.quantity;
        return { ...state, items: newItems };
      }
      return {
        ...state,
        items: [...state.items, { product: action.product, quantity: action.quantity, variant: action.variant }]
      };
    }
    case 'CLEAR':
      return { ...state, items: [] };
    // ... other cases
  }
}
```

### AuthContext - Dual Token Pattern

```typescript
// frontend/src/context/AuthContext.tsx
export function AuthProvider({ children }: { children: ReactNode }) {
  const [adminToken, setAdminToken] = useState<string | null>(
    () => localStorage.getItem(ADMIN_TOKEN_KEY)
  );
  const [userToken, setUserToken] = useState<string | null>(
    () => localStorage.getItem(USER_TOKEN_KEY)
  );
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Sync tokens to localStorage
  useEffect(() => {
    if (adminToken) localStorage.setItem(ADMIN_TOKEN_KEY, adminToken);
    else localStorage.removeItem(ADMIN_TOKEN_KEY);
  }, [adminToken]);

  // Fetch user on token change
  const refreshUser = useCallback(async () => {
    if (!userToken) {
      setUser(null);
      setIsLoading(false);
      return;
    }
    try {
      const userData = await authApi.getCurrentUser();
      setUser(userData);
    } catch {
      setUserToken(null);
    } finally {
      setIsLoading(false);
    }
  }, [userToken]);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  // ... provider value
}
```

### Consuming Context

```typescript
// Always use the custom hook
const { items, addItem, removeItem, subtotal, total } = useCart();
const { user, isAuthenticated, login, logout } = useAuth();
const { t, language, setLanguage } = useI18n();
const { theme, themeMode, setThemeMode } = useTheme();
```

## Derived State with useMemo

```typescript
// CartContext.tsx - computed values
const subtotal = useMemo(
  () => state.items.reduce((sum, item) => {
    const price = item.variant?.salePrice ?? item.variant?.price ?? 
                  item.product.salePrice ?? item.product.price;
    return sum + price * item.quantity;
  }, 0),
  [state.items]
);

const discount = useMemo(
  () => state.promoCode?.type === 'percentage'
    ? subtotal * (state.promoCode.value / 100)
    : state.promoCode?.value ?? 0,
  [subtotal, state.promoCode]
);

const total = useMemo(
  () => Math.max(0, subtotal - discount),
  [subtotal, discount]
);
```

## WARNING: State for Derived Values

**The Problem:**

```typescript
// BAD - unnecessary state, sync bugs
const [items, setItems] = useState([]);
const [total, setTotal] = useState(0);

useEffect(() => {
  setTotal(items.reduce((sum, item) => sum + item.price, 0));
}, [items]); // Extra render, can get out of sync
```

**Why This Breaks:**
1. Extra state variable to maintain
2. Extra render cycle from useEffect
3. Can get out of sync if effect doesn't run

**The Fix:**

```typescript
// GOOD - compute during render
const total = useMemo(
  () => items.reduce((sum, item) => sum + item.price, 0),
  [items]
);
// OR for simple calculations, just compute inline
const total = items.reduce((sum, item) => sum + item.price, 0);
```

## WARNING: Storing Server Data in useState

**The Problem:**

```typescript
// BAD - duplicates server state, gets stale
const [products, setProducts] = useState([]);

useEffect(() => {
  fetchProducts().then(setProducts);
}, []);

// Now you have TWO sources of truth
```

**The Fix:**

```typescript
// GOOD - React Query is the single source
const { data: products } = useQuery({
  queryKey: ['products'],
  queryFn: fetchProducts
});
// No useState needed!
```

See the **tanstack-query** skill.

## localStorage Persistence Pattern

```typescript
// Initialize from localStorage
const [token, setToken] = useState<string | null>(
  () => localStorage.getItem('auth-token')
);

// Sync changes to localStorage
useEffect(() => {
  if (token) {
    localStorage.setItem('auth-token', token);
  } else {
    localStorage.removeItem('auth-token');
  }
}, [token]);
```

## When to Use What

| Scenario | Solution |
|----------|----------|
| API data | React Query |
| Shopping cart | Context + useReducer + localStorage |
| Auth tokens | Context + localStorage |
| Form inputs | useState or React Hook Form |
| Modal open/close | useState |
| Selected tab | useState |
| URL filters | useSearchParams |
| Theme preference | Context + localStorage |

See the **zustand** skill for complex client state patterns.