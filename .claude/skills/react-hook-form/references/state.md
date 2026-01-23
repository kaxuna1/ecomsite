# Form State Reference

## Contents
- formState Properties
- Programmatic Updates
- Form Reset Patterns
- Cross-Field Dependencies
- Anti-Patterns

## formState Properties

### Available Properties

```typescript
const {
  formState: {
    errors,        // Field validation errors
    isDirty,       // Form has been modified
    isSubmitting,  // Form is being submitted
    isValid,       // All fields pass validation
    dirtyFields,   // Which fields have been modified
    touchedFields  // Which fields have been touched
  }
} = useForm<FormData>();
```

### Common Usage

```typescript
// Disable submit until form is dirty and valid
<button 
  type="submit" 
  disabled={!isDirty || !isValid || isSubmitting}
>
  Submit
</button>

// Show unsaved changes warning
useUnsavedChanges({ isDirty });

// Conditional styling
className={errors.email ? 'border-red-300' : 'border-gray-300'}
```

## Programmatic Updates

### setValue()

```typescript
const { setValue } = useForm<CheckoutForm>();

// Simple update
setValue('email', user.email);

// With options
setValue('email', user.email, {
  shouldValidate: true,  // Trigger validation
  shouldDirty: true,     // Mark as dirty
  shouldTouch: true      // Mark as touched
});
```

### reset()

```typescript
const { reset } = useForm<ProductForm>();

// Reset to default values
reset();

// Reset to specific values
reset({
  name: product.name,
  price: product.price
});

// Reset with options
reset(undefined, {
  keepErrors: false,
  keepDirty: false,
  keepValues: false
});
```

## Form Reset Patterns

### After Successful Submission

```typescript
const mutation = useMutation({
  mutationFn: createProduct,
  onSuccess: () => {
    reset(); // Clear form
    queryClient.invalidateQueries({ queryKey: ['products'] });
  }
});
```

### Loading Edit Form

```typescript
const { data: product } = useQuery({
  queryKey: ['product', id],
  queryFn: () => fetchProduct(id)
});

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

## Cross-Field Dependencies

### Password Confirmation

From `src/pages/SignupPage.tsx`:

```typescript
const { register, watch } = useForm<SignupFormData>();
const password = watch('password');

<input
  {...register('confirmPassword', {
    required: t('signup.confirmPasswordRequired'),
    validate: (value) => 
      value === password || t('signup.passwordsNoMatch')
  })}
  type="password"
/>
```

### Dependent Field Visibility

```typescript
const { register, watch } = useForm();
const hasDiscount = watch('hasDiscount');

{hasDiscount && (
  <input
    {...register('discountAmount', { required: true })}
    type="number"
  />
)}
```

## Anti-Patterns

### WARNING: Deriving State from formState

**The Problem:**

```typescript
// BAD - Unnecessary derived state
const [hasErrors, setHasErrors] = useState(false);

useEffect(() => {
  setHasErrors(Object.keys(errors).length > 0);
}, [errors]);
```

**Why This Breaks:**
1. Unnecessary state duplication
2. Extra re-renders
3. Potential sync issues

**The Fix:**

```typescript
// GOOD - Compute directly
const hasErrors = Object.keys(errors).length > 0;

// Or use isValid from formState
const { formState: { isValid } } = useForm({ mode: 'onChange' });
```

### WARNING: Not Cleaning Up watch Subscriptions

**The Problem:**

```typescript
// BAD - Memory leak in custom hooks
function useWatchedField(fieldName: string) {
  const { watch } = useFormContext();
  const [value, setValue] = useState();
  
  watch((data) => {
    setValue(data[fieldName]); // Never unsubscribed!
  });
  
  return value;
}
```

**Why This Breaks:**
1. Subscription persists after unmount
2. Memory leak
3. setState on unmounted component warnings

**The Fix:**

```typescript
// GOOD - Clean up subscription
function useWatchedField(fieldName: string) {
  const { watch } = useFormContext();
  const [value, setValue] = useState();
  
  useEffect(() => {
    const subscription = watch((data) => {
      setValue(data[fieldName]);
    });
    return () => subscription.unsubscribe();
  }, [watch, fieldName]);
  
  return value;
}

// Or just use watch directly
const value = watch(fieldName);
```

### WARNING: Storing Form Data in External State

**The Problem:**

```typescript
// BAD - Duplicating form state
const [formData, setFormData] = useState({});
const { register, handleSubmit } = useForm();

const onSubmit = (data) => {
  setFormData(data); // Why store this?
  mutation.mutate(data);
};
```

**Why This Breaks:**
1. Form already stores this data
2. Double source of truth
3. Sync issues between form and state

**The Fix:**

```typescript
// GOOD - Use getValues() when needed
const { getValues, handleSubmit } = useForm();

const onSubmit = (data) => {
  mutation.mutate(data);
};

// Access current values elsewhere
const currentData = getValues();
```