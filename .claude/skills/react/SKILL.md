---
name: react
description: |
  React 18 hooks, components, and functional patterns for the Luxia e-commerce SPA.
  Use when: Building UI components, handling client state, managing forms, or integrating with backend APIs.
allowed-tools: Read, Edit, Write, Glob, Grep, Bash
---

# React Skill

This codebase uses React 18 with TypeScript, React Query for server state, Context API for global state, and React Hook Form for forms. Components follow functional patterns with hooks. Entry point: `frontend/src/main.tsx` → `App.tsx`.

## Quick Start

### Creating a Component

```typescript
// src/components/ProductCard.tsx
interface ProductCardProps {
  product: Product;
  index?: number;
}

export function ProductCard({ product, index = 0 }: ProductCardProps) {
  const { addItem } = useCart();
  const [isAdding, setIsAdding] = useState(false);
  
  const handleAddToCart = async () => {
    setIsAdding(true);
    await addItem(product, 1);
    setIsAdding(false);
  };
  
  return (
    <div className="product-card">
      <img src={product.imageUrl} alt={product.name} loading="lazy" />
      <h3>{product.name}</h3>
      <button onClick={handleAddToCart} disabled={isAdding}>
        {isAdding ? 'Adding...' : 'Add to Cart'}
      </button>
    </div>
  );
}
```

### Using Context

```typescript
// Consumer pattern - use the custom hook
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

function CheckoutButton() {
  const { items, subtotal } = useCart();
  const { isAuthenticated, user } = useAuth();
  
  if (!isAuthenticated) return <LoginPrompt />;
  return <button>Checkout ({items.length} items - ${subtotal})</button>;
}
```

## Key Concepts

| Concept | Usage | Example |
|---------|-------|---------|
| Server State | React Query | `useQuery({ queryKey: ['products'], queryFn })` |
| Global State | Context + useReducer | `CartContext`, `AuthContext` |
| Local State | useState | Modal open, form inputs |
| Forms | React Hook Form | `useForm<CheckoutForm>()` |
| Side Effects | useEffect | Sync localStorage, DOM updates |

## Project Structure

```
frontend/src/
├── api/           # Typed API clients (Axios)
├── components/    # Reusable UI (90+ components)
├── context/       # Global state (Cart, Auth, I18n, Theme)
├── hooks/         # Custom hooks (useAutoSave, useDebounce)
├── pages/         # Route components (41 pages)
└── types/         # TypeScript interfaces
```

## Common Patterns

### Data Fetching with React Query

```typescript
const { data: products, isLoading, error } = useQuery({
  queryKey: ['products', filters],
  queryFn: () => fetchProducts(filters),
  staleTime: 5 * 60 * 1000
});
```

### Mutations with Cache Invalidation

```typescript
const mutation = useMutation({
  mutationFn: createOrder,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['orders'] });
    navigate('/order-success');
  }
});
```

## See Also

- [hooks](references/hooks.md) - Custom hook patterns
- [components](references/components.md) - Component architecture
- [data-fetching](references/data-fetching.md) - React Query patterns
- [state](references/state.md) - State management
- [forms](references/forms.md) - Form handling
- [performance](references/performance.md) - Optimization techniques

## Related Skills

- See the **tanstack-query** skill for detailed React Query patterns
- See the **zustand** skill for alternative state management
- See the **react-hook-form** skill for form validation with Zod
- See the **typescript** skill for type patterns
- See the **tailwind** skill for styling
- See the **vite** skill for build configuration