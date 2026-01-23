# TanStack Query Patterns

## Contents
- Query Key Design
- Mutation Patterns
- Cache Configuration
- Error Handling
- Anti-Patterns

---

## Query Key Design

Query keys determine cache identity. Structure them hierarchically for granular invalidation.

### Single Entity

```typescript
// frontend/src/pages/account/FavoritesPage.tsx:178-181
const { data: favorites, isLoading, error } = useQuery({
  queryKey: ['favorites'],
  queryFn: getFavorites
});
```

### Entity with Filters

```typescript
// frontend/src/pages/ProductsPage.tsx:80-84
const { data: response, isLoading, isFetching } = useQuery({
  queryKey: ['products', filters, currentPage],
  queryFn: () => fetchProducts(filters, currentPage, 18),
  keepPreviousData: true
});
```

### Namespaced Admin Queries

```typescript
// frontend/src/pages/admin/AdminProducts.tsx:55-59
const { data: products = [] } = useQuery({
  queryKey: ['admin-products'],
  queryFn: fetchAllProducts
});
const { data: attributes = [] } = useQuery({
  queryKey: ['admin-attributes'],
  queryFn: getAllAttributes
});
```

**DO:** Use prefixes like `admin-` for admin-only data to prevent cache collisions with public queries.

**DON'T:** Mix public and admin data in the same cache key.

---

## Mutation Patterns

### Basic Mutation

```typescript
// frontend/src/pages/admin/AdminProducts.tsx:187-190
const deleteMutation = useMutation({
  mutationFn: deleteProduct,
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-products'] })
});
```

### Mutation with Parameters

```typescript
// frontend/src/pages/admin/AdminProducts.tsx:179-185
const updateMutation = useMutation({
  mutationFn: ({ id, formData }: { id: number; formData: FormData }) =>
    updateProduct(id, formData),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['admin-products'] });
    closeModal();
  }
});

// Usage
updateMutation.mutate({ id: productId, formData });
```

### Mutation State in UI

```typescript
// frontend/src/pages/admin/AdminProducts.tsx:1025-1030
<button
  type="submit"
  disabled={createMutation.isPending || updateMutation.isPending}
>
  {createMutation.isPending || updateMutation.isPending ? 'Saving...' : 'Save'}
</button>
```

---

## Cache Configuration

### Static Data (Rarely Changes)

```typescript
// frontend/src/pages/ProductsPage.tsx:109-113
const { data: filterMetadata } = useQuery({
  queryKey: ['filter-metadata'],
  queryFn: () => fetchFilterMetadata(),
  staleTime: Infinity // Never refetch unless invalidated
});
```

### Frequently Changing Data

```typescript
// Default behavior - refetches on window focus, mount
const { data } = useQuery({
  queryKey: ['orders'],
  queryFn: fetchOrders
  // staleTime: 0 (default)
});
```

### Stable Reference Data

```typescript
// frontend/src/App.tsx:68-72
const { data: languages = [], isLoading } = useQuery({
  queryKey: ['languages'],
  queryFn: () => fetchLanguages(false),
  staleTime: 5 * 60 * 1000 // 5 minutes
});
```

### Long-Lived Configuration

```typescript
// frontend/src/context/ThemeContext.tsx:43-51
const { data: theme } = useQuery<Theme, Error>({
  queryKey: ['active-theme'],
  queryFn: getActiveTheme,
  staleTime: 5 * 60 * 1000,
  gcTime: 10 * 60 * 1000,
  refetchOnWindowFocus: false,
  retry: 3,
  retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000)
});
```

---

## Error Handling

### Query Error State

```typescript
const { data, isLoading, error } = useQuery({
  queryKey: ['favorites'],
  queryFn: getFavorites
});

if (error) {
  return <ErrorMessage message="Failed to load favorites" />;
}
```

### Mutation Error Display

```typescript
// frontend/src/pages/admin/AdminProducts.tsx:1037-1040
{(createMutation.isError || updateMutation.isError) && (
  <div className="rounded-2xl bg-rose-500/10 border border-rose-500/20 p-4">
    Failed to save product. Please check all fields and try again.
  </div>
)}
```

---

## WARNING: Anti-Patterns

### WARNING: useEffect for Data Fetching

**The Problem:**

```typescript
// BAD - Race conditions, no caching, memory leaks
useEffect(() => {
  fetch('/api/products').then(r => r.json()).then(setProducts);
}, []);
```

**Why This Breaks:**
1. Race conditions when navigating quickly
2. No caching - refetches on every mount
3. Memory leaks if component unmounts before fetch completes

**The Fix:**

```typescript
// GOOD - Use React Query
const { data: products } = useQuery({
  queryKey: ['products'],
  queryFn: fetchProducts
});
```

### WARNING: Forgetting to Invalidate After Mutations

**The Problem:**

```typescript
// BAD - UI shows stale data after create
const createMutation = useMutation({
  mutationFn: createProduct
});
```

**Why This Breaks:**
1. User creates a product but doesn't see it in the list
2. Confusion about whether the action succeeded

**The Fix:**

```typescript
// GOOD - Invalidate related queries
const createMutation = useMutation({
  mutationFn: createProduct,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['admin-products'] });
  }
});
```

### WARNING: Using Query Data as Initial Form State

**The Problem:**

```typescript
// BAD - Form state gets out of sync
const { data: product } = useQuery({ queryKey: ['product', id], queryFn: ... });
const [name, setName] = useState(product?.name); // Only set once!
```

**Why This Breaks:**
1. Form state is set on initial render only
2. If query refetches, form shows stale local state

**The Fix:**

```typescript
// GOOD - Use react-hook-form with defaultValues or reset
const { data: product } = useQuery({ queryKey: ['product', id], queryFn: ... });
const form = useForm({ defaultValues: product });

useEffect(() => {
  if (product) form.reset(product);
}, [product]);
```

See the **react-hook-form** skill for form integration patterns.