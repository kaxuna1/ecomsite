# Complete Form Patterns Reference

## Contents
- Login Form
- Signup Form with Validation
- Checkout Form with Auto-fill
- Form Validation Rules
- i18n Integration

## Login Form

From `src/pages/LoginPage.tsx`:

```typescript
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import type { LoginPayload } from '../types/product';

export default function LoginPage() {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<LoginPayload>();

  const onSubmit = async (data: LoginPayload) => {
    setIsLoading(true);
    setError('');
    try {
      await userLogin(data);
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.response?.data?.message || t('login.error'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl">
          {error}
        </div>
      )}

      {/* Email */}
      <input
        {...register('email', {
          required: t('login.emailRequired'),
          pattern: {
            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
            message: t('login.emailInvalid')
          }
        })}
        type="email"
      />
      {errors.email && <p>{errors.email.message}</p>}

      {/* Password */}
      <input
        {...register('password', {
          required: t('login.passwordRequired'),
          minLength: { value: 6, message: t('login.passwordMinLength') }
        })}
        type="password"
      />
      {errors.password && <p>{errors.password.message}</p>}

      <button type="submit" disabled={isLoading}>
        {isLoading ? t('login.signingIn') : t('login.signIn')}
      </button>
    </form>
  );
}
```

## Signup Form with Cross-Field Validation

From `src/pages/SignupPage.tsx`:

```typescript
interface SignupFormData extends RegisterPayload {
  confirmPassword: string;
}

const {
  register,
  handleSubmit,
  watch,
  formState: { errors }
} = useForm<SignupFormData>();

const password = watch('password');

// Password confirmation validation
<input
  {...register('confirmPassword', {
    required: t('signup.confirmPasswordRequired'),
    validate: (value) => value === password || t('signup.passwordsNoMatch')
  })}
  type="password"
/>
```

## Checkout Form with Auto-fill

From `src/pages/CheckoutPage.tsx`:

```typescript
interface CheckoutForm {
  name: string;
  email: string;
  phone?: string;
  address: string;
  notes?: string;
}

const {
  register,
  handleSubmit,
  setValue,
  formState: { errors, isSubmitting }
} = useForm<CheckoutForm>();

// Auto-fill from user/address
useEffect(() => {
  if (user?.email) {
    setValue('email', user.email);
  }
  if (selectedAddress) {
    setValue('name', selectedAddress.name);
    setValue('address', formatAddress(selectedAddress));
  }
}, [selectedAddress, setValue, user]);

// Submit with mutation
const mutation = useMutation({ mutationFn: createOrder });

const onSubmit = (data: CheckoutForm) => {
  mutation.mutate({
    customer: data,
    items: cartItems,
    total: finalTotal
  });
};
```

## Form Validation Rules

### Required

```typescript
register('name', { required: t('errors.nameRequired') })
```

### Pattern (Regex)

```typescript
register('email', {
  pattern: {
    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
    message: t('errors.emailInvalid')
  }
})
```

### Min/Max Length

```typescript
register('password', {
  minLength: { value: 6, message: t('errors.passwordTooShort') },
  maxLength: { value: 100, message: t('errors.passwordTooLong') }
})
```

### Custom Validate

```typescript
register('confirmPassword', {
  validate: (value) => value === password || t('errors.passwordsNoMatch')
})

// Async validation
register('username', {
  validate: async (value) => {
    const available = await checkUsername(value);
    return available || t('errors.usernameTaken');
  }
})
```

### Optional Fields

```typescript
// No validation rules = optional
register('phone')
register('notes')
```

## i18n Integration

All validation messages use react-i18next:

```typescript
import { useTranslation } from 'react-i18next';

const { t } = useTranslation();

register('email', {
  required: t('login.emailRequired'),
  pattern: {
    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
    message: t('login.emailInvalid')
  }
})
```

Translation keys in `public/locales/en/translation.json`:

```json
{
  "login": {
    "emailRequired": "Email is required",
    "emailInvalid": "Please enter a valid email address",
    "passwordRequired": "Password is required",
    "passwordMinLength": "Password must be at least 6 characters"
  }
}
```

## Form Implementation Checklist

Copy this checklist when creating new forms:

- [ ] Define TypeScript interface for form data
- [ ] Initialize useForm with type parameter
- [ ] Add required validation with i18n messages
- [ ] Add pattern validation for email/phone fields
- [ ] Implement error display with animation
- [ ] Add loading state to submit button
- [ ] Handle mutation success/error states
- [ ] Test form submission flow
- [ ] Add auto-save if editing existing data
- [ ] Add unsaved changes warning if needed