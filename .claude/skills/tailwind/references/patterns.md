# Tailwind Patterns Reference

## Contents
- Brand Color System
- Dynamic Theme Variables
- Responsive Design Patterns
- Interactive Component Patterns
- Layout Patterns
- Anti-Patterns

---

## Brand Color System

Static brand colors defined in `frontend/tailwind.config.ts`:

```typescript
colors: {
  midnight: '#0c0f1d',    // Primary dark background
  champagne: '#f7ede2',   // Primary light text
  blush: '#e8c7c8',       // Accent/active states
  jade: '#0f7b6c'         // Interactive/success
}
```

**Usage:**

```tsx
// Primary dark theme (admin)
<div className="bg-midnight text-champagne">

// Active navigation item
<NavLink className="bg-blush text-midnight shadow-lg shadow-blush/20">

// Interactive hover states
<button className="bg-midnight hover:bg-jade text-champagne">
```

---

## Dynamic Theme Variables

CSS variables injected by `ThemeContext` from backend:

| Variable | Purpose |
|----------|---------|
| `--color-brand-primary` | Primary brand color |
| `--color-text-primary` | Main text color |
| `--color-text-inverse` | Text on dark backgrounds |
| `--color-background-primary` | Page background |
| `--color-background-elevated` | Card backgrounds |
| `--color-border-default` | Standard borders |
| `--color-interactive-hover` | Hover state color |
| `--border-radius-xl` | Large radius (cards) |
| `--shadow-lg` | Elevated shadow |

**Theme-Aware Components:**

```tsx
// Button with theme variables
<button className="btn-primary-solid">
  Themed Button
</button>

// Card using theme variables
<div className="card">
  Auto-themed card
</div>

// Manual theme variable usage
<div style={{ backgroundColor: 'var(--color-brand-primary)' }}>
  Direct variable access
</div>
```

---

## Responsive Design Patterns

### Mobile-First Breakpoints

```tsx
// Hidden on mobile, flex on desktop
<nav className="hidden lg:flex lg:items-center lg:gap-8">

// Column on mobile, row on desktop
<div className="flex flex-col md:flex-row gap-4 md:gap-8">

// Responsive padding
<main className="px-4 sm:px-6 lg:px-8 py-6 md:py-8">

// Responsive text
<h1 className="text-2xl md:text-3xl lg:text-4xl font-display">
```

### Container Pattern

```tsx
<div className="mx-auto max-w-7xl px-4">
  {/* Content constrained to 1280px with padding */}
</div>
```

---

## Interactive Component Patterns

### Group Hover Effect

```tsx
// Parent: group class
<article className="group relative rounded-3xl overflow-hidden">
  {/* Image always visible */}
  <img className="transition-transform group-hover:scale-105" />

  {/* Button hidden on mobile, appears on hover (desktop) */}
  <button className="absolute bottom-4 opacity-100 sm:opacity-0 
                     sm:group-hover:opacity-100 transition-all">
    Quick Add
  </button>
</article>
```

### Collapsible Sidebar

```tsx
<div className={`transition-all duration-300 ${
  collapsed ? 'lg:w-20' : 'lg:w-72'
}`}>
  {!collapsed && <span>Full Label</span>}
</div>
```

### Backdrop Blur Glass Effect

```tsx
<header className="sticky top-0 z-50 bg-bg-primary/95 backdrop-blur-xl 
                   border-b border-border-default shadow-sm">
```

---

## Layout Patterns

### Full Height Layout

```tsx
<div className="flex min-h-screen flex-col">
  <Navbar />
  <main className="flex-1">{children}</main>
  <Footer />
</div>
```

### Admin Sidebar Layout

```tsx
<div className="min-h-screen bg-midnight text-champagne">
  {/* Fixed sidebar */}
  <aside className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
    <nav className="flex grow flex-col gap-y-5 overflow-y-auto border-r 
                    border-white/10 bg-midnight/80 backdrop-blur px-6">
  </aside>

  {/* Main content with left padding */}
  <div className="lg:pl-72">
    <main className="px-4 py-8 sm:px-6 lg:px-8">{children}</main>
  </div>
</div>
```

### Responsive Grid

```tsx
<div className={`grid gap-8 ${
  columns === 2 ? 'md:grid-cols-2' :
  columns === 3 ? 'md:grid-cols-3' :
  'md:grid-cols-6'
}`}>
```

---

## Anti-Patterns

### WARNING: Inline Styles Over Tailwind

**The Problem:**

```tsx
// BAD - Mixing inline styles with Tailwind
<div className="p-4" style={{ backgroundColor: '#0c0f1d', color: '#f7ede2' }}>
```

**Why This Breaks:**
1. Duplicates values already in Tailwind config
2. Harder to maintain consistent design
3. No responsive/state variants available

**The Fix:**

```tsx
// GOOD - Use Tailwind classes
<div className="p-4 bg-midnight text-champagne">
```

**When You Might Be Tempted:** Dynamic values from API. Use CSS variables instead.

---

### WARNING: Arbitrary Values Over Config

**The Problem:**

```tsx
// BAD - Arbitrary values scattered everywhere
<div className="tracking-[0.3em] text-[#0c0f1d] rounded-[24px]">
```

**Why This Breaks:**
1. Creates inconsistent spacing/colors across app
2. Defeats purpose of design system
3. Hard to update globally

**The Fix:**

```typescript
// tailwind.config.ts - Add to config
extend: {
  letterSpacing: { luxury: '0.3em' },
  borderRadius: { '3xl': '24px' }
}
```

```tsx
// GOOD - Use configured values
<div className="tracking-luxury text-midnight rounded-3xl">
```

---

### WARNING: Forgetting Mobile-First

**The Problem:**

```tsx
// BAD - Desktop-first thinking
<div className="flex flex-row hidden md:flex-col md:block">
```

**Why This Breaks:**
1. Confusing override chains
2. Mobile users get desktop styles then overrides
3. Larger CSS output

**The Fix:**

```tsx
// GOOD - Mobile-first
<div className="flex flex-col md:flex-row">
  {/* Mobile: column, Desktop: row */}
</div>