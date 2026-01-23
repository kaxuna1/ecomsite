# Form Hooks Reference

## Contents
- useForm Hook Patterns
- Custom Hooks: useAutoSave
- Custom Hooks: useUnsavedChanges
- Anti-Patterns

## useForm Hook Patterns

### Basic Destructuring

```typescript
// src/pages/LoginPage.tsx
const {
  register,
  handleSubmit,
  formState: { errors }
} = useForm<LoginPayload>();
```

### Extended Destructuring

```typescript
// src/pages/CheckoutPage.tsx
const {
  register,
  handleSubmit,
  setValue,
  formState: { errors, isSubmitting }
} = useForm<CheckoutForm>();
```

### With watch() for Dependencies

```typescript
// src/pages/SignupPage.tsx
const {
  register,
  handleSubmit,
  watch,
  formState: { errors }
} = useForm<SignupFormData>();

const password = watch('password');

// Use in validation
register('confirmPassword', {
  validate: (value) => value === password || t('signup.passwordsNoMatch')
})
```

## Custom Hooks: useAutoSave

Location: `src/hooks/useAutoSave.ts`

Persists form data to localStorage with debouncing:

```typescript
import { useAutoSave } from '../hooks/useAutoSave';

const { register, watch, getValues, formState: { isDirty } } = useForm<ProductForm>();

const { status, loadDraft, clearDraft } = useAutoSave({
  watch,
  getValues,
  storageKey: 'product-draft',
  debounceMs: 2000,
  enabled: true,
  isDirty
});

// Load draft on mount
useEffect(() => {
  const draft = loadDraft();
  if (draft) {
    reset(draft);
  }
}, []);

// Clear on successful submit
const onSubmit = async (data) => {
  await mutation.mutateAsync(data);
  clearDraft();
};
```

## Custom Hooks: useUnsavedChanges

Location: `src/hooks/useUnsavedChanges.ts`

Warns users before leaving with unsaved changes:

```typescript
import { useUnsavedChanges } from '../hooks/useUnsavedChanges';

const { formState: { isDirty } } = useForm<ProductForm>();

useUnsavedChanges({
  isDirty,
  message: 'You have unsaved changes. Are you sure you want to leave?'
});
```

## Anti-Patterns

### WARNING: Using State Instead of watch()

**The Problem:**

```typescript
// BAD - Unnecessary state duplication
const [email, setEmail] = useState('');
const { register } = useForm();

<input
  {...register('email')}
  value={email}
  onChange={(e) => setEmail(e.target.value)}
/>
```

**Why This Breaks:**
1. Double source of truth - form state and useState conflict
2. Registration overwrites onChange, causing bugs
3. Re-renders on every keystroke

**The Fix:**

```typescript
// GOOD - Use watch() for reactive values
const { register, watch } = useForm();
const email = watch('email');
```

### WARNING: Missing Type Parameter

**The Problem:**

```typescript
// BAD - No type safety
const { register } = useForm();
register('emial'); // Typo not caught
```

**Why This Breaks:**
1. No autocomplete for field names
2. Typos in field names not caught at compile time
3. Error messages lack type information

**The Fix:**

```typescript
// GOOD - Type parameter provides safety
interface LoginForm {
  email: string;
  password: string;
}

const { register } = useForm<LoginForm>();
register('email'); // Autocomplete works, typos caught
```

### WARNING: Calling setValue in Render

**The Problem:**

```typescript
// BAD - Infinite loop
function MyForm() {
  const { setValue } = useForm();
  setValue('name', 'John'); // Called every render!
  return <form>...</form>;
}
```

**Why This Breaks:**
1. setValue triggers re-render
2. Re-render calls setValue again
3. Infinite loop crashes the app

**The Fix:**

```typescript
// GOOD - Use useEffect or defaultValues
const { setValue } = useForm({
  defaultValues: { name: 'John' }
});

// Or in useEffect for async data
useEffect(() => {
  if (user) {
    setValue('name', user.name);
  }
}, [user, setValue]);
```

**When You Might Be Tempted:**
- Pre-filling forms with user data
- Resetting form after successful submission
- Syncing with external state