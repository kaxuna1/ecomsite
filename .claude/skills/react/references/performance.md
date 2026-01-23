# Performance Reference

## Contents
- Memoization Patterns
- Preventing Re-renders
- Code Splitting
- Image Optimization
- React Query Caching

## Memoization Patterns

### useMemo for Expensive Calculations

```typescript
// CartContext.tsx - cart totals
const subtotal = useMemo(
  () => state.items.reduce((sum, item) => {
    const price = item.variant?.salePrice ?? item.variant?.price ?? 
                  item.product.salePrice ?? item.product.price;
    return sum + price * item.quantity;
  }, 0),
  [state.items]
);

// VariantSelector.tsx - price range calculation
const priceRange = useMemo(() => {
  if (variants.length === 0) return null;
  return {
    min: Math.min(...variants.map(v => v.price)),
    max: Math.max(...variants.map(v => v.price))
  };
}, [variants]);
```

### useCallback for Event Handlers

```typescript
// AuthContext.tsx - memoized callback
const refreshUser = useCallback(async () => {
  if (!userToken) {
    setUser(null);
    return;
  }
  const userData = await authApi.getCurrentUser();
  setUser(userData);
}, [userToken]);

// I18nContext.tsx - translation function
const t = useCallback((key: string, values?: Record<string, string>) => {
  let translation = getNestedTranslation(language, key);
  if (!translation) return key;
  if (values) {
    Object.entries(values).forEach(([k, v]) => {
      translation = translation!.replace(`{{${k}}}`, v);
    });
  }
  return translation;
}, [language]);
```

### React.memo for Pure Components

```typescript
// Only re-render when props actually change
const ProductCard = memo(function ProductCard({ product }: Props) {
  return (
    <div>
      <img src={product.imageUrl} alt={product.name} />
      <h3>{product.name}</h3>
    </div>
  );
});

// With custom comparison
const ProductCard = memo(
  function ProductCard({ product, onSelect }: Props) { ... },
  (prevProps, nextProps) => prevProps.product.id === nextProps.product.id
);
```

## Preventing Re-renders

### Stable Object References

```typescript
// BAD - new object every render
<ProductList filters={{ category: 'serums' }} />

// GOOD - stable reference
const filters = useMemo(() => ({ category: 'serums' }), []);
<ProductList filters={filters} />

// GOOD - for truly static values, module-level constant
const DEFAULT_FILTERS = { category: 'all' } as const;
```

### Context Splitting

```typescript
// Split contexts by update frequency
const ThemeValueContext = createContext<Theme | null>(null);
const ThemeActionsContext = createContext<ThemeActions | null>(null);

// Components that only need actions won't re-render on theme change
function ThemeToggle() {
  const { setThemeMode } = useContext(ThemeActionsContext);
  return <button onClick={() => setThemeMode('dark')}>Toggle</button>;
}
```

## Code Splitting

### Lazy Loading Routes

```typescript
// App.tsx - lazy load admin pages
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'));
const ProductEditor = lazy(() => import('./pages/admin/ProductEditor'));

function App() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <Routes>
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/products/:id" element={<ProductEditor />} />
      </Routes>
    </Suspense>
  );
}
```

### Dynamic Component Import

```typescript
// Load heavy component on demand
const [EditorComponent, setEditorComponent] = useState<ComponentType | null>(null);

const handleEdit = async () => {
  const { RichTextEditor } = await import('./components/RichTextEditor');
  setEditorComponent(() => RichTextEditor);
};
```

## Image Optimization

### Lazy Loading

```typescript
// ProductCard.tsx
<img 
  src={product.imageUrl} 
  alt={product.name}
  loading="lazy"  // Native lazy loading
  decoding="async"
/>
```

### Responsive Images

```typescript
<picture>
  <source media="(max-width: 640px)" srcSet={product.thumbnailUrl} />
  <source media="(min-width: 641px)" srcSet={product.imageUrl} />
  <img src={product.imageUrl} alt={product.name} loading="lazy" />
</picture>
```

## React Query Caching

```typescript
// ThemeContext.tsx - aggressive caching
const { data: theme } = useQuery({
  queryKey: ['active-theme'],
  queryFn: getActiveTheme,
  staleTime: 5 * 60 * 1000,      // Fresh for 5 minutes
  gcTime: 10 * 60 * 1000,        // Keep in cache 10 minutes
  refetchOnWindowFocus: false,   // Don't refetch on tab switch
  retry: 3,
  retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30000)
});
```

See the **tanstack-query** skill for caching strategies.

## WARNING: Premature Optimization

**The Problem:**

```typescript
// BAD - memoizing everything
const name = useMemo(() => product.name, [product.name]); // Pointless
const handleClick = useCallback(() => setOpen(true), []); // Probably unnecessary
```

**When to Memoize:**
1. Expensive calculations (filtering large lists, computing totals)
2. Reference stability for child component props
3. Dependencies in other hooks

**When NOT to Memoize:**
1. Simple string/number access
2. Event handlers for DOM elements (not passed to memoized children)
3. Values that change every render anyway

## Performance Checklist

Copy this checklist for performance audits:

- [ ] Images use `loading="lazy"`
- [ ] Large lists use virtualization or pagination
- [ ] React Query has appropriate staleTime
- [ ] Context values are memoized
- [ ] Expensive calculations use useMemo
- [ ] Admin routes are lazy loaded
- [ ] No inline object/array props to memoized components
- [ ] Bundle analyzed for unnecessary dependencies

## Accessibility Performance

```typescript
// Respect reduced motion preference
import { useReducedMotion } from 'framer-motion';

function ProductCard({ product, index }: Props) {
  const prefersReducedMotion = useReducedMotion();
  
  const variants = prefersReducedMotion 
    ? {} 
    : {
        hidden: { opacity: 0, y: 50 },
        visible: { opacity: 1, y: 0, transition: { delay: index * 0.1 } }
      };
  
  return <motion.div variants={variants}>{/* ... */}</motion.div>;
}
```

See the **vite** skill for bundle optimization.