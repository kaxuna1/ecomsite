# Form Data Fetching Reference

## Contents
- Form + Mutation Integration
- Pre-filling Forms with Query Data
- Optimistic Updates
- Anti-Patterns

## Form + Mutation Integration

This codebase uses **TanStack Query mutations** for form submissions. See the **tanstack-query** skill for mutation details.

### Standard Pattern

From `src/pages/CheckoutPage.tsx`:

```typescript
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { createOrder } from '../api/orders';

const mutation = useMutation({
  mutationFn: createOrder,
  onSuccess: (order) => {
    clear(); // Clear cart
    navigate(`/${lang}/order-success`, { state: { order }, replace: true });
  }
});

const {
  handleSubmit,
  formState: { isSubmitting }
} = useForm<CheckoutForm>();

const onSubmit = (data: CheckoutForm) => {
  mutation.mutate({
    customer: data,
    items: items.map(({ product, quantity }) => ({
      productId: product.id,
      quantity
    })),
    total: finalTotal
  });
};
```

### Handling Loading States

```typescript
<button 
  type="submit" 
  disabled={mutation.isPending || isSubmitting}
>
  {mutation.isPending ? 'Submitting...' : 'Submit'}
</button>
```

### Handling Errors

```typescript
const onSubmit = async (data: LoginPayload) => {
  try {
    await userLogin(data);
    navigate(from, { replace: true });
  } catch (err: any) {
    setError(err.response?.data?.message || t('login.error'));
  }
};
```

## Pre-filling Forms with Query Data

### Using setValue with useEffect

From `src/pages/CheckoutPage.tsx`:

```typescript
const { setValue } = useForm<CheckoutForm>();
const { isAuthenticated, user } = useAuth();

useEffect(() => {
  if (isAuthenticated && user?.email) {
    setValue('email', user.email);
  }

  if (selectedAddress) {
    const addressString = [
      selectedAddress.addressLine1,
      selectedAddress.addressLine2,
      `${selectedAddress.city}, ${selectedAddress.postalCode}`,
      selectedAddress.country
    ].filter(Boolean).join(', ');

    setValue('name', selectedAddress.name);
    setValue('address', addressString);
  }
}, [selectedAddress, setValue, user, isAuthenticated]);
```

### Using defaultValues with Query Data

```typescript
const { data: product } = useQuery({
  queryKey: ['product', id],
  queryFn: () => fetchProduct(id)
});

const { register, reset } = useForm<ProductForm>();

// Reset form when data loads
useEffect(() => {
  if (product) {
    reset({
      name: product.name,
      price: product.price,
      description: product.description
    });
  }
}, [product, reset]);
```

## Anti-Patterns

### WARNING: useEffect for Form Submission

**The Problem:**

```typescript
// BAD - useEffect for submission
const [shouldSubmit, setShouldSubmit] = useState(false);

useEffect(() => {
  if (shouldSubmit) {
    fetch('/api/submit', { 
      method: 'POST', 
      body: JSON.stringify(formData) 
    });
    setShouldSubmit(false);
  }
}, [shouldSubmit, formData]);
```

**Why This Breaks:**
1. Race conditions with state updates
2. No loading state management
3. No error handling
4. No caching or retry logic

**The Fix:**

```typescript
// GOOD - Use mutation with handleSubmit
const mutation = useMutation({ mutationFn: submitForm });

const onSubmit = (data: FormData) => {
  mutation.mutate(data);
};

<form onSubmit={handleSubmit(onSubmit)}>
```

### WARNING: Fetching in onSubmit Without Mutation

**The Problem:**

```typescript
// BAD - Raw fetch in submit handler
const onSubmit = async (data) => {
  setLoading(true);
  try {
    const res = await fetch('/api/submit', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    const result = await res.json();
    setData(result);
  } catch (err) {
    setError(err);
  } finally {
    setLoading(false);
  }
};
```

**Why This Breaks:**
1. Manual loading/error state management
2. No automatic cache invalidation
3. No retry on failure
4. Duplicated boilerplate across forms

**The Fix:**

```typescript
// GOOD - Use TanStack Query mutation
const mutation = useMutation({
  mutationFn: (data) => api.post('/submit', data),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['relatedData'] });
  }
});

const onSubmit = (data) => mutation.mutate(data);

// Access states via mutation
// mutation.isPending, mutation.isError, mutation.error, mutation.data
```

**When You Might Be Tempted:**
- Simple forms without related queries
- Forms that don't need caching
- Quick prototypes

Even in these cases, mutation provides cleaner code and consistent patterns.