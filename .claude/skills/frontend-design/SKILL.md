---
name: frontend-design
description: |
  Styles React components with Tailwind CSS utility-first approach and design tokens.
  Use when: Creating new UI components, styling existing components, implementing responsive layouts, working with the theme system, or building admin/storefront interfaces.
allowed-tools: Read, Edit, Write, Glob, Grep, Bash
---

# Frontend Design Skill

Luxia Products uses Tailwind CSS with a dynamic theme system powered by CSS custom properties. The platform features a luxury e-commerce aesthetic with mobile-first responsive design, dark/light theme support via `ThemeContext`, and consistent design tokens for colors, typography, and spacing.

## Quick Start

### Component with Theme Tokens

```tsx
// Use CSS variables injected by ThemeContext
function ProductCard({ product }: { product: Product }) {
  return (
    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg p-6 hover:shadow-lg transition-shadow">
      <h3 className="text-[var(--color-text-primary)] font-semibold text-lg">
        {product.name}
      </h3>
      <p className="text-[var(--color-text-secondary)] mt-2">
        {product.shortDescription}
      </p>
    </div>
  );
}
```

### Responsive Mobile-First Layout

```tsx
// Mobile-first: base styles are mobile, then scale up
<div className="px-4 md:px-6 lg:px-8 max-w-7xl mx-auto">
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
    {products.map(p => <ProductCard key={p.id} product={p} />)}
  </div>
</div>
```

## Key Concepts

| Concept | Usage | Example |
|---------|-------|---------|
| Theme tokens | Runtime CSS variables | `var(--color-primary)` |
| Mobile-first | Base = mobile, scale up | `text-sm md:text-base lg:text-lg` |
| Design tokens | Consistent spacing/colors | `space-4`, `rounded-lg` |
| Component variants | Conditional classes | `cn(base, variant && variantClass)` |

## Common Patterns

### Admin vs Storefront Styling

**Admin:** Functional, dense, data-focused
```tsx
<div className="bg-white dark:bg-gray-900 p-4 rounded-md border">
  <DataTable columns={columns} data={data} />
</div>
```

**Storefront:** Luxurious, spacious, brand-focused
```tsx
<section className="py-16 md:py-24 bg-gradient-to-b from-[var(--color-surface)] to-white">
  <div className="max-w-7xl mx-auto px-4">
    <h2 className="text-3xl md:text-4xl font-light tracking-wide">
      Featured Collection
    </h2>
  </div>
</section>
```

### Conditional Styling with cn()

```tsx
import { cn } from '../utils/cn';

function Button({ variant = 'primary', size = 'md', className, ...props }) {
  return (
    <button
      className={cn(
        'font-medium transition-colors focus:outline-none focus:ring-2',
        variant === 'primary' && 'bg-[var(--color-primary)] text-white hover:opacity-90',
        variant === 'secondary' && 'bg-transparent border border-current',
        size === 'sm' && 'px-3 py-1.5 text-sm',
        size === 'md' && 'px-4 py-2',
        size === 'lg' && 'px-6 py-3 text-lg',
        className
      )}
      {...props}
    />
  );
}
```

## See Also

- [aesthetics](references/aesthetics.md) - Typography, colors, visual identity
- [components](references/components.md) - Component styling patterns
- [layouts](references/layouts.md) - Grid systems, responsive design
- [motion](references/motion.md) - Animations and transitions
- [patterns](references/patterns.md) - DO/DON'T design decisions

## Related Skills

- See the **tailwind** skill for utility class patterns and configuration
- See the **react** skill for component architecture
- See the **typescript** skill for type-safe props and interfaces