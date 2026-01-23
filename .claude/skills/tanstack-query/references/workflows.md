# TanStack Query Workflows

## Contents
- Adding a New Query
- Adding a New Mutation
- Debugging Cache Issues
- Pagination Pattern
- Infinite Scroll

---

## Adding a New Query

Copy this checklist and track progress:
- [ ] Step 1: Create API function in `frontend/src/api/`
- [ ] Step 2: Define TypeScript types in `frontend/src/types/`
- [ ] Step 3: Add useQuery hook in component
- [ ] Step 4: Handle loading and error states

### Step 1: Create API Function

```typescript
// frontend/src/api/orders.ts
import api from './client';
import type { Order } from '../types/order';

export const fetchUserOrders = async (): Promise<Order[]> => {
  const response = await api.get<Order[]>('/orders/user');
  return response.data;
};
```

### Step 2: Add Query Hook

```typescript
// In component
import { useQuery } from '@tanstack/react-query';
import { fetchUserOrders } from '../api/orders';

const { data: orders = [], isLoading, error } = useQuery({
  queryKey: ['user-orders'],
  queryFn: fetchUserOrders
});
```

### Step 3: Handle States

```typescript
if (isLoading) return <LoadingState />;
if (error) return <ErrorState message="Failed to load orders" />;
return <OrderList orders={orders} />;
```

---

## Adding a New Mutation

Copy this checklist and track progress:
- [ ] Step 1: Create API function for the mutation
- [ ] Step 2: Add useMutation hook
- [ ] Step 3: Add cache invalidation
- [ ] Step 4: Handle mutation states in UI

### Complete Example

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';

function ReviewForm({ productId }: { productId: number }) {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (payload: CreateReviewPayload) =>
      createReview(productId, payload),
    onSuccess: () => {
      // Invalidate both reviews and products (for average rating update)
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    }
  });

  const handleSubmit = (data: FormData) => {
    createMutation.mutate(data);
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
      <button disabled={createMutation.isPending}>
        {createMutation.isPending ? 'Submitting...' : 'Submit Review'}
      </button>
      {createMutation.isError && <span>Failed to submit</span>}
    </form>
  );
}
```

---

## Debugging Cache Issues

### 1. Install React Query Devtools

```typescript
// Already available in dev mode
// Open browser devtools → React Query tab
```

### 2. Check Query Key Matching

```typescript
// These are DIFFERENT cache entries:
queryKey: ['products']
queryKey: ['products', {}]
queryKey: ['products', { page: 1 }]
```

### 3. Verify Invalidation Patterns

```typescript
// Invalidates ALL queries starting with 'products'
queryClient.invalidateQueries({ queryKey: ['products'] });

// Invalidates ONLY exact match
queryClient.invalidateQueries({ queryKey: ['products'], exact: true });
```

### 4. Force Refetch for Testing

```typescript
// In component or devtools console
queryClient.refetchQueries({ queryKey: ['products'] });
```

---

## Pagination Pattern

This codebase uses **load more** pagination with accumulated results:

```typescript
// frontend/src/pages/ProductsPage.tsx:79-106
const [currentPage, setCurrentPage] = useState(1);
const [allProducts, setAllProducts] = useState<Product[]>([]);

const { data: response, isLoading, isFetching } = useQuery({
  queryKey: ['products', filters, currentPage],
  queryFn: () => fetchProducts(filters, currentPage, 18),
  keepPreviousData: true
});

// Accumulate products
useEffect(() => {
  if (response) {
    if (currentPage === 1) {
      setAllProducts(response.products);
    } else {
      setAllProducts(prev => [...prev, ...response.products]);
    }
    setHasMore(response.hasMore);
  }
}, [response]);

// Reset on filter change
useEffect(() => {
  setCurrentPage(1);
}, [filters]);

const handleLoadMore = () => {
  if (hasMore && !isFetching) {
    setCurrentPage(prev => prev + 1);
  }
};
```

**DO:** Reset pagination when filters change.

**DON'T:** Use infinite query for this pattern - the codebase uses manual accumulation.

---

## Query in Context Providers

For app-wide data like themes or languages:

```typescript
// frontend/src/context/ThemeContext.tsx
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();

  const { data: theme, isLoading, error } = useQuery<Theme, Error>({
    queryKey: ['active-theme'],
    queryFn: getActiveTheme,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false
  });

  const refreshTheme = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ['active-theme'] });
  }, [queryClient]);

  return (
    <ThemeContext.Provider value={{ theme, refreshTheme, ... }}>
      {children}
    </ThemeContext.Provider>
  );
}
```

---

## Parallel Queries

When loading multiple independent datasets:

```typescript
// Both queries run in parallel automatically
const { data: products } = useQuery({
  queryKey: ['admin-products'],
  queryFn: fetchAllProducts
});
const { data: attributes } = useQuery({
  queryKey: ['admin-attributes'],
  queryFn: getAllAttributes
});
```

React Query batches these - no manual `Promise.all` needed.

---

## Query Configuration Reference

| Option | Default | Use When |
|--------|---------|----------|
| `staleTime` | 0 | Data changes frequently |
| `staleTime: Infinity` | - | Data is static (filter metadata) |
| `staleTime: 5 * 60 * 1000` | - | Reference data (languages) |
| `gcTime` | 5 min | Control memory usage |
| `refetchOnWindowFocus` | true | Real-time data needed |
| `refetchOnWindowFocus: false` | - | Static/theme data |
| `keepPreviousData` | false | Pagination, seamless transitions |
| `retry: 3` | 3 | Network-sensitive operations |
| `enabled: false` | - | Conditional fetching |