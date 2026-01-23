# Hooks Reference

## Contents
- Custom Hooks
- Hook Patterns
- Anti-Patterns
- Testing Hooks

## Custom Hooks

### useAutoSave

Debounced localStorage draft saving for forms. Located at `frontend/src/hooks/useAutoSave.ts`.

```typescript
const { status, loadDraft, clearDraft } = useAutoSave({
  watch,           // from useForm
  getValues,       // from useForm
  storageKey: `product-draft-${id}`,
  enabled: true,
  debounceMs: 2000,
  isDirty
});

// Display auto-save status
{status.isSaving && <span>Saving draft...</span>}
{status.lastSaved && <span>Last saved: {status.lastSaved.toLocaleTimeString()}</span>}
```

### useDebounce

Generic value debouncing for search inputs.

```typescript
// frontend/src/hooks/useDebounce.ts
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  
  return debouncedValue;
}

// Usage in search
const [search, setSearch] = useState('');
const debouncedSearch = useDebounce(search, 300);

const { data } = useQuery({
  queryKey: ['products', debouncedSearch],
  queryFn: () => fetchProducts({ search: debouncedSearch })
});
```

### useLocalizedPath

Language-prefixed route generation for i18n.

```typescript
const localizedPath = useLocalizedPath();
// In /en context: localizedPath('/products') → '/en/products'
// In /ka context: localizedPath('/products') → '/ka/products'
```

## Hook Patterns

### Context Consumer Hooks

Every context exports a custom hook for type-safe access:

```typescript
// GOOD - Use the custom hook
const { items, addItem, removeItem } = useCart();
const { user, isAuthenticated, logout } = useAuth();
const { t, language, setLanguage } = useI18n();

// BAD - Direct context consumption
const context = useContext(CartContext); // No type inference
```

### useCallback for Event Handlers

```typescript
// AuthContext.tsx - memoized refresh function
const refreshUser = useCallback(async () => {
  if (!userToken) {
    setUser(null);
    return;
  }
  try {
    const userData = await authApi.getCurrentUser();
    setUser(userData);
  } catch {
    setUserToken(null);
    localStorage.removeItem(USER_TOKEN_KEY);
  }
}, [userToken]);
```

### useRef for Non-Reactive State

```typescript
// VariantSelector.tsx - prevent duplicate auto-selection
const hasAutoSelectedRef = useRef(false);

useEffect(() => {
  if (variants.length > 0 && !hasAutoSelectedRef.current) {
    hasAutoSelectedRef.current = true;
    const defaultVariant = variants.find(v => v.isDefault) || variants[0];
    setSelectedVariant(defaultVariant);
  }
}, [variants]);
```

## WARNING: Missing Dependency Array Items

**The Problem:**

```typescript
// BAD - stale closure, userToken is captured once
const refreshUser = useCallback(async () => {
  const userData = await fetchUser(userToken); // userToken is stale
  setUser(userData);
}, []); // Missing userToken
```

**Why This Breaks:**
1. `userToken` captures initial value, never updates
2. User login/logout won't trigger new fetch
3. Bugs are subtle and hard to reproduce

**The Fix:**

```typescript
// GOOD - include all dependencies
const refreshUser = useCallback(async () => {
  const userData = await fetchUser(userToken);
  setUser(userData);
}, [userToken]); // Recreates when token changes
```

**When You Might Be Tempted:**
When you want to prevent re-renders or avoid infinite loops. Instead, restructure the logic or use useRef for truly static values.

## WARNING: useEffect for Data Fetching

**NEVER do this:**

```typescript
// BAD - race conditions, memory leaks, no caching
useEffect(() => {
  fetch('/api/products')
    .then(r => r.json())
    .then(setProducts);
}, []);
```

**The Fix:** Use React Query. See the **tanstack-query** skill.

```typescript
// GOOD
const { data: products } = useQuery({
  queryKey: ['products'],
  queryFn: fetchProducts
});
```

## Hook Rules Checklist

Copy this checklist when writing hooks:

- [ ] All dependencies included in useEffect/useCallback/useMemo arrays
- [ ] No data fetching in useEffect (use React Query)
- [ ] useRef for values that shouldn't trigger re-renders
- [ ] Custom hooks start with `use` prefix
- [ ] Cleanup functions in useEffect for subscriptions/timers