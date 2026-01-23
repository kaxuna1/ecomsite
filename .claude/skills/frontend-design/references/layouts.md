# Layouts Reference

## Contents
- Page Layout Structure
- Grid System
- Responsive Breakpoints
- Container Constraints
- Spacing Scale

---

## Page Layout Structure

Luxia uses two primary layouts: `Layout` for storefront and `AdminLayout` for admin panel.

### Storefront Layout

```tsx
// src/components/Layout.tsx pattern
<div className="min-h-screen flex flex-col">
  <Navbar />
  <main className="flex-1">
    {children}
  </main>
  <Footer />
</div>
```

### Admin Layout

```tsx
// Sidebar + content pattern
<div className="flex min-h-screen">
  <aside className="w-64 bg-gray-900 text-white fixed h-full">
    <nav className="p-4">{/* Navigation */}</nav>
  </aside>
  <main className="flex-1 ml-64 p-6 bg-gray-50 dark:bg-gray-950">
    {children}
  </main>
</div>
```

---

## Grid System

### Product Grid

```tsx
// Responsive product grid - mobile first
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
  {products.map(product => (
    <ProductCard key={product.id} product={product} />
  ))}
</div>
```

### Feature Grid

```tsx
// 2-column then 3-column layout
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
  {features.map(feature => (
    <FeatureCard key={feature.id} {...feature} />
  ))}
</div>
```

### Two-Column Content

```tsx
// Text + image side by side
<div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
  <div className="space-y-4">
    <h2 className="text-3xl font-light">Section Title</h2>
    <p className="text-[var(--color-text-secondary)] leading-relaxed">
      Description text here.
    </p>
  </div>
  <div className="aspect-[4/3] rounded-lg overflow-hidden">
    <img src={imageUrl} alt="" className="w-full h-full object-cover" />
  </div>
</div>
```

---

## Responsive Breakpoints

Tailwind's default breakpoints used throughout:

| Breakpoint | Width | Usage |
|------------|-------|-------|
| `sm` | 640px | 2-column grids |
| `md` | 768px | Tablet layouts |
| `lg` | 1024px | Desktop layouts |
| `xl` | 1280px | Wide desktop |
| `2xl` | 1536px | Ultra-wide |

### Mobile-First Pattern

```tsx
// ALWAYS start with mobile, then scale up
<div className="
  px-4          // Mobile: 16px padding
  md:px-6       // Tablet: 24px padding
  lg:px-8       // Desktop: 32px padding
">
  <h1 className="
    text-2xl      // Mobile: smaller
    md:text-3xl   // Tablet: medium
    lg:text-4xl   // Desktop: larger
  ">
    Responsive Heading
  </h1>
</div>
```

### WARNING: Desktop-First Styling

**The Problem:**
```tsx
// BAD - Desktop first requires overrides
<div className="px-8 sm:px-6 md:px-4">
```

**Why This Breaks:**
1. More overrides needed as you go smaller
2. Mental model is backwards
3. Mobile performance suffers loading unused desktop styles

**The Fix:**
```tsx
// GOOD - Mobile first, additive approach
<div className="px-4 md:px-6 lg:px-8">
```

---

## Container Constraints

### Page Container

```tsx
// Standard content container
<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
  {/* Content constrained to 1280px */}
</div>

// Narrow content (blog, text-heavy)
<div className="max-w-3xl mx-auto px-4">
  {/* Content constrained to 768px */}
</div>

// Full bleed section with contained content
<section className="bg-gray-100">
  <div className="max-w-7xl mx-auto px-4 py-16">
    {/* Background stretches, content contained */}
  </div>
</section>
```

---

## Spacing Scale

Use Tailwind's spacing scale consistently:

| Value | Pixels | Usage |
|-------|--------|-------|
| `1` | 4px | Icon gaps |
| `2` | 8px | Tight spacing |
| `4` | 16px | Component padding |
| `6` | 24px | Section gaps |
| `8` | 32px | Large gaps |
| `12` | 48px | Section padding (mobile) |
| `16` | 64px | Section padding (desktop) |
| `24` | 96px | Hero sections |

```tsx
// Vertical rhythm in sections
<section className="py-12 md:py-16 lg:py-24">
  <div className="space-y-8 md:space-y-12">
    <header className="space-y-4">
      <h2>Title</h2>
      <p>Subtitle</p>
    </header>
    <div className="grid gap-6 md:gap-8">
      {/* Cards */}
    </div>
  </div>
</section>