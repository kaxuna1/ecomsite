---
name: react-hook-form
description: |
  Form validation and state management for React with TypeScript type safety.
  Use when: Creating forms, validating user input, handling form submission, implementing multi-step forms, or integrating forms with TanStack Query mutations.
allowed-tools: Read, Edit, Write, Glob, Grep, Bash
---

# React Hook Form Skill

This codebase uses react-hook-form v7.51.4 with inline validation rules and TypeScript interfaces. Forms integrate with TanStack Query for mutations, i18next for translated error messages, and Framer Motion for animated error displays.

## WARNING: Missing Zod Integration

**Detected:** No `zod` or `@hookform/resolvers` in dependencies.
**Impact:** Validation rules are duplicated between frontend and backend. No runtime type safety.

**Recommended:** Install `zod` and `@hookform/resolvers/zod` for schema-based validation. See the **zod** skill.

## Quick Start

### Basic Form with Validation

```typescript
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

interface LoginPayload {
  email: string;
  password: string;
}

const { register, handleSubmit, formState: { errors } } = useForm<LoginPayload>();

<input
  {...register('email', {
    required: t('login.emailRequired'),
    pattern: {
      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
      message: t('login.emailInvalid')
    }
  })}
/>
{errors.email && <p className="text-red-600">{errors.email.message}</p>}
```

### Form with Cross-Field Validation

```typescript
interface SignupFormData {
  password: string;
  confirmPassword: string;
}

const { register, watch, formState: { errors } } = useForm<SignupFormData>();
const password = watch('password');

<input
  {...register('confirmPassword', {
    required: t('signup.confirmPasswordRequired'),
    validate: (value) => value === password || t('signup.passwordsNoMatch')
  })}
/>
```

### Form with TanStack Query Mutation

```typescript
const mutation = useMutation({ mutationFn: createOrder });
const { handleSubmit, formState: { isSubmitting } } = useForm<CheckoutForm>();

const onSubmit = (data: CheckoutForm) => mutation.mutate(data);

<button disabled={mutation.isPending || isSubmitting}>
  {mutation.isPending ? 'Submitting...' : 'Submit'}
</button>
```

## Key Concepts

| Concept | Usage | Example |
|---------|-------|---------|
| `register` | Connect input to form | `{...register('email', { required: true })}` |
| `watch` | Track field values | `const email = watch('email')` |
| `setValue` | Programmatic updates | `setValue('email', user.email)` |
| `formState` | Access errors, isDirty, isSubmitting | `formState: { errors, isDirty }` |
| `handleSubmit` | Wrap submit handler | `onSubmit={handleSubmit(onSubmit)}` |

## Project Patterns

| Pattern | Location | Description |
|---------|----------|-------------|
| Login/Signup | `src/pages/LoginPage.tsx`, `SignupPage.tsx` | Auth forms with validation |
| Checkout | `src/pages/CheckoutPage.tsx` | Multi-field form with address auto-fill |
| Auto-save | `src/hooks/useAutoSave.ts` | localStorage persistence |
| Unsaved changes | `src/hooks/useUnsavedChanges.ts` | Browser unload warning |

## See Also

- [hooks](references/hooks.md) - Custom hooks for forms
- [components](references/components.md) - Reusable form components
- [data-fetching](references/data-fetching.md) - Form + mutation integration
- [state](references/state.md) - Form state management
- [forms](references/forms.md) - Complete form patterns
- [performance](references/performance.md) - Form optimization

## Related Skills

- **typescript** - Type-safe form interfaces
- **tanstack-query** - Mutation integration
- **zod** - Schema validation (recommended)
- **tailwind** - Form styling
- **react** - Component patterns