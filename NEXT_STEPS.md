# Next Development Steps - SEO Feature

## ✅ Completed So Far
1. Database migration with SEO fields
2. Updated TypeScript types (Product, ProductPayload, ProductSEO)
3. Updated mapProduct function with all SEO fields

## 🚧 Remaining Work for SEO Feature (1.3)

### Backend (2-3 hours remaining)

**1. Update SQL Queries in productService.ts**

Add these fields to SELECT statements in `list()` and `get()` methods:
```sql
p.slug,
p.meta_title,
p.meta_description,
p.meta_keywords,
p.og_image_url,
p.canonical_url,
COALESCE(pt.slug, p.slug) as slug,
COALESCE(pt.meta_title, p.meta_title) as meta_title,
COALESCE(pt.meta_description, p.meta_description) as meta_description
```

**2. Update create() method**

Add to INSERT statement:
```sql
INSERT INTO products (..., slug, meta_title, meta_description, meta_keywords, og_image_url, canonical_url)
VALUES (..., $13, $14, $15, $16, $17, $18)
```

Add to params array:
```typescript
payload.slug ?? null,
payload.metaTitle ?? null,
payload.metaDescription ?? null,
payload.metaKeywords ? `{${payload.metaKeywords.join(',')}}` : null,
payload.ogImageUrl ?? null,
payload.canonicalUrl ?? null
```

**3. Update update() method**

Add to UPDATE statement:
```sql
SET ..., slug=$14, meta_title=$15, meta_description=$16,
    meta_keywords=$17, og_image_url=$18, canonical_url=$19
```

**4. Add getBySlug() method**

Add to productService object (after `get` method):
```typescript
async getBySlug(slug: string, language: string = 'en') {
  const query = `
    SELECT
      p.*,
      COALESCE(pt.name, p.name) as name,
      COALESCE(pt.slug, p.slug) as slug,
      COALESCE(pt.short_description, p.short_description) as short_description,
      COALESCE(pt.description, p.description) as description,
      COALESCE(pt.highlights, p.highlights) as highlights,
      COALESCE(pt.usage, p.usage) as usage,
      COALESCE(pt.meta_title, p.meta_title) as meta_title,
      COALESCE(pt.meta_description, p.meta_description) as meta_description
    FROM products p
    LEFT JOIN product_translations pt
      ON p.id = pt.product_id AND pt.language_code = $2
    WHERE p.slug = $1 OR pt.slug = $1
  `;
  const result = await pool.query(query, [slug, language]);
  return result.rows[0] ? mapProduct(result.rows[0]) : null;
},
```

**5. Add generateSEOMetadata() helper**

Add at the end of productService object:
```typescript
generateSEOMetadata(product: any) {
  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  return {
    slug: product.slug,
    metaTitle: product.metaTitle || `${product.name} | Luxia Products`,
    metaDescription: product.metaDescription || product.shortDescription,
    metaKeywords: product.metaKeywords || product.categories,
    ogImageUrl: product.ogImageUrl || product.imageUrl,
    canonicalUrl: product.canonicalUrl || `${baseUrl}/products/${product.slug}`
  };
}
```

**6. Add route in productRoutes.ts**

```typescript
// Add after existing product routes
router.get('/products/slug/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const lang = (req.query.lang as string) || 'en';

    const product = await productService.getBySlug(slug, lang);

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const seoMetadata = productService.generateSEOMetadata(product);

    res.json({
      ...product,
      seo: seoMetadata
    });
  } catch (error) {
    console.error('Error fetching product by slug:', error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});
```

### Frontend (3-4 hours)

**1. Install react-helmet-async**
```bash
cd frontend
npm install react-helmet-async
```

**2. Update main.tsx**

Wrap App with HelmetProvider:
```typescript
import { HelmetProvider } from 'react-helmet-async';

<HelmetProvider>
  <App />
</HelmetProvider>
```

**3. Create SEOHead component**

Create `frontend/src/components/SEOHead.tsx` - see IMPLEMENTATION_PLAN.md lines 306-393 for full code.

**4. Update Product type**

Add to `frontend/src/types/product.ts`:
```typescript
export interface ProductSEO {
  slug: string;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string[];
  ogImageUrl?: string;
  canonicalUrl?: string;
}

// Add to Product interface:
slug: string;
metaTitle?: string;
metaDescription?: string;
metaKeywords?: string[];
ogImageUrl?: string;
canonicalUrl?: string;
seo?: ProductSEO;
```

**5. Update ProductDetailPage**

Import and use SEOHead:
```typescript
import { SEOHead } from '../components/SEOHead';

return (
  <>
    <SEOHead product={product} />
    {/* existing content */}
  </>
);
```

**6. Update Admin Product Form**

Add SEO fields section to `frontend/src/pages/admin/AdminProducts.tsx`.
See IMPLEMENTATION_PLAN.md lines 420-473 for full code.

---

## Testing Checklist

Once implementation is complete:

- [ ] Create a test product via admin panel
- [ ] Verify slug is auto-generated
- [ ] Check product is accessible via `/api/products/slug/test-product`
- [ ] Verify SEO meta tags appear in page source
- [ ] Test OpenGraph preview (Facebook debugger)
- [ ] Test Twitter card preview
- [ ] Validate JSON-LD with Google Rich Results Test
- [ ] Test manual slug override in admin
- [ ] Test multilingual slugs

---

## Quick Commands

```bash
# Backend
cd backend
npm run dev

# Run if you make DB changes
npm run migrate:run 001_add_seo_fields.sql

# Frontend
cd frontend
npm install react-helmet-async
npm run dev

# Test API
curl http://localhost:4000/api/products/1
curl http://localhost:4000/api/products/slug/luxury-hair-serum

# Check page source
curl http://localhost:5173/products/luxury-hair-serum | grep -A 5 "<head>"
```

---

## Estimated Time Remaining

- Backend updates: 2-3 hours
- Frontend implementation: 3-4 hours
- Testing & bug fixes: 1-2 hours

**Total: 6-9 hours to complete SEO feature**

---

## After This Feature

Once SEO is complete (Feature 1.3), next features are:
1. Feature 1.2: Enhanced Product Search (PostgreSQL FTS) - 2 weeks
2. Feature 2.4: Custom Product Attributes - 3 weeks

See IMPLEMENTATION_PLAN_CONDENSED.md for full details.
