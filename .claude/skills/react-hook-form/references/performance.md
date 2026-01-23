# Form Performance Reference

## Contents
- Re-render Optimization
- Validation Mode Selection
- Large Forms
- File Upload Optimization
- Anti-Patterns

## Re-render Optimization

### Isolate watch() Consumers

```typescript
// BAD - Entire form re-renders on any field change
function Form() {
  const { register, watch } = useForm();
  const allFields = watch(); // Triggers re-render on ANY change
  return <form>...</form>;
}

// GOOD - Only watch specific fields
function Form() {
  const { register } = useForm();
  return (
    <form>
      <EmailField />
      <PasswordField />
    </form>
  );
}

// Isolate watch to child component
function PasswordStrength() {
  const password = useWatch({ name: 'password' });
  return <StrengthMeter value={password} />;
}
```

### Use useWatch Over watch in Components

```typescript
import { useWatch } from 'react-hook-form';

// GOOD - Scoped re-renders
function DependentField() {
  const category = useWatch({ name: 'category' });
  return category === 'other' ? <OtherInput /> : null;
}
```

## Validation Mode Selection

### Mode Options

```typescript
// Validate on submit (default) - Best performance
useForm({ mode: 'onSubmit' })

// Validate on blur - Good UX for long forms
useForm({ mode: 'onBlur' })

// Validate on change - Most responsive, worst performance
useForm({ mode: 'onChange' })

// Hybrid: validate on change after first submit
useForm({ mode: 'onTouched' })
```

### Recommendation

```typescript
// Default for most forms
useForm({ mode: 'onSubmit' })

// For forms requiring real-time feedback
useForm({ 
  mode: 'onBlur',
  reValidateMode: 'onChange'  // Re-validate on change after error
})
```

## Large Forms

### Split Into Sections

```typescript
// Main form component
function ProductForm() {
  const methods = useForm<ProductForm>();
  
  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)}>
        <BasicInfoSection />
        <PricingSection />
        <InventorySection />
        <SEOSection />
        <button type="submit">Save</button>
      </form>
    </FormProvider>
  );
}

// Section component - only re-renders when its fields change
function BasicInfoSection() {
  const { register } = useFormContext();
  return (
    <fieldset>
      <input {...register('name')} />
      <textarea {...register('description')} />
    </fieldset>
  );
}
```

### Lazy Load Sections

```typescript
import { lazy, Suspense } from 'react';

const SEOSection = lazy(() => import('./SEOSection'));

function ProductForm() {
  return (
    <form>
      <BasicInfoSection />
      <Suspense fallback={<div>Loading SEO options...</div>}>
        <SEOSection />
      </Suspense>
    </form>
  );
}
```

## File Upload Optimization

### Don't Store Large Files in Form State

```typescript
// BAD - File in form state
const { register, watch } = useForm();
const file = watch('image'); // Large file in memory

// GOOD - Separate file handling
const [file, setFile] = useState<File | null>(null);
const { register, handleSubmit } = useForm();

const onFileChange = (e: ChangeEvent<HTMLInputElement>) => {
  setFile(e.target.files?.[0] || null);
};

const onSubmit = async (data) => {
  const formData = new FormData();
  formData.append('data', JSON.stringify(data));
  if (file) formData.append('image', file);
  await mutation.mutateAsync(formData);
};
```

## Anti-Patterns

### WARNING: Re-registering on Every Render

**The Problem:**

```typescript
// BAD - register called in render body
function DynamicField({ name }: { name: string }) {
  const { register } = useFormContext();
  return <input {...register(name)} />; // New registration each render!
}

function Form() {
  const fields = ['a', 'b', 'c'];
  return (
    <>
      {fields.map((name) => (
        <DynamicField key={name} name={name} />
      ))}
    </>
  );
}
```

**Why This Breaks:**
1. Multiple registrations for same field
2. Memory leaks from orphaned subscriptions
3. Inconsistent validation behavior

**The Fix:**

```typescript
// GOOD - Stable key ensures single registration
function Form() {
  const { register } = useForm();
  const fields = useMemo(() => ['a', 'b', 'c'], []);
  
  return (
    <>
      {fields.map((name) => (
        <input key={name} {...register(name)} />
      ))}
    </>
  );
}
```

### WARNING: Watching All Fields

**The Problem:**

```typescript
// BAD - Subscribes to entire form
const { watch } = useForm();
const formData = watch(); // Every keystroke re-renders

useEffect(() => {
  console.log('Form changed:', formData);
}, [formData]);
```

**Why This Breaks:**
1. Re-render on ANY field change
2. Heavy computation on every keystroke
3. Laggy form input experience

**The Fix:**

```typescript
// GOOD - Watch specific fields only
const email = watch('email');
const password = watch('password');

// Or use callback for side effects
useEffect(() => {
  const subscription = watch((data, { name }) => {
    if (name === 'email') {
      console.log('Email changed:', data.email);
    }
  });
  return () => subscription.unsubscribe();
}, [watch]);
```

### WARNING: Heavy Validation on Change

**The Problem:**

```typescript
// BAD - Expensive validation on every keystroke
useForm({
  mode: 'onChange',
});

register('username', {
  validate: async (value) => {
    const response = await fetch(`/api/check-username/${value}`);
    return response.ok || 'Username taken';
  }
});
```

**Why This Breaks:**
1. API call on every keystroke
2. Race conditions with rapid typing
3. Server overload

**The Fix:**

```typescript
// GOOD - Debounced async validation
import { useCallback } from 'react';
import debounce from 'lodash/debounce';

const checkUsername = useCallback(
  debounce(async (value: string, resolve: (msg: string | true) => void) => {
    const response = await fetch(`/api/check-username/${value}`);
    resolve(response.ok ? true : 'Username taken');
  }, 500),
  []
);

register('username', {
  validate: (value) => new Promise((resolve) => checkUsername(value, resolve))
});
```

## Performance Validation Checklist

- [ ] Use `mode: 'onSubmit'` unless real-time feedback needed
- [ ] Isolate `watch()` consumers to minimize re-renders
- [ ] Use `useWatch` in child components instead of prop drilling
- [ ] Debounce async validation
- [ ] Don't store large files in form state
- [ ] Lazy load complex form sections
- [ ] Memoize field arrays and options