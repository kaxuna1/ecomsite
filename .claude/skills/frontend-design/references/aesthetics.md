# Aesthetics Reference

## Contents
- Typography System
- Color System
- Visual Identity
- Dark Mode Implementation
- Design Token Usage

---

## Typography System

Luxia uses a refined typography scale for luxury e-commerce. The project relies on system fonts with Tailwind's default stack, enhanced with letter-spacing for elegance.

### Heading Hierarchy

```tsx
// Hero headlines - light weight, wide tracking
<h1 className="text-4xl md:text-5xl lg:text-6xl font-light tracking-wide">
  Luxia Scalp Care
</h1>

// Section headers - medium weight
<h2 className="text-2xl md:text-3xl font-medium tracking-tight">
  Our Collection
</h2>

// Card titles - semibold for density
<h3 className="text-lg font-semibold">
  Revitalizing Serum
</h3>

// Body text - regular weight, comfortable line height
<p className="text-base leading-relaxed text-gray-600 dark:text-gray-400">
  Product description here.
</p>
```

### WARNING: Inconsistent Font Weights

**The Problem:**
```tsx
// BAD - Random font weights destroy visual hierarchy
<h1 className="font-bold">Hero</h1>
<h2 className="font-black">Section</h2>
<h3 className="font-bold">Card</h3>
```

**Why This Breaks:**
1. No clear hierarchy when everything is bold
2. Luxury brands use lighter weights for sophistication
3. Dense admin UIs need weight variation for scannability

**The Fix:**
```tsx
// GOOD - Deliberate weight progression
<h1 className="font-light">Hero</h1>      // Elegant, spacious
<h2 className="font-medium">Section</h2>  // Readable, structured
<h3 className="font-semibold">Card</h3>   // Dense, functional
```

---

## Color System

The theme system injects CSS variables at runtime via `ThemeContext`. Always use these tokens instead of hardcoded Tailwind colors.

### Primary Tokens

```tsx
// Surface colors
className="bg-[var(--color-background)]"     // Page background
className="bg-[var(--color-surface)]"        // Card/panel background
className="border-[var(--color-border)]"     // Borders and dividers

// Text colors
className="text-[var(--color-text-primary)]"   // Headlines, important text
className="text-[var(--color-text-secondary)]" // Body text, descriptions
className="text-[var(--color-text-muted)]"     // Captions, hints

// Brand colors
className="bg-[var(--color-primary)]"        // Primary actions
className="bg-[var(--color-accent)]"         // Highlights, badges
```

### WARNING: Hardcoded Colors

**The Problem:**
```tsx
// BAD - Breaks when theme changes
<button className="bg-purple-600 text-white">Buy Now</button>
<p className="text-gray-500">Description</p>
```

**Why This Breaks:**
1. Theme changes have no effect on hardcoded colors
2. Dark mode will look broken
3. Admin can't customize brand colors

**The Fix:**
```tsx
// GOOD - Uses theme tokens
<button className="bg-[var(--color-primary)] text-white">Buy Now</button>
<p className="text-[var(--color-text-secondary)]">Description</p>
```

---

## Visual Identity

Luxia's aesthetic: **clean luxury** — not flashy, not minimal to the point of sterile. Think premium skincare packaging.

### Signature Elements

```tsx
// Subtle shadows instead of harsh borders
<div className="shadow-sm hover:shadow-md transition-shadow">

// Generous padding for breathing room
<section className="py-16 md:py-24">

// Soft rounded corners, never fully rounded on cards
<div className="rounded-lg">  // GOOD
<div className="rounded-full"> // Only for avatars/badges

// Muted backgrounds with subtle gradients
<div className="bg-gradient-to-b from-gray-50 to-white">
```

---

## Dark Mode Implementation

Dark mode is handled via Tailwind's `dark:` variant combined with theme tokens.

```tsx
// Component adapts to both modes
<div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
  <p className="text-gray-600 dark:text-gray-400">
    Adapts automatically
  </p>
</div>

// Or use theme tokens (preferred)
<div className="bg-[var(--color-surface)] text-[var(--color-text-primary)]">
  Theme-aware content
</div>
```

### Dark Mode Checklist

Copy this checklist when building new components:
- [ ] Text colors have dark: variants or use theme tokens
- [ ] Background colors adapt
- [ ] Borders are visible in both modes
- [ ] Shadows are subtle (not harsh black in dark mode)
- [ ] Images/icons have appropriate contrast