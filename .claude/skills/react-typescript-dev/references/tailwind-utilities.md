# Tailwind CSS Utilities Reference

## Table of Contents
- [Common Component Patterns](#common-component-patterns)
- [Layout Utilities](#layout-utilities)
- [Typography](#typography)
- [Color Schemes](#color-schemes)
- [Spacing System](#spacing-system)
- [Responsive Design](#responsive-design)
- [Dark Mode](#dark-mode)
- [Custom Configurations](#custom-configurations)
- [Animation Utilities](#animation-utilities)

## Common Component Patterns

### Button Styles

```tsx
// Primary Button
<button className="
  rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white
  hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
  disabled:cursor-not-allowed disabled:opacity-50
  transition-colors
">
  Primary Button
</button>

// Secondary Button
<button className="
  rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700
  hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
  disabled:cursor-not-allowed disabled:opacity-50
  transition-colors
">
  Secondary Button
</button>

// Danger Button
<button className="
  rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white
  hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2
  disabled:cursor-not-allowed disabled:opacity-50
  transition-colors
">
  Danger Button
</button>

// Ghost Button
<button className="
  rounded-md px-4 py-2 text-sm font-medium text-gray-700
  hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
  disabled:cursor-not-allowed disabled:opacity-50
  transition-colors
">
  Ghost Button
</button>
```

### Card Components

```tsx
// Basic Card
<div className="
  rounded-lg border border-gray-200 bg-white p-6 shadow-sm
  hover:shadow-md transition-shadow
">
  Card content
</div>

// Card with Header
<div className="rounded-lg border border-gray-200 bg-white shadow-sm">
  <div className="border-b border-gray-200 px-6 py-4">
    <h3 className="text-lg font-semibold text-gray-900">Card Title</h3>
  </div>
  <div className="p-6">Card content</div>
</div>

// Elevated Card
<div className="
  rounded-xl bg-white p-6 shadow-lg
  hover:shadow-xl transition-shadow
">
  Elevated card content
</div>
```

### Input Fields

```tsx
// Text Input
<input
  type="text"
  className="
    w-full rounded-md border border-gray-300 px-3 py-2 text-sm
    placeholder:text-gray-400
    focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500
    disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500
  "
  placeholder="Enter text..."
/>

// Input with Label
<div className="space-y-1">
  <label className="block text-sm font-medium text-gray-700">
    Email address
  </label>
  <input
    type="email"
    className="
      w-full rounded-md border border-gray-300 px-3 py-2 text-sm
      focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500
    "
    placeholder="you@example.com"
  />
</div>

// Input with Error
<div className="space-y-1">
  <label className="block text-sm font-medium text-gray-700">
    Password
  </label>
  <input
    type="password"
    className="
      w-full rounded-md border border-red-300 px-3 py-2 text-sm
      focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500
    "
  />
  <p className="text-sm text-red-600">Password is required</p>
</div>
```

### Badge/Tag Components

```tsx
// Basic Badge
<span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
  Badge
</span>

// Badge Variants
<span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
  Success
</span>

<span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
  Error
</span>

<span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">
  Warning
</span>

<span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
  Default
</span>
```

### Modal/Dialog

```tsx
// Modal Overlay
<div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
  {/* Modal Content */}
  <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
    <h2 className="mb-4 text-xl font-semibold text-gray-900">Modal Title</h2>
    <p className="mb-6 text-gray-600">Modal content goes here</p>
    <div className="flex justify-end space-x-2">
      <button className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
        Cancel
      </button>
      <button className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
        Confirm
      </button>
    </div>
  </div>
</div>
```

## Layout Utilities

### Flexbox Patterns

```tsx
// Horizontal Stack with Gap
<div className="flex items-center gap-4">
  <div>Item 1</div>
  <div>Item 2</div>
</div>

// Vertical Stack
<div className="flex flex-col gap-4">
  <div>Item 1</div>
  <div>Item 2</div>
</div>

// Space Between
<div className="flex items-center justify-between">
  <div>Left</div>
  <div>Right</div>
</div>

// Centered Content
<div className="flex h-screen items-center justify-center">
  <div>Centered</div>
</div>
```

### Grid Layouts

```tsx
// Responsive Grid
<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
  <div>Item 1</div>
  <div>Item 2</div>
  <div>Item 3</div>
  <div>Item 4</div>
</div>

// Auto-fit Grid
<div className="grid auto-fit-[minmax(250px,1fr)] gap-4">
  <div>Item 1</div>
  <div>Item 2</div>
</div>

// Grid with Span
<div className="grid grid-cols-6 gap-4">
  <div className="col-span-2">Sidebar</div>
  <div className="col-span-4">Main Content</div>
</div>
```

### Container Patterns

```tsx
// Page Container
<div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
  Content
</div>

// Narrow Container
<div className="mx-auto max-w-2xl px-4 py-8">
  Content
</div>

// Full Width Section with Inner Container
<section className="bg-gray-50 py-12">
  <div className="mx-auto max-w-7xl px-4">
    Content
  </div>
</section>
```

## Typography

### Heading Hierarchy

```tsx
<h1 className="text-4xl font-bold text-gray-900 sm:text-5xl lg:text-6xl">
  Main Heading
</h1>

<h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
  Section Heading
</h2>

<h3 className="text-2xl font-semibold text-gray-900 sm:text-3xl">
  Subsection Heading
</h3>

<h4 className="text-xl font-semibold text-gray-900">
  Minor Heading
</h4>
```

### Body Text

```tsx
// Large Body
<p className="text-lg text-gray-600">
  Large body text for introductions or emphasis.
</p>

// Normal Body
<p className="text-base text-gray-700">
  Regular body text for main content.
</p>

// Small Text
<p className="text-sm text-gray-600">
  Small text for captions or secondary information.
</p>

// Extra Small
<p className="text-xs text-gray-500">
  Extra small text for footnotes or metadata.
</p>
```

### Text Truncation

```tsx
// Single Line Truncate
<p className="truncate">
  This text will be truncated with an ellipsis if it's too long
</p>

// Multi-line Truncate (2 lines)
<p className="line-clamp-2">
  This text will be truncated after two lines with an ellipsis
</p>

// Multi-line Truncate (3 lines)
<p className="line-clamp-3">
  This text will be truncated after three lines with an ellipsis
</p>
```

## Color Schemes

### Blue Theme

```tsx
// Primary: bg-blue-600, text-white
// Hover: bg-blue-700
// Focus: ring-blue-500
// Light: bg-blue-50, text-blue-900
```

### Green Theme (Success)

```tsx
// Primary: bg-green-600, text-white
// Hover: bg-green-700
// Focus: ring-green-500
// Light: bg-green-50, text-green-900
```

### Red Theme (Danger)

```tsx
// Primary: bg-red-600, text-white
// Hover: bg-red-700
// Focus: ring-red-500
// Light: bg-red-50, text-red-900
```

### Purple Theme

```tsx
// Primary: bg-purple-600, text-white
// Hover: bg-purple-700
// Focus: ring-purple-500
// Light: bg-purple-50, text-purple-900
```

## Spacing System

Tailwind uses a consistent spacing scale (1 unit = 0.25rem = 4px):

```
0   = 0px
1   = 4px
2   = 8px
3   = 12px
4   = 16px
5   = 20px
6   = 24px
8   = 32px
10  = 40px
12  = 48px
16  = 64px
20  = 80px
24  = 96px
32  = 128px
```

## Responsive Design

### Breakpoints

```
sm: 640px   - Small tablets
md: 768px   - Tablets
lg: 1024px  - Laptops
xl: 1280px  - Desktops
2xl: 1536px - Large desktops
```

### Responsive Patterns

```tsx
// Mobile-first approach
<div className="
  text-sm sm:text-base md:text-lg lg:text-xl
  p-4 sm:p-6 md:p-8 lg:p-10
  grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3
">
  Responsive content
</div>

// Hide/Show at breakpoints
<div className="hidden md:block">
  Only visible on medium screens and up
</div>

<div className="block md:hidden">
  Only visible on small screens
</div>
```

## Dark Mode

### Setup

```javascript
// tailwind.config.js
module.exports = {
  darkMode: 'class', // or 'media' for system preference
  // ...
}
```

### Usage Patterns

```tsx
// Background and Text
<div className="bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-100">
  Content
</div>

// Buttons
<button className="
  bg-blue-600 text-white
  hover:bg-blue-700
  dark:bg-blue-500 dark:hover:bg-blue-600
">
  Button
</button>

// Borders
<div className="border border-gray-200 dark:border-gray-700">
  Card
</div>

// Complete Dark Mode Card
<div className="
  rounded-lg border border-gray-200 bg-white p-6 shadow-sm
  dark:border-gray-700 dark:bg-gray-800
">
  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
    Title
  </h3>
  <p className="mt-2 text-gray-600 dark:text-gray-300">
    Description
  </p>
</div>
```

## Custom Configurations

### Extending Theme

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          500: '#0ea5e9',
          900: '#0c4a6e',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Poppins', 'sans-serif'],
      },
      spacing: {
        '72': '18rem',
        '84': '21rem',
        '96': '24rem',
      },
      borderRadius: {
        '4xl': '2rem',
      },
    },
  },
}
```

### Custom Utilities

```javascript
// tailwind.config.js
module.exports = {
  plugins: [
    function({ addUtilities }) {
      const newUtilities = {
        '.text-shadow': {
          textShadow: '0 2px 4px rgba(0,0,0,0.10)',
        },
        '.text-shadow-md': {
          textShadow: '0 4px 8px rgba(0,0,0,0.12)',
        },
        '.text-shadow-lg': {
          textShadow: '0 8px 16px rgba(0,0,0,0.15)',
        },
      }
      addUtilities(newUtilities)
    }
  ],
}
```

## Animation Utilities

### Transitions

```tsx
// Simple Transition
<div className="transition-colors hover:bg-blue-100">
  Hover me
</div>

// Custom Duration
<div className="transition-all duration-300 hover:scale-105">
  Hover me
</div>

// Multiple Properties
<div className="transition-[background-color,transform] duration-200 ease-in-out">
  Smooth transitions
</div>
```

### Animations

```tsx
// Spin
<div className="animate-spin">Loading...</div>

// Ping
<div className="animate-ping">Notification</div>

// Pulse
<div className="animate-pulse">Loading skeleton</div>

// Bounce
<div className="animate-bounce">Bounce effect</div>
```

### Custom Animations

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      keyframes: {
        slideIn: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      animation: {
        slideIn: 'slideIn 0.3s ease-out',
        fadeIn: 'fadeIn 0.5s ease-in',
      },
    },
  },
}
```

Usage:
```tsx
<div className="animate-slideIn">Slides in from left</div>
<div className="animate-fadeIn">Fades in</div>
```

## Performance Tips

1. **Use JIT Mode**: Enabled by default in Tailwind 3+
2. **Purge Unused Styles**: Configure `content` in tailwind.config.js
3. **Avoid Arbitrary Values**: Use theme values when possible
4. **Use `@apply` Sparingly**: Keep markup declarative
5. **Group Responsive Classes**: Mobile-first approach is more efficient

## Useful Plugins

```bash
# Forms plugin
npm install -D @tailwindcss/forms

# Typography plugin
npm install -D @tailwindcss/typography

# Line clamp plugin (for text truncation)
npm install -D @tailwindcss/line-clamp

# Container queries
npm install -D @tailwindcss/container-queries
```

Add to tailwind.config.js:
```javascript
module.exports = {
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
    require('@tailwindcss/line-clamp'),
    require('@tailwindcss/container-queries'),
  ],
}
```
