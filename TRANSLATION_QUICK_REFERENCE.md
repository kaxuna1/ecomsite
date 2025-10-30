# Product Translation - Quick Reference Guide

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    CUSTOMER STOREFRONT                       │
├─────────────────────────────────────────────────────────────┤
│  /ka/products/slug → API: ?lang=ka                          │
│      ↓                                                        │
│  SELECT p.*, COALESCE(pt.name, p.name) as name ...         │
│  FROM products p                                            │
│  LEFT JOIN product_translations pt                          │
│    ON p.id = pt.product_id AND pt.language_code = 'ka'    │
│      ↓                                                        │
│  Georgian content (or English fallback if no translation)   │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                  ADMIN TRANSLATION EDITOR                    │
├─────────────────────────────────────────────────────────────┤
│  /admin/translations                                         │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Language: Georgian (ka) ▼  | 78% Complete (22/28)  │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  Left Sidebar: Products List (searchable)                  │
│    • Product 1 ✓ (translated)                              │
│    • Product 2 ✗ (not translated)                          │
│    • Product 3 ✓ (translated)                              │
│                                                              │
│  Main Editor: Side-by-Side Comparison                       │
│  ┌──────────────────┬──────────────────┐                   │
│  │   ORIGINAL (en)  │  TRANSLATION (ka) │                  │
│  │   (read-only)    │   (editable)      │                  │
│  ├──────────────────┼──────────────────┤                   │
│  │ Luxia Serum      │ [ლუქსია სერ...] │                  │
│  │ (Copy button) → │                  │                   │
│  │                  │ Auto-save in 3s  │                  │
│  │ Short Desc...    │ 145/160 chars ✓  │                  │
│  │ (Copy button) → │                  │                  │
│  │                  │                  │                  │
│  │ Full Desc...     │ [textarea]        │                  │
│  │ (Copy button) → │                  │                  │
│  │                  │                  │                  │
│  │ Highlights:      │ Add/Remove bullets│                  │
│  │  • Benefit 1     │  • თ... [X]      │                  │
│  │  • Benefit 2     │  • თ... [X]      │                  │
│  │                  │  + Add More      │                  │
│  │                  │                  │                  │
│  │ Usage:           │ [textarea]        │                  │
│  │ How to use...    │                  │                  │
│  │                  │                  │                  │
│  │ SEO Metadata     │                  │                  │
│  │  Meta Title      │ [input] 45/60 ✓  │                  │
│  │  Meta Desc       │ [input] 155/160 ✓│                  │
│  └──────────────────┴──────────────────┘                   │
│                                                              │
│  Keyboard Shortcuts:                                        │
│  • Cmd+S / Ctrl+S: Save                                    │
│  • ← / →: Previous/Next Product                            │
│                                                              │
│  Status: All changes saved ✓                               │
│  [Close] [All Products] ▌▌ [Save Translation]             │
└─────────────────────────────────────────────────────────────┘
```

---

## File Locations (by responsibility)

### Database & Backend
```
backend/src/scripts/migrate.ts
  └─ Lines 70-88: product_translations table schema

backend/src/routes/productRoutes.ts
  ├─ GET  /:id/translations          → Get all translations
  ├─ GET  /:id/translations/:lang    → Get one translation
  └─ POST /:id/translations/:lang    → Save/update translation

backend/src/services/productService.ts
  ├─ createTranslation()     → Upsert translation in DB
  ├─ getTranslation()        → Fetch one translation
  ├─ getAllTranslations()    → Fetch all for product
  └─ get() with JOIN         → Fetch product with fallback
```

### Frontend: Components & Pages
```
frontend/src/pages/admin/AdminTranslations.tsx
  └─ Main translation editor UI (856 lines)
     ├─ Product list sidebar
     ├─ Translation form with fields
     ├─ Auto-save logic
     ├─ Keyboard shortcuts
     └─ Navigation buttons

frontend/src/pages/admin/AdminProducts.tsx
  └─ English-only product editor (product creates/edits)
```

### Frontend: API & Types
```
frontend/src/api/products.ts
  └─ MISSING: Translation-specific methods (gap)
     Currently uses raw api.get/api.post in component

