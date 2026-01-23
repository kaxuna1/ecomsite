# Patterns Reference

## Contents
- DO/DON'T Design Decisions
- Anti-Patterns to Avoid
- Luxia-Specific Patterns
- Visual Differentiation
- When to Break Rules

---

## DO/DON'T Design Decisions

### Color Usage

```tsx
// DO - Use theme tokens for brand consistency
<button className="bg-[var(--color-primary)]">

// DON'T - Hardcode colors that break theming
<button className="bg-purple-600">
```

### Typography

```tsx
// DO - Consistent heading hierarchy
<h1 className="text-4xl font-light">Hero</h1>
<h2 className="text-2xl font-medium">Section</h2>
<h3 className="text-lg font-semibold">Card</h3>

// DON'T - Random sizes and weights
<h1 className="text-3xl font-bold">Hero</h1>
<h2 className="text-4xl font-black">Section</h2>
```

### Spacing

```tsx
// DO - Use consistent spacing scale
<div className="space-y-4">
<section className="py-16 md:py-24">

// DON'T - Arbitrary pixel values
<div className="mb-[17px] mt-[23px]">
```

---

## Anti-Patterns to Avoid

### WARNING: Generic AI Aesthetic

**The Problem:**
```tsx
// BAD - The "AI designed this" starter pack
<div className="bg-gradient-to-r from-purple-600 to-blue-500 rounded-3xl">
  <h1 className="font-bold text-white">
    Welcome to Our Platform
  </h1>
</div>
```

**Why This Breaks:**
1. Every AI-generated site looks identical
2. Purple/blue gradients scream "template"
3. Rounded corners everywhere lacks sophistication
4. Doesn't match Luxia's luxury skincare brand

**The Fix:**
```tsx
// GOOD - Luxia's refined aesthetic
<div className="bg-gradient-to-b from-[var(--color-surface)] to-white py-24">
  <h1 className="text-4xl font-light tracking-wide text-[var(--color-text-primary)]">
    Luxia Scalp Care
  </h1>
</div>
```

**When You Might Be Tempted:**
- "I need something that looks modern quickly"
- "Purple/blue is popular, must be good"
- Solution: Stick to the established theme tokens

---

### WARNING: Over-Rounded Everything

**The Problem:**
```tsx
// BAD - Pills and circles everywhere
<div className="rounded-full p-8">
  <button className="rounded-full">Click</button>
  <img className="rounded-full" /> {/* Not an avatar */}
</div>
```

**Why This Breaks:**
1. Loses visual hierarchy (everything same roundness)
2. rounded-full on rectangles looks amateurish
3. Luxury brands use subtle, intentional rounding

**The Fix:**
```tsx
// GOOD - Intentional corner radius
<div className="rounded-lg p-8">        {/* Cards: rounded-lg */}
  <button className="rounded-lg">Click</button>
  <img className="rounded-full" />      {/* Only avatars/icons: rounded-full */}
</div>
```

---

### WARNING: Shadow Soup

**The Problem:**
```tsx
// BAD - Shadows on everything
<div className="shadow-2xl">
  <div className="shadow-xl">
    <div className="shadow-lg">
      Content drowning in shadows
    </div>
  </div>
</div>
```

**Why This Breaks:**
1. No elevation hierarchy
2. Visual noise overwhelms content
3. Looks muddy, especially in dark mode

**The Fix:**
```tsx
// GOOD - Purposeful elevation
<div className="shadow-sm">                          {/* Base card */}
  <div className="hover:shadow-md transition-shadow"> {/* Interactive */}
    <div className="shadow-lg">                       {/* Modal/overlay */}
```

---

## Luxia-Specific Patterns

### Hero Sections

```tsx
// Spacious, elegant, brand-focused
<section className="relative py-24 md:py-32 lg:py-40">
  <div className="max-w-4xl mx-auto text-center px-4">
    <h1 className="text-4xl md:text-5xl lg:text-6xl font-light tracking-wide">
      Nourish Your Scalp
    </h1>
    <p className="mt-6 text-xl text-[var(--color-text-secondary)] max-w-2xl mx-auto">
      Premium hair care crafted for lasting results
    </p>
    <div className="mt-10">
      <Button size="lg">Shop Collection</Button>
    </div>
  </div>
</section>
```

### Product Showcase

```tsx
// Clean grid with hover states
<div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
  {products.map(product => (
    <article key={product.id} className="group">
      <div className="aspect-square overflow-hidden rounded-lg bg-gray-100">
        <img 
          src={product.image_url}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
      </div>
      <div className="mt-4">
        <h3 className="font-medium">{product.name}</h3>
        <p className="text-[var(--color-text-secondary)]">${product.price}</p>
      </div>
    </article>
  ))}
</div>
```

---

## Visual Differentiation

### What Makes Luxia's Design Distinctive

1. **Light font weights** - h1 uses `font-light`, not bold
2. **Wide tracking** - Headlines have `tracking-wide` for elegance
3. **Generous whitespace** - Sections have 16-24 units of padding
4. **Muted color palette** - Neutral backgrounds, accent colors sparingly
5. **Subtle shadows** - `shadow-sm` default, `shadow-lg` for modals only

### Admin vs Storefront

| Element | Storefront | Admin |
|---------|------------|-------|
| Typography | Light, elegant | Dense, functional |
| Spacing | Generous (py-24) | Compact (p-4, p-6) |
| Colors | Brand palette | Gray-based neutral |
| Shadows | Subtle hover states | Minimal |
| Borders | Subtle or none | Visible structure |

---

## When to Break Rules

### Promotional Sections

For sale banners or limited campaigns, more vibrant styling is acceptable:

```tsx
// Exception: Sale banner can be more attention-grabbing
<div className="bg-red-600 text-white py-2 text-center">
  <p className="font-medium">Summer Sale - 20% Off All Serums</p>
</div>
```

### Empty States

More personality is welcome when users need encouragement:

```tsx
<div className="text-center py-16">
  <div className="text-6xl mb-4">🛒</div>
  <h2 className="text-xl font-medium">Your cart is empty</h2>
  <p className="text-[var(--color-text-secondary)] mt-2">
    Time to treat yourself to something special
  </p>
</div>
```

### Rule-Breaking Checklist

Before deviating from patterns:
- [ ] Is this a special case (promo, empty state, error)?
- [ ] Does it still feel like Luxia's brand?
- [ ] Is the deviation intentional, not accidental?
- [ ] Would a user notice inconsistency negatively?