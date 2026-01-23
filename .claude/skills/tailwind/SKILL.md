---
name: tailwind
description: |
  TailwindCSS utility-first styling and dynamic theme system for Luxia e-commerce frontend.
  Use when: styling React components, creating responsive layouts, implementing the dynamic theme system, working with design tokens, or building admin/storefront UI.
allowed-tools: Read, Edit, Write, Glob, Grep, Bash
---

# Tailwind Skill

Luxia uses Tailwind CSS with a **dynamic theme system** where CSS variables are injected at runtime from the backend database. This enables admin-configurable themes without redeployment. The project combines static Tailwind utilities (brand colors, fonts) with dynamic CSS custom properties for theme-aware components.

## Quick Start

### Static Brand Colors

```tsx
// Use brand colors defined in tailwind.config.ts
<div className="bg-midnight text-champagne hover:text-jade">
  Luxury brand styling
</div>
```

### Dynamic Theme Variables

```tsx
// Use CSS variables injected by ThemeContext
<div className="bg-bg-primary text-text-primary border-border-default">
  Theme-aware component
</div>
```

### Responsive Mobile-First Pattern

```tsx
// Mobile-first: base → sm → md → lg → xl
<div className="flex flex-col md:flex-row gap-4 lg:gap-8 p-4 md:p-6 lg:p-8">
  <main className="flex-1">Content</main>
  <aside className="hidden lg:block w-64">Sidebar</aside>
</div>
```

## Key Concepts

| Concept | Usage | Example |
|---------|-------|---------|
| Brand colors | Static theme tokens | `bg-midnight`, `text-champagne`, `border-jade` |
| Theme vars | Dynamic from backend | `bg-bg-primary`, `text-text-inverse` |
| Opacity modifiers | Subtle variations | `bg-white/10`, `text-champagne/60` |
| Group hover | Parent-child interaction | `group` + `group-hover:opacity-100` |
| Responsive hiding | Mobile-first visibility | `hidden lg:flex` |
| Backdrop blur | Glass morphism | `backdrop-blur-xl bg-midnight/80` |

## Common Patterns

### Interactive Card with Group Hover

```tsx
<article className="group relative overflow-hidden rounded-3xl border border-border-default/40 
                    bg-bg-primary shadow-lg transition-shadow hover:shadow-2xl">
  <button className="absolute bottom-4 opacity-0 group-hover:opacity-100 transition-opacity">
    Quick Add
  </button>
</article>
```

### Responsive Navigation

```tsx
<nav className="sticky top-0 z-50 bg-bg-primary/95 backdrop-blur-xl border-b border-border-default">
  <div className="mx-auto max-w-7xl px-4">
    <button className="lg:hidden">Mobile Menu</button>
    <div className="hidden lg:flex lg:gap-8">Desktop Nav</div>
  </div>
</nav>
```

## See Also

- [patterns](references/patterns.md) - Utility combinations, theme integration, spacing
- [workflows](references/workflows.md) - Adding components, theme customization, responsive design

## Related Skills

For React component patterns, see the **react** skill. For form styling with validation states, see the **react-hook-form** skill. For TypeScript interfaces for design tokens, see the **typescript** skill.