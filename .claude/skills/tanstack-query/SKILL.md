---
name: tanstack-query
description: |
  Manages server state, API caching, and data fetching with TanStack React Query v5.
  Use when: Fetching API data, managing server state, polling for updates, handling mutations with cache invalidation.
allowed-tools: Read, Edit, Write, Glob, Grep, Bash
---

# TanStack Query Skill

TanStack React Query v5 is the **sole data fetching solution** for this codebase. All API data flows through React Query hooks (`useQuery`, `useMutation`, `useQueryClient`). Query keys follow `['entity-name']` or `['entity-name', filters, page]` patterns. The `QueryClient` is configured in `frontend/src/main.tsx` with default settings.

## Quick Start

### Basic Query Pattern

```typescript
// frontend/src/pages/ProductsPage.tsx:80-84
const { data: response, isLoading, isFetching } = useQuery({
  queryKey: ['products', filters, currentPage],
  queryFn: () => fetchProducts(filters, currentPage, 18),
  keepPreviousData: true
});
```

### Mutation with Cache Invalidation

```typescript
// frontend/src/pages/admin/AdminProducts.tsx:171-177
const createMutation = useMutation({
  mutationFn: (data: FormData) => createProduct(data),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['admin-products'] });
    closeModal();
  }
});
```

### Query in Context Provider

```typescript
// frontend/src/context/ThemeContext.tsx:43-51
const { data: theme, isLoading, error } = useQuery<Theme, Error>({
  queryKey: ['active-theme'],
  queryFn: getActiveTheme,
  staleTime: 5 * 60 * 1000,
  gcTime: 10 * 60 * 1000,
  refetchOnWindowFocus: false,
  retry: 3,
  retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000)
});
```

## Key Concepts

| Concept | Usage | Example |
|---------|-------|---------|
| Query Key | Unique identifier + dependencies | `['products', filters, page]` |
| staleTime | Time before data is considered stale | `5 * 60 * 1000` (5 min) |
| gcTime | Time before inactive data is garbage collected | `10 * 60 * 1000` (10 min) |
| keepPreviousData | Keep showing old data while fetching new | `true` for pagination |
| invalidateQueries | Refetch queries after mutations | `queryClient.invalidateQueries({ queryKey: ['products'] })` |

## Common Patterns

### Dependent Queries

```typescript
// Wait for languages before validating route
const { data: languages = [], isLoading } = useQuery({
  queryKey: ['languages'],
  queryFn: () => fetchLanguages(false),
  staleTime: 5 * 60 * 1000
});

// Component renders after data is ready
if (isLoading) return <LoadingScreen />;
```

### Multiple Cache Invalidations

```typescript
// frontend/src/components/reviews/ReviewForm.tsx:42-46
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: ['reviews'] });
  queryClient.invalidateQueries({ queryKey: ['products'] });
  onSuccess?.();
}
```

## See Also

- [patterns](references/patterns.md) - Query patterns, mutation patterns, cache strategies
- [workflows](references/workflows.md) - Adding new queries, debugging, testing

## Related Skills

For API client setup, see the **typescript** skill. For form state management alongside queries, see the **react-hook-form** skill. For global client state (non-server), see the **zustand** skill.