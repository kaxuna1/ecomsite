# Components Reference

## Contents
- Component Styling Patterns
- Button Variants
- Form Controls
- Cards and Panels
- Loading States
- Integration with Component Library

---

## Component Styling Patterns

All components follow a consistent structure: base styles, variants, sizes, and state modifiers.

### Base Component Structure

```tsx
import { cn } from '../utils/cn';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export function Button({ 
  variant = 'primary', 
  size = 'md', 
  className, 
  ...props 
}: ButtonProps) {
  return (
    <button
      className={cn(
        // Base styles - always applied
        'inline-flex items-center justify-center font-medium rounded-lg',
        'transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        
        // Variants
        variant === 'primary' && 'bg-[var(--color-primary)] text-white hover:opacity-90 focus:ring-[var(--color-primary)]',
        variant === 'secondary' && 'border border-[var(--color-border)] bg-transparent hover:bg-[var(--color-surface)]',
        variant === 'ghost' && 'hover:bg-gray-100 dark:hover:bg-gray-800',
        
        // Sizes
        size === 'sm' && 'px-3 py-1.5 text-sm',
        size === 'md' && 'px-4 py-2 text-base',
        size === 'lg' && 'px-6 py-3 text-lg',
        
        className
      )}
      {...props}
    />
  );
}
```

---

## Button Variants

### Primary Action

```tsx
<Button variant="primary" size="lg">
  Add to Cart
</Button>
// Result: Solid brand color, high contrast
```

### Secondary Action

```tsx
<Button variant="secondary">
  View Details
</Button>
// Result: Bordered, transparent background
```

### Icon Buttons

```tsx
<button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
  <HeartIcon className="w-5 h-5" />
</button>
```

---

## Form Controls

### Text Input

```tsx
<input
  type="text"
  className={cn(
    'w-full px-4 py-2 rounded-lg border',
    'bg-white dark:bg-gray-900',
    'border-[var(--color-border)]',
    'focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]',
    'placeholder:text-[var(--color-text-muted)]',
    'transition-colors'
  )}
  placeholder="Enter product name"
/>
```

### Select

```tsx
<select className="w-full px-4 py-2 rounded-lg border border-[var(--color-border)] bg-white dark:bg-gray-900">
  <option value="">Select category</option>
  <option value="serums">Serums</option>
  <option value="treatments">Treatments</option>
</select>
```

### WARNING: Inconsistent Form Styling

**The Problem:**
```tsx
// BAD - Each input styled differently
<input className="border p-2" />
<input className="border-2 border-blue-500 px-3 py-1" />
<select className="rounded-full border-gray-300" />
```

**Why This Breaks:**
1. Forms look chaotic and unprofessional
2. Users lose trust in inconsistent interfaces
3. Maintenance nightmare with scattered styles

**The Fix:**
```tsx
// GOOD - Extract to shared component or consistent classes
const inputBase = 'w-full px-4 py-2 rounded-lg border border-[var(--color-border)]';

<input className={inputBase} />
<select className={inputBase} />
```

---

## Cards and Panels

### Product Card

```tsx
<article className="group bg-[var(--color-surface)] rounded-lg overflow-hidden border border-[var(--color-border)] hover:shadow-lg transition-shadow">
  <div className="aspect-square overflow-hidden">
    <img 
      src={product.image_url} 
      alt={product.name}
      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
    />
  </div>
  <div className="p-4">
    <h3 className="font-semibold text-[var(--color-text-primary)]">
      {product.name}
    </h3>
    <p className="text-[var(--color-text-secondary)] text-sm mt-1">
      {product.shortDescription}
    </p>
    <div className="mt-3 flex items-center justify-between">
      <span className="text-lg font-medium">${product.price}</span>
      {product.sale_price && (
        <span className="text-sm text-red-500 line-through">${product.sale_price}</span>
      )}
    </div>
  </div>
</article>
```

### Admin Panel

```tsx
<div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
  <h2 className="text-lg font-semibold mb-4">Panel Title</h2>
  <div className="space-y-4">
    {/* Content */}
  </div>
</div>
```

---

## Loading States

```tsx
// Skeleton loader
<div className="animate-pulse">
  <div className="bg-gray-200 dark:bg-gray-700 rounded-lg aspect-square" />
  <div className="mt-4 h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
  <div className="mt-2 h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
</div>

// Spinner
<div className="animate-spin rounded-full h-8 w-8 border-2 border-[var(--color-primary)] border-t-transparent" />
```

See the **react** skill for loading state patterns with React Query.