frontend/src/types/product.ts
  ├─ Product interface
  ├─ ProductFilters
  └─ MISSING: ProductTranslation interface (defined in component only)
```

---

## API Endpoints Summary

### Translation Endpoints

| Method | Endpoint | Auth | Status |
|--------|----------|------|--------|
| GET | `/api/products/:id/translations` | No | ✅ Works |
| GET | `/api/products/:id/translations/:lang` | No | ✅ Works |
| POST | `/api/products/:id/translations/:lang` | Yes (JWT) | ✅ Works |
| GET | `/api/products/translations/status?lang=XX` | No | ❌ Missing |

### Related Endpoints (for context)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/products?lang=en&limit=1000` | Load all products for translation |
| GET | `/api/languages` | Load available languages |
| POST | `/api/products` | Create English product |
| PUT | `/api/products/:id` | Edit English product |

---

## Data Flow: Save Translation

```
User edits form field
    ↓
React state updated (setFormData)
    ↓
useEffect detects change (formData dependencies)
    ↓
setHasUnsavedChanges(true)
    ↓
Display "Unsaved changes" indicator
    ↓
[Wait 3 seconds without changes]
    ↓
handleSave() called automatically
    ↓
saveMutation.mutate({
  name: "...",
  shortDescription: "...",
  description: "...",
  highlights: ["..."],
  usage: "...",
  metaTitle: "...",
  metaDescription: "..."
})
    ↓
POST /api/products/{id}/translations/{lang}
    ↓
Express validator checks required fields
    ↓
productService.createTranslation(productId, lang, data)
    ↓
INSERT INTO product_translations (...)
  VALUES (...)
  ON CONFLICT (product_id, language_code)
  DO UPDATE SET name=EXCLUDED.name, ...
  RETURNING *
    ↓
Response: { id, product_id, language_code, name, ... }
    ↓
queryClient.invalidateQueries(['translation'])
    ↓
React Query auto-refetches translation data
    ↓
formData populated with confirmed values
    ↓
setHasUnsavedChanges(false)
    ↓
Display "All changes saved" ✓
```

---

## Translatable Fields

```
Name: "Luxia Repair Serum"
  └─ Type: VARCHAR(255)
  └─ Character guidance: 40-60 chars ideal
  └─ Required: Yes

Short Description: "Revitalizing scalp care serum"
  └─ Type: TEXT
  └─ Character guidance: 120-160 chars ideal
  └─ Required: Yes

Description: "Long form product description..."
  └─ Type: TEXT
  └─ Character guidance: No limit
  └─ Required: Yes

Highlights: ["Benefit 1", "Benefit 2", "Benefit 3"]
  └─ Type: JSONB (array)
  └─ Required: No
  └─ UI: Add/remove individual items

Usage: "Apply 2-3 drops daily to scalp..."
  └─ Type: TEXT
  └─ Required: No

Slug: "luxia-repair-serum-ka"
  └─ Type: VARCHAR(255)
  └─ Required: No
  └─ Auto-generated if empty
  └─ Used in URL: /ka/products/luxia-repair-serum-ka

Meta Title: "Georgian Scalp Repair Serum | Luxia"
  └─ Type: VARCHAR(255)
  └─ Character guidance: 50-60 chars ideal
  └─ Required: No
  └─ Used in: <title> tag, search results

Meta Description: "Premium Georgian hair care serum..."
  └─ Type: TEXT
  └─ Character guidance: 150-160 chars ideal
  └─ Required: No
  └─ Used in: <meta name="description"> tag
```

---

## State Management (React)

```typescript
const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  └─ Which product is being edited

const [selectedLanguage, setSelectedLanguage] = useState('');
  └─ Which language target (defaults to non-default lang)

const [formData, setFormData] = useState({
  name: '',
  shortDescription: '',
  description: '',
  highlights: [],
  usage: '',
  metaTitle: '',
  metaDescription: ''
});
  └─ Current form values (edited by user)

const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  └─ Tracks if form differs from server

const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  └─ Toggle for 3-second auto-save

const [showMobileProductList, setShowMobileProductList] = useState(false);
  └─ Mobile UI: hide/show product list
```

