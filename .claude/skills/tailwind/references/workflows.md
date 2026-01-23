# Tailwind Workflows Reference

## Contents
- Adding New Components
- Theme System Integration
- Responsive Design Workflow
- Custom Utility Classes
- Debugging Tailwind

---

## Adding New Components

### Workflow Checklist

Copy this checklist and track progress:
- [ ] Step 1: Check existing components for similar patterns
- [ ] Step 2: Use brand colors (`midnight`, `champagne`, `jade`, `blush`)
- [ ] Step 3: Add theme-aware variants if storefront-facing
- [ ] Step 4: Implement mobile-first responsive design
- [ ] Step 5: Add hover/focus/active states
- [ ] Step 6: Test at all breakpoints (sm, md, lg, xl)

### Example: New Card Component

```tsx
// frontend/src/components/FeatureCard.tsx
function FeatureCard({ title, description, icon: Icon }) {
  return (
    <div className="group relative overflow-hidden rounded-2xl 
                    border border-border-default bg-bg-elevated 
                    p-6 shadow-md transition-all hover:shadow-xl">
      {/* Icon with brand color */}
      <div className="mb-4 inline-flex rounded-xl bg-jade/10 p-3">
        <Icon className="h-6 w-6 text-jade" />
      </div>

      {/* Typography with theme awareness */}
      <h3 className="font-display text-lg font-semibold text-text-primary">
        {title}
      </h3>
      <p className="mt-2 text-sm text-text-secondary">
        {description}
      </p>

      {/* Hover indicator */}
      <div className="absolute bottom-0 left-0 h-1 w-0 bg-jade 
                      transition-all group-hover:w-full" />
    </div>
  );
}
```

---

## Theme System Integration

### How Theme Variables Work

```
Backend Theme Data (database)
    ↓
ThemeContext fetches via API
    ↓
generateCSSFromTokens() creates CSS
    ↓
Injects <style id="luxia-theme-variables">
    ↓
Components use var(--color-*) or utility classes
```

### Adding Theme-Aware Styles

**Step 1:** Define in `frontend/src/styles/theme.css`:

```css
.my-component {
  background-color: var(--color-background-elevated);
  border: 1px solid var(--color-border-default);
  border-radius: var(--border-radius-xl);
  color: var(--color-text-primary);
}

.my-component:hover {
  border-color: var(--color-brand-primary);
  box-shadow: var(--shadow-lg);
}
```

**Step 2:** Use in component:

```tsx
<div className="my-component p-6">
  Theme-aware with Tailwind utilities
</div>
```

### Validation Loop

1. Make styling changes
2. Toggle theme in admin (`/admin/themes`)
3. Verify component adapts to new theme
4. If colors don't change, check you're using CSS variables not static colors
5. Repeat until theme switching works correctly

---

## Responsive Design Workflow

### Breakpoint Testing Order

Test in this order (mobile-first):
1. **Base** (< 640px) - Mobile phones
2. **sm** (640px) - Large phones, small tablets
3. **md** (768px) - Tablets
4. **lg** (1024px) - Laptops
5. **xl** (1280px) - Desktops

### Common Responsive Patterns

**Navigation:**

```tsx
// Mobile: hamburger, Desktop: full nav
<button className="lg:hidden">
  <Bars3Icon className="h-6 w-6" />
</button>
<nav className="hidden lg:flex lg:gap-8">
  {/* Nav items */}
</nav>
```

**Sidebar Layout:**

```tsx
// Mobile: no sidebar, Desktop: fixed sidebar
<aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-72">
<main className="lg:pl-72">
```

**Grid Columns:**

```tsx
// 1 column mobile, 2 tablet, 3 desktop, 4 large desktop
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
```

---

## Custom Utility Classes

### Using @apply for Reusable Patterns

Define in `frontend/src/styles/global.css`:

```css
@layer components {
  .btn-primary {
    @apply rounded-full bg-midnight px-6 py-3 text-sm font-semibold 
           uppercase tracking-[0.3em] text-champagne transition 
           hover:bg-jade focus-visible:outline-none;
  }

  .btn-secondary {
    @apply rounded-full border border-midnight px-6 py-3 text-sm 
           font-semibold uppercase tracking-[0.3em] text-midnight 
           transition hover:border-jade hover:text-jade;
  }
}
```

### When to Create Custom Classes

| Scenario | Approach |
|----------|----------|
| 3+ identical utility combinations | Create @apply class |
| Theme-dependent styles | Use CSS variables in theme.css |
| One-off complex styling | Inline Tailwind utilities |
| Conditional styling | Template literals with Tailwind |

---

## Debugging Tailwind

### Class Not Working Checklist

1. Check `tailwind.config.ts` content array includes your file path
2. Verify PostCSS is processing (check browser dev tools for compiled CSS)
3. Ensure no typos in class names
4. Check for specificity conflicts with custom CSS
5. Verify the class exists in Tailwind (check docs)

### Inspecting Generated CSS

```bash
# Build and check output
cd frontend
npm run build

# Check CSS output size
ls -la dist/assets/*.css
```

### Common Issues

**Classes purged in production:**

```typescript
// tailwind.config.ts - Ensure all paths covered
content: [
  './index.html',
  './src/**/*.{ts,tsx}',
  // Add any additional paths with Tailwind classes
]
```

**Dynamic classes not working:**

```tsx
// BAD - Tailwind can't detect dynamic class names
<div className={`text-${color}-500`}>

// GOOD - Use complete class names
<div className={color === 'red' ? 'text-red-500' : 'text-blue-500'}>

// GOOD - Or safelist in config
safelist: ['text-red-500', 'text-blue-500', 'text-green-500']
```

---

## File Reference

| File | Purpose |
|------|---------|
| `frontend/tailwind.config.ts` | Custom colors, fonts, extends |
| `frontend/postcss.config.cjs` | PostCSS plugins setup |
| `frontend/src/styles/global.css` | @tailwind directives, base styles |
| `frontend/src/styles/theme.css` | CSS variable utilities, theme classes |
| `frontend/src/context/ThemeContext.tsx` | Runtime CSS injection |
| `frontend/src/types/theme.ts` | DesignTokens TypeScript interfaces |