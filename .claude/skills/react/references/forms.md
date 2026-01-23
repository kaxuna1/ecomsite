# Forms Reference

## Contents
- React Hook Form Setup
- Validation Patterns
- Form State Management
- Auto-Save Pattern
- Anti-Patterns

## React Hook Form Setup

This project uses `react-hook-form` for complex forms. See the **react-hook-form** skill for Zod integration.

### Basic Form

```typescript
// frontend/src/pages/CheckoutPage.tsx
interface CheckoutForm {
  name: string;
  email: string;
  phone?: string;
  address: string;
  notes?: string;
}

export default function CheckoutPage() {
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<CheckoutForm>();

  const mutation = useMutation({
    mutationFn: createOrder,
    onSuccess: (order) => {
      navigate('/order-success', { state: { order } });
    }
  });

  const onSubmit = (data: CheckoutForm) => {
    mutation.mutate({
      customer: data,
      items: cartItems
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input
        {...register('name', { required: 'Name is required' })}
        placeholder="Full Name"
      />
      {errors.name && <span>{errors.name.message}</span>}
      
      <input
        {...register('email', { 
          required: 'Email is required',
          pattern: {
            value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            message: 'Invalid email'
          }
        })}
        type="email"
      />
      
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Processing...' : 'Place Order'}
      </button>
    </form>
  );
}
```

### Pre-filling Form Values

```typescript
// Auto-fill from saved address
useEffect(() => {
  if (selectedAddress) {
    setValue('name', selectedAddress.name);
    setValue('address', [
      selectedAddress.addressLine1,
      selectedAddress.city,
      selectedAddress.postalCode
    ].join(', '));
  }
}, [selectedAddress, setValue]);
```

## Auto-Save Pattern

```typescript
// ProductEditor.tsx - draft saving
const form = useForm<ProductForm>({
  defaultValues: {
    name: '',
    price: 0,
    inventory: 0
  }
});

const { watch, getValues, formState: { isDirty } } = form;

const { status, loadDraft, clearDraft } = useAutoSave({
  watch,
  getValues,
  storageKey: `product-draft-${id}`,
  enabled: true,
  debounceMs: 2000,
  isDirty
});

// Offer to restore draft on mount
useEffect(() => {
  const draft = loadDraft();
  if (draft) {
    const restore = confirm('Restore unsaved changes?');
    if (restore) {
      form.reset(draft);
    } else {
      clearDraft();
    }
  }
}, []);
```

## Manual Form State

For simple forms, useState is sufficient:

```typescript
// ReviewForm.tsx
const [rating, setRating] = useState(0);
const [title, setTitle] = useState('');
const [reviewText, setReviewText] = useState('');
const [errors, setErrors] = useState<Record<string, string>>({});

const validate = (): boolean => {
  const newErrors: Record<string, string> = {};
  if (rating === 0) {
    newErrors.rating = t('reviews.form.errors.ratingRequired');
  }
  if (reviewText.length > 2000) {
    newErrors.reviewText = t('reviews.form.errors.tooLong');
  }
  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
};

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!validate()) return;
  
  mutation.mutate({ rating, title, reviewText });
};
```

## WARNING: Uncontrolled to Controlled Switch

**The Problem:**

```typescript
// BAD - starts undefined, becomes controlled
const [value, setValue] = useState(); // undefined initially

<input value={value} onChange={e => setValue(e.target.value)} />
// Warning: A component is changing an uncontrolled input to be controlled
```

**The Fix:**

```typescript
// GOOD - always provide initial value
const [value, setValue] = useState('');

<input value={value} onChange={e => setValue(e.target.value)} />
```

## WARNING: Missing Form Validation

**The Problem:**

```typescript
// BAD - no validation, trusts user input
const onSubmit = (data) => {
  createOrder(data); // What if email is invalid? Price is negative?
};
```

**The Fix:**

Use React Hook Form with Zod schemas. See the **zod** skill.

```typescript
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const schema = z.object({
  email: z.string().email('Invalid email'),
  name: z.string().min(2, 'Name too short'),
  price: z.number().positive('Price must be positive')
});

const { register, handleSubmit } = useForm({
  resolver: zodResolver(schema)
});
```

## Form Patterns Decision Tree

```
Is the form complex (5+ fields, nested, arrays)?
├── Yes → React Hook Form + Zod
└── No → Is validation needed?
    ├── Yes → React Hook Form (simple)
    └── No → useState
```

## Form Checklist

Copy this checklist for form implementation:

- [ ] All inputs have proper types (text, email, number, etc.)
- [ ] Required fields are marked and validated
- [ ] Error messages are displayed near inputs
- [ ] Submit button shows loading state
- [ ] Form is disabled during submission
- [ ] Success/error feedback after submission
- [ ] Keyboard navigation works (Tab, Enter)
- [ ] Labels are associated with inputs (htmlFor)