---

## Queries (React Query)

```typescript
// Languages available for translation
useQuery({ queryKey: ['languages'], ... })

// All products in English (to show original content)
useQuery({ queryKey: ['products', 'en'], ... })

// Current translation (if exists, null if not)
useQuery({ queryKey: ['translation', productId, lang], ... })

// Translation completion status (BROKEN - endpoint missing)
useQuery({ queryKey: ['translation-statuses', lang], ... })
```

---

## Mutations (React Query)

```typescript
// Save translation (auto or manual)
useMutation({
  mutationFn: api.post(`/products/${id}/translations/${lang}`, data),
  onSuccess: () => queryClient.invalidateQueries(['translation']),
  onError: (error) => toast.error(error.message)
})
```

---

## Known Issues

### Critical (Breaks Functionality)
1. **Translation Status Endpoint Missing**
   - Frontend calls: `GET /api/products/translations/status?lang={language}`
   - Backend doesn't implement it
   - Result: Completion % and status badges don't work
   - Error handling: Silently fails (no error message)

### Important (Design Gaps)
2. **No API Client Methods**
   - Translation functions should be in `/api/products.ts`
   - Currently using raw api.get/post in component

3. **No Translation History**
   - Can't see who changed what when
   - Can't revert to previous versions
   - Only updated_at timestamp exists

4. **No Batch Operations**
   - Can't copy translations between languages
   - Can't bulk-update multiple products
   - Must edit each individually

5. **"Complete" Status Undefined**
   - What makes a translation "complete"?
   - Just required fields? Or include SEO fields?
   - Business rule needs definition

---

## Key Performance Points

### Database
- Indexed on (product_id, language_code)
- UNIQUE constraint prevents duplicates
- COALESCE in product queries enables fallback

### Frontend
- Loads max 1000 products (could paginate for huge catalogs)
- 3-second debounce prevents excessive saves
- Memoized filtered products (useMemo)
- QueryClient caching prevents re-fetches

### Character Counters (SEO)
- Name: 40-60 chars (shown in title tag)
- Short Description: 120-160 chars
- Meta Title: 50-60 chars (Google shows 50-60)
- Meta Description: 150-160 chars (Google shows 150-160)

---

## Adding a New Language

1. **Via Admin Panel**: `/admin/languages` → Add language
2. **Via Database**: 
   ```sql
   INSERT INTO languages (code, name, native_name, is_enabled, is_default, display_order)
   VALUES ('es', 'Spanish', 'Español', TRUE, FALSE, 3);
   ```
3. **Auto-enabled in**:
   - Language dropdown on AdminTranslations
   - Product queries (COALESCE fallback)
   - Storefront language selector

---

## Code Quality

### Well Implemented
- ✅ Upsert logic (ON CONFLICT)
- ✅ COALESCE fallback pattern
- ✅ React Query integration
- ✅ Auto-save with debounce
- ✅ Keyboard shortcuts
- ✅ Character count guidance
- ✅ Side-by-side UI comparison
- ✅ Unsaved changes detection

### Needs Improvement
- ❌ API client extraction
- ❌ Missing endpoints
- ❌ No error boundaries
- ❌ No tests
- ❌ No audit logging
- ❌ Hardcoded character thresholds

---

## Testing Checklist

- [ ] Create product translation (first time)
- [ ] Edit existing translation
- [ ] Switch language dropdown
- [ ] Switch product in list
- [ ] Unsaved changes warning
- [ ] Auto-save functionality
- [ ] Keyboard Cmd+S save
- [ ] Keyboard arrow navigation
- [ ] Copy from original button
- [ ] Add/remove highlights
- [ ] Character count colors
- [ ] Completion % calculation
- [ ] Fallback to English on storefront

---

## Deployment Notes

- Migrations auto-create `product_translations` table
- No special deployment steps needed
- Translations work immediately after schema creation
- Languages can be added/removed via admin panel
- No environment variables needed
- Auto-save uses app's JWT auth (no extra config)

