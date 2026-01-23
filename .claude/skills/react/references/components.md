# Components Reference

## Contents
- Component Structure
- Props Patterns
- Generic Components
- Composition Patterns
- Anti-Patterns

## Component Structure

All components are functional with TypeScript interfaces. Located in `frontend/src/components/`.

### Basic Component Pattern

```typescript
// frontend/src/components/ProductCard.tsx
interface ProductCardProps {
  product: Product;
  index?: number;
  showFavorite?: boolean;
}

export function ProductCard({ 
  product, 
  index = 0,
  showFavorite = true 
}: ProductCardProps) {
  const { addItem } = useCart();
  const { isAuthenticated } = useAuth();
  const [isAdding, setIsAdding] = useState(false);
  
  // Derived state - no useState needed
  const hasDiscount = product.salePrice && product.salePrice < product.price;
  
  return (
    <article className="product-card">
      {hasDiscount && <span className="badge">Sale</span>}
      <img src={product.imageUrl} alt={product.name} loading="lazy" />
      <h3>{product.name}</h3>
      <p>{hasDiscount ? product.salePrice : product.price}</p>
    </article>
  );
}
```

### Page Component Pattern

```typescript
// frontend/src/pages/ProductsPage.tsx
export default function ProductsPage() {
  const { lang } = useParams<{ lang: string }>();
  const [filters, setFilters] = useState<ProductFilters>({});
  
  const { data, isLoading, error } = useQuery({
    queryKey: ['products', filters, lang],
    queryFn: () => fetchProducts(filters)
  });

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;
  
  return (
    <Layout>
      <ProductFilters value={filters} onChange={setFilters} />
      <ProductGrid products={data?.products ?? []} />
    </Layout>
  );
}
```

## Generic Components

### DataTable - Generic TypeScript Component

```typescript
// frontend/src/components/admin/DataTable.tsx
export interface Column<T> {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (item: T) => ReactNode;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T) => string | number;
  loading?: boolean;
  onRowClick?: (item: T) => void;
}

export default function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  keyExtractor,
  loading = false,
  onRowClick
}: DataTableProps<T>) {
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc';
  } | null>(null);

  // Sorting logic...
  
  return (
    <table>
      <thead>
        {columns.map(col => (
          <th key={col.key} onClick={() => col.sortable && handleSort(col.key)}>
            {col.label}
          </th>
        ))}
      </thead>
      <tbody>
        {data.map(item => (
          <tr key={keyExtractor(item)} onClick={() => onRowClick?.(item)}>
            {columns.map(col => (
              <td key={col.key}>
                {col.render ? col.render(item) : String(item[col.key])}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

Usage:

```typescript
<DataTable<Product>
  columns={[
    { key: 'name', label: 'Product', sortable: true },
    { key: 'price', label: 'Price', render: (p) => `$${p.price}` },
    { key: 'inventory', label: 'Stock', sortable: true }
  ]}
  data={products}
  keyExtractor={(p) => p.id}
  onRowClick={(p) => navigate(`/admin/products/${p.id}`)}
/>
```

## Composition Patterns

### Children Props

```typescript
// Layout wrapper
interface LayoutProps {
  children: ReactNode;
  title?: string;
}

export function Layout({ children, title }: LayoutProps) {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main>{children}</main>
      <Footer />
    </div>
  );
}
```

### Render Props

```typescript
// VariantSelector with render callback
interface VariantSelectorProps {
  variants: ProductVariant[];
  onVariantChange: (variant: ProductVariant | null) => void;
  renderPrice?: (variant: ProductVariant) => ReactNode;
}
```

## WARNING: Prop Drilling Past 3 Levels

**The Problem:**

```typescript
// BAD - threading props through multiple levels
<App user={user}>
  <Layout user={user}>
    <Sidebar user={user}>
      <UserInfo user={user} />
    </Sidebar>
  </Layout>
</App>
```

**Why This Breaks:**
1. Every component must know about `user` prop
2. Adding new fields requires updating all intermediates
3. Makes components tightly coupled

**The Fix:**

```typescript
// GOOD - use Context
const { user } = useAuth(); // Access directly where needed
```

## WARNING: Inline Object/Array Props

**The Problem:**

```typescript
// BAD - new reference every render
<ProductList 
  filters={{ category: 'serums' }} // New object each render
  columns={['name', 'price']}      // New array each render
/>
```

**Why This Breaks:**
1. React.memo won't work - props always "change"
2. Child useEffect/useMemo dependencies break
3. Unnecessary re-renders cascade

**The Fix:**

```typescript
// GOOD - stable references
const filters = useMemo(() => ({ category: 'serums' }), []);
const columns = useMemo(() => ['name', 'price'], []);

<ProductList filters={filters} columns={columns} />

// OR extract as module constants for truly static values
const COLUMNS = ['name', 'price'] as const;
```

## Component Checklist

Copy this checklist when creating components:

- [ ] Interface defined for props
- [ ] Default values for optional props
- [ ] No prop drilling beyond 2 levels
- [ ] Stable references for object/array props
- [ ] Loading and error states handled
- [ ] Accessibility: semantic HTML, alt text, ARIA labels