---
name: react-typescript-dev
description: Develop React 18 applications with TypeScript, Vite, and Tailwind CSS following best practices for type safety, component patterns, performance optimization, and testing. Use this skill when building modern React frontends, creating reusable UI components, implementing type-safe hooks, or setting up React + TypeScript projects with Vite and Tailwind.
---

# React TypeScript Development

## Overview

This skill provides comprehensive guidance for developing production-ready React 18 applications with TypeScript, Vite, and Tailwind CSS. Follow these standards to ensure type safety, maintainable code, optimal performance, and comprehensive testing coverage.

## Stack Standards

### Core Technologies
- **React 18** with TypeScript strict mode enabled
- **Vite** for build tooling and development server
- **Tailwind CSS** for utility-first styling
- **Functional components** with hooks (no class components)
- **Component composition** over inheritance

### TypeScript Configuration
Enable strict mode in tsconfig.json:
```json
{
  "compilerOptions": {
    "strict": true,
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx"
  }
}
```

## Code Patterns

### Component Typing
Use `React.FC<Props>` or explicit function types for components:

```typescript
// Preferred: Explicit function type
interface ButtonProps {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
}

function Button({ label, onClick, variant = 'primary', disabled = false }: ButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={variant === 'primary' ? 'bg-blue-500 text-white' : 'bg-gray-200'}
    >
      {label}
    </button>
  );
}

// Alternative: React.FC
const Button: React.FC<ButtonProps> = ({ label, onClick, variant = 'primary', disabled = false }) => {
  // ... implementation
};
```

### Custom Hooks
Create reusable logic with custom hooks (prefix with `use`):

```typescript
// hooks/useLocalStorage.ts
function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(error);
      return initialValue;
    }
  });

  const setValue = (value: T) => {
    try {
      setStoredValue(value);
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(error);
    }
  };

  return [storedValue, setValue];
}
```

### Lazy Loading
Use lazy loading for route components to improve initial load time:

```typescript
import { lazy, Suspense } from 'react';

const Dashboard = lazy(() => import('./features/dashboard/Dashboard'));
const Profile = lazy(() => import('./features/profile/Profile'));

function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/profile" element={<Profile />} />
      </Routes>
    </Suspense>
  );
}
```

### Error Boundaries
Implement error boundaries for resilience:

```typescript
// components/ErrorBoundary.tsx
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <h1>Something went wrong.</h1>;
    }

    return this.props.children;
  }
}
```

### Memoization
Use memoization for expensive operations and preventing unnecessary re-renders:

```typescript
import { useMemo, useCallback, memo } from 'react';

// Memoize expensive calculations
function ExpensiveList({ items }: { items: Item[] }) {
  const sortedItems = useMemo(() => {
    return items.sort((a, b) => a.value - b.value);
  }, [items]);

  const handleClick = useCallback((id: string) => {
    console.log('Clicked:', id);
  }, []);

  return (
    <div>
      {sortedItems.map(item => (
        <ItemRow key={item.id} item={item} onClick={handleClick} />
      ))}
    </div>
  );
}

// Memoize component to prevent re-renders
const ItemRow = memo(function ItemRow({
  item,
  onClick
}: {
  item: Item;
  onClick: (id: string) => void
}) {
  return <div onClick={() => onClick(item.id)}>{item.name}</div>;
});
```

## File Structure

Organize code by feature rather than by type:

```
src/
  components/         # Reusable UI components
    Button/
      Button.tsx
      Button.test.tsx
    Card/
      Card.tsx
      Card.test.tsx
  features/           # Feature-based modules
    auth/
      components/
      hooks/
      api/
      types.ts
    dashboard/
      components/
      hooks/
      api/
      types.ts
  hooks/              # Shared custom hooks
    useLocalStorage.ts
    useDebounce.ts
  types/              # Shared TypeScript types
    api.ts
    models.ts
  utils/              # Helper functions
    formatters.ts
    validators.ts
  api/                # API client layer
    client.ts
    endpoints.ts
  App.tsx
  main.tsx
```

## Testing Requirements

### Unit Tests with Vitest
Configure Vitest for unit testing:

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
});
```

### Component Tests with React Testing Library
Test components focusing on user behavior:

```typescript
// Button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Button from './Button';

describe('Button', () => {
  it('renders with correct label', () => {
    render(<Button label="Click me" onClick={() => {}} />);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const handleClick = vi.fn();
    render(<Button label="Click me" onClick={handleClick} />);

    fireEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('is disabled when disabled prop is true', () => {
    render(<Button label="Click me" onClick={() => {}} disabled />);
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
```

### E2E Tests with Playwright
Write end-to-end tests for critical user flows:

```typescript
// e2e/auth.spec.ts
import { test, expect } from '@playwright/test';

test('user can sign in', async ({ page }) => {
  await page.goto('http://localhost:5173/login');

  await page.fill('input[name="email"]', 'user@example.com');
  await page.fill('input[name="password"]', 'password123');
  await page.click('button[type="submit"]');

  await expect(page).toHaveURL('http://localhost:5173/dashboard');
  await expect(page.getByText('Welcome back')).toBeVisible();
});
```

## Performance Guidelines

### Code Splitting by Route
Split code at route boundaries using lazy loading (see Code Patterns section above).

### Virtual Scrolling for Long Lists
Use libraries like `react-virtual` or `react-window` for rendering large lists:

```typescript
import { useVirtualizer } from '@tanstack/react-virtual';

function VirtualList({ items }: { items: Item[] }) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 50,
  });

  return (
    <div ref={parentRef} style={{ height: '400px', overflow: 'auto' }}>
      <div style={{ height: `${virtualizer.getTotalSize()}px`, position: 'relative' }}>
        {virtualizer.getVirtualItems().map(virtualItem => (
          <div
            key={virtualItem.index}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${virtualItem.size}px`,
              transform: `translateY(${virtualItem.start}px)`,
            }}
          >
            {items[virtualItem.index].name}
          </div>
        ))}
      </div>
    </div>
  );
}
```

### Optimize Re-renders with React.memo
Memoize components that receive the same props frequently (see Code Patterns section above).

### Tailwind JIT Mode
Ensure Tailwind's JIT (Just-In-Time) mode is enabled for optimal CSS generation:

```javascript
// tailwind.config.js
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {},
  },
  plugins: [],
};
```

## Development Workflow

### Initial Setup
1. Create new Vite project: `npm create vite@latest my-app -- --template react-ts`
2. Install Tailwind CSS: `npm install -D tailwindcss postcss autoprefixer && npx tailwindcss init -p`
3. Configure Tailwind in `tailwind.config.js` and add directives to `src/index.css`
4. Install testing dependencies: `npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom`
5. Configure Vitest in `vite.config.ts`

### Development Best Practices
- Run type checking in watch mode: `tsc --noEmit --watch`
- Use ESLint with TypeScript and React plugins
- Format code with Prettier
- Commit frequently with meaningful messages
- Write tests alongside features
- Review bundle size regularly: `npm run build` and check `dist/` sizes

## Resources

This skill includes bundled resources to accelerate development:

### assets/
Template configuration files for quick project setup:
- `vite.config.ts` - Vite configuration with Vitest setup
- `tsconfig.json` - TypeScript strict mode configuration
- `tailwind.config.js` - Tailwind CSS configuration
- `ComponentTemplate.tsx` - Example component following best practices

### references/
Detailed guides for advanced patterns:
- `advanced-patterns.md` - Advanced TypeScript patterns, state management, and architectural guidance
- `tailwind-utilities.md` - Common Tailwind utility combinations and custom configurations
