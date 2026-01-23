# Data Fetching Reference

## Contents
- React Query Setup
- Query Patterns
- Mutation Patterns
- Cache Invalidation
- Anti-Patterns

## React Query Setup

This project uses `@tanstack/react-query`. Provider configured in `frontend/src/main.tsx`.

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,  // 5 minutes
      gcTime: 10 * 60 * 1000,    // 10 minutes
      retry: 3,
      refetchOnWindowFocus: false
    }
  }
});
```

## Query Patterns

### Basic Query

```typescript
// frontend/src/pages/ProductDetailPage.tsx
const { data: product, isLoading, error } = useQuery({
  queryKey: ['product', productId],
  queryFn: () => fetchProduct(productId),
  enabled: Number.isFinite(productId) // Only fetch if valid ID
});

if (isLoading) return <LoadingSpinner />;
if (error) return <ErrorMessage message="Failed to load product" />;
```

### Query with Filters

```typescript
// ProductsPage.tsx
const [filters, setFilters] = useState<ProductFilters>({});
const { lang } = useParams();

const { data, isLoading } = useQuery({
  queryKey: ['products', filters, lang],
  queryFn: () => fetchProducts(filters, 1, 18),
  staleTime: 5 * 60 * 1000
});
```

### Dependent Queries

```typescript
// Fetch reviews only if user can review
const { data: canReviewData } = useQuery({
  queryKey: ['can-review', productId],
  queryFn: () => canUserReviewProduct(productId),
  enabled: isAuthenticated && Number.isFinite(productId)
});
```

### Query in Context

```typescript
// ThemeContext.tsx - combining React Query with Context
const { data: theme, isLoading } = useQuery<Theme>({
  queryKey: ['active-theme'],
  queryFn: getActiveTheme,
  staleTime: 5 * 60 * 1000,
  gcTime: 10 * 60 * 1000,
  retry: 3,
  retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30000)
});
```

## Mutation Patterns

### Basic Mutation

```typescript
// CheckoutPage.tsx
const mutation = useMutation({
  mutationFn: createOrder,
  onSuccess: (order) => {
    clear(); // Clear cart
    navigate(`/${lang}/order-success`, { state: { order } });
  },
  onError: (error) => {
    toast.error('Failed to create order');
  }
});

const onSubmit = (data: CheckoutForm) => {
  mutation.mutate({
    customer: data,
    items: cartItems.map(item => ({
      productId: item.product.id,
      quantity: item.quantity,
      variantId: item.variant?.id
    }))
  });
};
```

### Mutation with Cache Invalidation

```typescript
// ProductCard.tsx - favorites
const queryClient = useQueryClient();

const addFavoriteMutation = useMutation({
  mutationFn: addFavorite,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['favorites'] });
  }
});

const removeFavoriteMutation = useMutation({
  mutationFn: removeFavorite,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['favorites'] });
  }
});
```

### Optimistic Updates

```typescript
const mutation = useMutation({
  mutationFn: updateProduct,
  onMutate: async (newProduct) => {
    await queryClient.cancelQueries({ queryKey: ['product', newProduct.id] });
    const previous = queryClient.getQueryData(['product', newProduct.id]);
    queryClient.setQueryData(['product', newProduct.id], newProduct);
    return { previous };
  },
  onError: (err, newProduct, context) => {
    queryClient.setQueryData(['product', newProduct.id], context?.previous);
  },
  onSettled: () => {
    queryClient.invalidateQueries({ queryKey: ['products'] });
  }
});
```

## WARNING: useEffect for Data Fetching

**The Problem:**

```typescript
// BAD - causes race conditions, memory leaks, no caching
const [products, setProducts] = useState([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  fetch('/api/products')
    .then(r => r.json())
    .then(data => {
      setProducts(data); // Component may be unmounted!
      setLoading(false);
    });
}, []);
```

**Why This Breaks:**
1. **Race conditions**: Fast navigation causes stale data overwrites
2. **Memory leaks**: setState called on unmounted component
3. **No caching**: Every mount triggers new request
4. **No deduplication**: Same request made multiple times
5. **No retry logic**: Transient failures not handled
6. **No loading states**: Manual boilerplate required

**The Fix:**

```typescript
// GOOD - React Query handles all edge cases
const { data: products, isLoading, error } = useQuery({
  queryKey: ['products'],
  queryFn: fetchProducts,
  staleTime: 5 * 60 * 1000
});
```

See the **tanstack-query** skill for detailed patterns.

## WARNING: Fetching in Event Handlers

**The Problem:**

```typescript
// BAD - no loading state, no error handling, no caching
const handleSearch = async () => {
  const results = await fetch(`/api/search?q=${query}`);
  setResults(await results.json());
};
```

**The Fix:**

```typescript
// GOOD - useMutation for imperative fetches
const searchMutation = useMutation({
  mutationFn: (query: string) => searchProducts(query)
});

const handleSearch = () => {
  searchMutation.mutate(query);
};

// Or useQuery with enabled flag
const { data, refetch } = useQuery({
  queryKey: ['search', query],
  queryFn: () => searchProducts(query),
  enabled: false // Manual trigger
});
```

## API Client Pattern

All API calls go through typed client modules in `frontend/src/api/`.

```typescript
// frontend/src/api/products.ts
export const fetchProducts = async (
  filters?: ProductFilters,
  page: number = 1,
  limit: number = 18
): Promise<PaginatedProductsResponse> => {
  const params = new URLSearchParams();
  if (filters?.category) params.append('category', filters.category);
  if (filters?.isNew) params.append('isNew', 'true');
  params.append('page', String(page));
  params.append('limit', String(limit));
  
  const response = await api.get<PaginatedProductsResponse>(
    `/products?${params.toString()}`
  );
  return response.data;
};
```

## Query Key Conventions

```typescript
// Entity lists
['products']
['products', filters]
['orders', { status: 'pending' }]

// Single entity
['product', productId]
['order', orderId]

// Related entities
['product-variants', productId]
['product-reviews', productId]

// User-specific
['favorites']
['user-orders']
```