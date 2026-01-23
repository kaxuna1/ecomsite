# Form Components Reference

## Contents
- FormField Component
- Input with Icon Pattern
- Error Display Patterns
- Submit Button Pattern

## FormField Component

Location: `src/components/cms/editors/FormField.tsx`

Reusable wrapper for form fields with label and error display:

```typescript
interface FormFieldProps {
  label: string;
  error?: string;
  helpText?: string;
  required?: boolean;
  children: ReactNode;
}

export default function FormField({ 
  label, 
  error, 
  helpText, 
  required, 
  children 
}: FormFieldProps) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-champagne">
        {label}
        {required && <span className="ml-1 text-jade">*</span>}
      </label>
      {children}
      {helpText && !error && (
        <p className="text-xs text-champagne/50">{helpText}</p>
      )}
      {error && (
        <p className="text-xs text-red-400">{error}</p>
      )}
    </div>
  );
}
```

### Usage

```typescript
<FormField 
  label="Email" 
  error={errors.email?.message} 
  required
>
  <input {...register('email', { required: true })} />
</FormField>
```

## Input with Icon Pattern

From `src/pages/LoginPage.tsx`:

```typescript
<div>
  <label className="block text-sm font-semibold text-text-primary mb-2">
    {t('login.email')}
  </label>
  <div className="relative">
    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
      <EnvelopeIcon className="h-5 w-5 text-text-primary/40" />
    </div>
    <input
      {...register('email', {
        required: t('login.emailRequired'),
        pattern: {
          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
          message: t('login.emailInvalid')
        }
      })}
      type="email"
      className={`block w-full pl-12 pr-4 py-3 border rounded-xl 
        focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors
        ${errors.email 
          ? 'border-red-300 bg-red-50' 
          : 'border-bg-secondary/60 bg-bg-secondary/10'
        }`}
      placeholder={t('login.emailPlaceholder')}
    />
  </div>
</div>
```

## Error Display Patterns

### Animated Error with Framer Motion

```typescript
import { motion } from 'framer-motion';

{errors.email && (
  <motion.p
    initial={{ opacity: 0, y: -10 }}
    animate={{ opacity: 1, y: 0 }}
    className="mt-1 text-sm text-red-600"
  >
    {errors.email.message}
  </motion.p>
)}
```

### Error with Icon

From `src/pages/CheckoutPage.tsx`:

```typescript
{errors.name && (
  <motion.p
    initial={{ opacity: 0, y: -10 }}
    animate={{ opacity: 1, y: 0 }}
    className="mt-1 flex items-center gap-1 text-xs text-red-600"
  >
    <ExclamationCircleIcon className="h-4 w-4" />
    {errors.name.message}
  </motion.p>
)}
```

### Global Form Error

```typescript
{mutation.isError && (
  <motion.div
    initial={{ opacity: 0, y: -10 }}
    animate={{ opacity: 1, y: 0 }}
    className="rounded-3xl bg-red-50 border-2 border-red-200 px-4 py-3 text-sm text-red-800"
  >
    <div className="flex items-center gap-2">
      <ExclamationCircleIcon className="h-5 w-5" />
      {t('checkout.error')}
    </div>
  </motion.div>
)}
```

## Submit Button Pattern

```typescript
<motion.button
  type="submit"
  disabled={mutation.isPending || isSubmitting}
  whileHover={{ scale: mutation.isPending || isSubmitting ? 1 : 1.02 }}
  whileTap={{ scale: 0.98 }}
  className="w-full bg-primary text-white py-3 rounded-xl font-semibold 
    shadow-lg hover:bg-primary/90 transition-all 
    disabled:opacity-50 disabled:cursor-not-allowed 
    flex items-center justify-center gap-2"
>
  {mutation.isPending ? (
    <>
      <motion.div
        className="h-5 w-5 border-2 border-white/20 border-t-white rounded-full"
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      />
      <span>{t('login.signingIn')}</span>
    </>
  ) : (
    <>
      <ArrowRightOnRectangleIcon className="h-5 w-5" />
      <span>{t('login.signIn')}</span>
    </>
  )}
</motion.button>
```

## WARNING: Mixing Controlled and Uncontrolled

**The Problem:**

```typescript
// BAD - value prop makes it controlled, conflicts with register
<input
  {...register('email')}
  value={someState}
  onChange={(e) => setSomeState(e.target.value)}
/>
```

**Why This Breaks:**
1. register provides its own value/onChange
2. External value prop overrides form state
3. Form validation sees different value than displayed

**The Fix:**

```typescript
// GOOD - Let register control the input
<input {...register('email')} />

// Or use Controller for controlled components
import { Controller } from 'react-hook-form';

<Controller
  name="email"
  control={control}
  render={({ field }) => (
    <CustomInput {...field} />
  )}
/>
```