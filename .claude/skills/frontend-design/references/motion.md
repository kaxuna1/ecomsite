# Motion Reference

## Contents
- Transition Patterns
- Hover Interactions
- Loading Animations
- Page Transitions
- Performance Considerations

---

## Transition Patterns

Luxia uses CSS transitions for most interactions. No heavy animation library—keep it performant.

### Standard Transitions

```tsx
// Quick feedback (hover states)
className="transition-colors duration-150"

// Smooth state changes
className="transition-all duration-200"

// Deliberate movements (modals, dropdowns)
className="transition-all duration-300"

// Slow, elegant reveals
className="transition-opacity duration-500"
```

### Transition Properties

```tsx
// Only animate what's needed
className="transition-colors"     // Background, text color
className="transition-opacity"    // Fade in/out
className="transition-transform"  // Scale, translate
className="transition-shadow"     // Box shadows
className="transition-all"        // Multiple properties (use sparingly)
```

---

## Hover Interactions

### Card Hover

```tsx
<article className="group">
  {/* Image zoom on hover */}
  <div className="overflow-hidden rounded-lg">
    <img 
      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
      src={imageUrl}
      alt=""
    />
  </div>
  
  {/* Shadow elevation */}
  <div className="mt-4 transition-shadow duration-200 hover:shadow-lg">
    {/* Card content */}
  </div>
</article>
```

### Button Hover

```tsx
// Primary button - subtle opacity change
<button className="bg-[var(--color-primary)] hover:opacity-90 transition-opacity">
  Add to Cart
</button>

// Secondary button - background fill
<button className="border border-current hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
  Learn More
</button>

// Ghost button - background reveal
<button className="hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
  Cancel
</button>
```

### Link Hover

```tsx
// Underline animation
<a className="relative inline-block after:absolute after:bottom-0 after:left-0 after:w-0 after:h-px after:bg-current after:transition-all hover:after:w-full">
  View Collection
</a>
```

---

## Loading Animations

### Skeleton Pulse

```tsx
<div className="animate-pulse space-y-4">
  <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded-lg" />
  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
</div>
```

### Spinner

```tsx
<div className="animate-spin rounded-full h-6 w-6 border-2 border-[var(--color-primary)] border-t-transparent" />
```

### Button Loading State

```tsx
<button disabled className="relative">
  <span className="opacity-0">Add to Cart</span>
  <span className="absolute inset-0 flex items-center justify-center">
    <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
  </span>
</button>
```

---

## Page Transitions

### Fade In on Mount

```tsx
// Simple CSS approach
<div className="animate-in fade-in duration-300">
  {/* Content fades in */}
</div>

// Or with Tailwind animation
<style>
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
</style>
<div className="animate-[fadeIn_0.3s_ease-out]">
  {/* Content */}
</div>
```

### Slide Up Entrance

```tsx
<div className="animate-[slideUp_0.3s_ease-out]">
  {/* Modal or dropdown content */}
</div>

// In your CSS or tailwind.config.js
// slideUp: translateY(8px) → translateY(0)
```

---

## Performance Considerations

### WARNING: Animating Layout Properties

**The Problem:**
```tsx
// BAD - Triggers layout recalculation
className="transition-all hover:w-64 hover:h-64 hover:padding-8"
```

**Why This Breaks:**
1. `width`, `height`, `padding`, `margin` trigger layout
2. Layout recalculation is expensive (jank)
3. Mobile devices struggle with complex layout animations

**The Fix:**
```tsx
// GOOD - Only animate compositor properties
className="transition-transform hover:scale-105"
className="transition-opacity hover:opacity-80"

// transform and opacity are GPU-accelerated
```

### Reduce Motion Preference

```tsx
// Respect user preferences
<div className="transition-transform duration-300 motion-reduce:transition-none motion-reduce:transform-none">
  {/* Animations disabled for users who prefer reduced motion */}
</div>
```

### Animation Checklist

Copy this checklist when adding animations:
- [ ] Only animate `transform` and `opacity` where possible
- [ ] Duration is appropriate (150-300ms for interactions)
- [ ] Motion reduced preference is respected
- [ ] No animation on page load that blocks content
- [ ] Test on mobile devices for jank