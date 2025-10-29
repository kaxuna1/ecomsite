# Product Management Implementation Plan
## Luxia E-Commerce Platform - Custom Implementation Roadmap

**Document Version:** 1.0
**Date:** October 29, 2025
**Selected Features:** 10 prioritized enhancements
**Total Timeline:** 20-28 weeks (5-7 months)

---

## Executive Summary

This implementation plan covers 10 selected features from the enhancement strategy, reorganized into 4 logical phases based on dependencies and complexity. The plan prioritizes foundational features first, then builds upon them with advanced capabilities.

**Total Effort Estimate:** 1,200-1,600 developer hours
**Recommended Team:** 2 Full-Stack Developers
**Total Cost Estimate:** $60,000-$80,000

---

## Table of Contents

1. [Implementation Phases Overview](#implementation-phases-overview)
2. [Phase 1: Foundation & Search](#phase-1-foundation--search)
3. [Phase 2: Core Product Features](#phase-2-core-product-features)
4. [Phase 3: User Engagement Features](#phase-3-user-engagement-features)
5. [Phase 4: Admin Tools & AI](#phase-4-admin-tools--ai)
6. [Technical Architecture Changes](#technical-architecture-changes)
7. [Database Schema Overview](#database-schema-overview)
8. [Testing Strategy](#testing-strategy)
9. [Deployment Strategy](#deployment-strategy)
10. [Success Metrics](#success-metrics)

---

## Implementation Phases Overview

```
Phase 1: Foundation & Search (4-6 weeks)
├─ 1.3 SEO Metadata Enhancement
├─ 1.2 Enhanced Product Search (PostgreSQL FTS)
└─ 2.4 Custom Product Attributes System

Phase 2: Core Product Features (6-8 weeks)
├─ 2.2 Product Variants & SKU Management
├─ 2.3 Product Relationships & Recommendations
└─ 3.4 Enhanced Media Management

Phase 3: User Engagement Features (6-8 weeks)
├─ 3.3 Product Reviews & Ratings System
└─ 3.2 Product Analytics & Insights Dashboard

Phase 4: Admin Tools & AI (4-6 weeks)
├─ 2.5 Bulk Operations & Admin Tools
└─ 3.1 AI-Powered Features

Total: 20-28 weeks (5-7 months)
```

### Dependency Graph

```
SEO Metadata ─────────────────────────┐
                                      │
Custom Attributes ────┬───────────────┼───→ Bulk Operations ─→ AI Features
                      │               │
                      ├─→ Variants ───┤
                      │               │
Enhanced Search ──────┤               ├───→ Analytics Dashboard
                      │               │
Product Relationships ─┤               │
                      │               │
Enhanced Media ────────┴───────────────┤
                                      │
Reviews ──────────────────────────────┘
```

---

## Phase 1: Foundation & Search

**Duration:** 4-6 weeks
**Priority:** Critical (Foundation for other features)
**Team:** 2 Developers

---

### Feature 1.3: SEO Metadata Enhancement

**Timeline:** Week 1-2 (2 weeks)
**Effort:** 80 hours
**Priority:** High

#### Database Changes

```sql
-- Migration: 001_add_seo_fields.sql

-- Add SEO fields to products table
ALTER TABLE products
ADD COLUMN slug VARCHAR(255) UNIQUE,
ADD COLUMN meta_title VARCHAR(255),
ADD COLUMN meta_description TEXT,
ADD COLUMN meta_keywords TEXT[],
ADD COLUMN og_image_url TEXT,
ADD COLUMN canonical_url TEXT;

-- Add SEO fields to product_translations table
ALTER TABLE product_translations
ADD COLUMN slug VARCHAR(255),
ADD COLUMN meta_title VARCHAR(255),
ADD COLUMN meta_description TEXT;

-- Create unique index for slug
CREATE UNIQUE INDEX idx_products_slug ON products(slug);

-- Create index for translations slug with language
CREATE UNIQUE INDEX idx_product_translations_slug_lang
ON product_translations(product_id, language_code, slug);

-- Function to auto-generate slug from name
CREATE OR REPLACE FUNCTION generate_slug(text_input TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN lower(
    regexp_replace(
      regexp_replace(text_input, '[^a-zA-Z0-9\s-]', '', 'g'),
      '\s+', '-', 'g'
    )
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Trigger to auto-generate slug if not provided
CREATE OR REPLACE FUNCTION set_product_slug()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := generate_slug(NEW.name) || '-' || NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER product_slug_trigger
BEFORE INSERT OR UPDATE ON products
FOR EACH ROW
EXECUTE FUNCTION set_product_slug();

-- Populate existing products with slugs
UPDATE products
SET slug = generate_slug(name) || '-' || id
WHERE slug IS NULL;
```

#### Backend Implementation

**Type Definitions** (`backend/src/types/index.ts`):

```typescript
export interface ProductSEO {
  slug: string;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string[];
  ogImageUrl?: string;
  canonicalUrl?: string;
}

export interface Product {
  // ... existing fields
  slug: string;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string[];
  ogImageUrl?: string;
  canonicalUrl?: string;
}
```

**Service Updates** (`backend/src/services/productService.ts`):

```typescript
// Update mapProduct function
const mapProduct = (row: any): Product => ({
  id: row.id,
  name: row.name,
  slug: row.slug,
  shortDescription: row.short_description,
  description: row.description,
  price: parseFloat(row.price),
  salePrice: row.sale_price ? parseFloat(row.sale_price) : null,
  imageUrl: row.image_url,
  inventory: row.inventory,
  categories: row.categories,
  highlights: row.highlights,
  usage: row.usage,
  isNew: row.is_new,
  isFeatured: row.is_featured,
  salesCount: row.sales_count,
  metaTitle: row.meta_title,
  metaDescription: row.meta_description,
  metaKeywords: row.meta_keywords,
  ogImageUrl: row.og_image_url,
  canonicalUrl: row.canonical_url,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

// Add getBySlug method
export const getBySlug = async (
  slug: string,
  language: string = 'en'
): Promise<Product | null> => {
  const query = `
    SELECT
      p.*,
      COALESCE(pt.name, p.name) as name,
      COALESCE(pt.slug, p.slug) as slug,
      COALESCE(pt.short_description, p.short_description) as short_description,
      COALESCE(pt.description, p.description) as description,
      COALESCE(pt.meta_title, p.meta_title) as meta_title,
      COALESCE(pt.meta_description, p.meta_description) as meta_description
    FROM products p
    LEFT JOIN product_translations pt
      ON p.id = pt.product_id AND pt.language_code = $2
    WHERE p.slug = $1 OR pt.slug = $1
  `;

  const result = await db.query(query, [slug, language]);
  return result.rows.length > 0 ? mapProduct(result.rows[0]) : null;
};

// Generate SEO metadata helper
export const generateSEOMetadata = (product: Product): ProductSEO => {
  const baseUrl = process.env.FRONTEND_URL || 'https://luxiaproducts.com';

  return {
    slug: product.slug,
    metaTitle: product.metaTitle || `${product.name} | Luxia Products`,
    metaDescription: product.metaDescription || product.shortDescription,
    metaKeywords: product.metaKeywords || product.categories,
    ogImageUrl: product.ogImageUrl || product.imageUrl,
    canonicalUrl: product.canonicalUrl || `${baseUrl}/products/${product.slug}`,
  };
};
```

**Route Updates** (`backend/src/routes/productRoutes.ts`):

```typescript
// Add route to get product by slug
router.get('/products/slug/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const lang = req.query.lang as string || 'en';

    const product = await productService.getBySlug(slug, lang);

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const seoMetadata = productService.generateSEOMetadata(product);

    res.json({
      ...product,
      seo: seoMetadata,
    });
  } catch (error) {
    console.error('Error fetching product by slug:', error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});
```

#### Frontend Implementation

**Update Product Type** (`frontend/src/types/product.ts`):

```typescript
export interface ProductSEO {
  slug: string;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string[];
  ogImageUrl?: string;
  canonicalUrl?: string;
}

export interface Product {
  // ... existing fields
  slug: string;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string[];
  ogImageUrl?: string;
  canonicalUrl?: string;
  seo?: ProductSEO;
}
```

**SEO Component** (`frontend/src/components/SEOHead.tsx`):

```typescript
import { Helmet } from 'react-helmet-async';
import { Product } from '../types/product';

interface SEOHeadProps {
  product?: Product;
  title?: string;
  description?: string;
  image?: string;
  url?: string;
}

export const SEOHead: React.FC<SEOHeadProps> = ({
  product,
  title,
  description,
  image,
  url
}) => {
  const seoTitle = product?.seo?.metaTitle || product?.metaTitle || title || 'Luxia Products';
  const seoDescription = product?.seo?.metaDescription || product?.shortDescription || description || '';
  const seoImage = product?.seo?.ogImageUrl || product?.imageUrl || image || '';
  const seoUrl = product?.seo?.canonicalUrl || url || window.location.href;
  const keywords = product?.seo?.metaKeywords || product?.categories || [];

  return (
    <Helmet>
      <title>{seoTitle}</title>
      <meta name="description" content={seoDescription} />
      {keywords.length > 0 && (
        <meta name="keywords" content={keywords.join(', ')} />
      )}
      <link rel="canonical" href={seoUrl} />

      {/* Open Graph */}
      <meta property="og:title" content={seoTitle} />
      <meta property="og:description" content={seoDescription} />
      <meta property="og:image" content={seoImage} />
      <meta property="og:url" content={seoUrl} />
      <meta property="og:type" content="product" />

      {product && (
        <>
          <meta property="product:price:amount" content={String(product.salePrice || product.price)} />
          <meta property="product:price:currency" content="USD" />
          {product.inventory > 0 ? (
            <meta property="product:availability" content="in stock" />
          ) : (
            <meta property="product:availability" content="out of stock" />
          )}
        </>
      )}

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={seoTitle} />
      <meta name="twitter:description" content={seoDescription} />
      <meta name="twitter:image" content={seoImage} />

      {/* JSON-LD Structured Data */}
      {product && (
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org/",
            "@type": "Product",
            "name": product.name,
            "image": product.imageUrl,
            "description": product.description,
            "sku": `LUXIA-${product.id}`,
            "brand": {
              "@type": "Brand",
              "name": "Luxia"
            },
            "offers": {
              "@type": "Offer",
              "url": seoUrl,
              "priceCurrency": "USD",
              "price": product.salePrice || product.price,
              "availability": product.inventory > 0
                ? "https://schema.org/InStock"
                : "https://schema.org/OutOfStock"
            }
          })}
        </script>
      )}
    </Helmet>
  );
};
```

**Update ProductDetailPage** (`frontend/src/pages/ProductDetailPage.tsx`):

```typescript
import { SEOHead } from '../components/SEOHead';

export const ProductDetailPage: React.FC = () => {
  // ... existing code

  return (
    <>
      <SEOHead product={product} />

      <div className="container mx-auto px-4 py-8">
        {/* ... existing product display code */}
      </div>
    </>
  );
};
```

**Admin Form Updates** (`frontend/src/pages/admin/AdminProducts.tsx`):

Add SEO fields to the product form:

```typescript
{/* SEO Section in form */}
<div className="border-t pt-6 mt-6">
  <h3 className="text-lg font-semibold mb-4">SEO Settings</h3>

  <div className="space-y-4">
    <div>
      <label className="block text-sm font-medium mb-1">
        URL Slug
      </label>
      <input
        type="text"
        {...register('slug')}
        className="w-full px-3 py-2 border rounded-lg"
        placeholder="luxury-hair-serum (auto-generated if empty)"
      />
      <p className="text-sm text-gray-500 mt-1">
        Leave empty to auto-generate from product name
      </p>
    </div>

    <div>
      <label className="block text-sm font-medium mb-1">
        Meta Title
      </label>
      <input
        type="text"
        {...register('metaTitle')}
        maxLength={60}
        className="w-full px-3 py-2 border rounded-lg"
        placeholder="Product Name | Luxia Products"
      />
      <p className="text-sm text-gray-500 mt-1">
        Recommended: 50-60 characters
      </p>
    </div>

    <div>
      <label className="block text-sm font-medium mb-1">
        Meta Description
      </label>
      <textarea
        {...register('metaDescription')}
        maxLength={160}
        rows={3}
        className="w-full px-3 py-2 border rounded-lg"
        placeholder="Compelling description for search results"
      />
      <p className="text-sm text-gray-500 mt-1">
        Recommended: 150-160 characters
      </p>
    </div>
  </div>
</div>
```

#### Testing Checklist

- [ ] Slugs auto-generate correctly from product names
- [ ] Unique slug constraint prevents duplicates
- [ ] GET /products/slug/:slug endpoint works
- [ ] SEO metadata appears in HTML head
- [ ] OpenGraph tags render correctly
- [ ] JSON-LD structured data validates (use Google Rich Results Test)
- [ ] Twitter cards preview correctly
- [ ] Admin can manually override auto-generated SEO fields
- [ ] Multilingual slugs work correctly

---

### Feature 1.2: Enhanced Product Search (PostgreSQL FTS)

**Timeline:** Week 2-3 (2 weeks)
**Effort:** 80 hours
**Priority:** High

#### Database Changes

```sql
-- Migration: 002_add_fulltext_search.sql

-- Install required extensions
CREATE EXTENSION IF NOT EXISTS pg_trgm;  -- Trigram similarity
CREATE EXTENSION IF NOT EXISTS unaccent; -- Remove accents for better search

-- Add full-text search vector column
ALTER TABLE products
ADD COLUMN search_vector tsvector;

-- Create function to update search vector
CREATE OR REPLACE FUNCTION products_search_vector_update()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', COALESCE(NEW.name, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.short_description, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'C') ||
    setweight(to_tsvector('english', COALESCE(array_to_string(NEW.categories, ' '), '')), 'B');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic search vector updates
CREATE TRIGGER products_search_vector_trigger
BEFORE INSERT OR UPDATE OF name, short_description, description, categories
ON products
FOR EACH ROW
EXECUTE FUNCTION products_search_vector_update();

-- Create GIN index for full-text search (fast searching)
CREATE INDEX idx_products_search_vector
ON products USING gin(search_vector);

-- Create trigram indexes for fuzzy matching
CREATE INDEX idx_products_name_trgm
ON products USING gin(name gin_trgm_ops);

CREATE INDEX idx_products_description_trgm
ON products USING gin(description gin_trgm_ops);

-- Update existing products with search vectors
UPDATE products SET search_vector =
  setweight(to_tsvector('english', COALESCE(name, '')), 'A') ||
  setweight(to_tsvector('english', COALESCE(short_description, '')), 'B') ||
  setweight(to_tsvector('english', COALESCE(description, '')), 'C') ||
  setweight(to_tsvector('english', COALESCE(array_to_string(categories, ' '), '')), 'B');

-- Create search function with ranking
CREATE OR REPLACE FUNCTION search_products(
  search_query TEXT,
  lang_code VARCHAR(10) DEFAULT 'en',
  limit_count INTEGER DEFAULT 20,
  offset_count INTEGER DEFAULT 0
)
RETURNS TABLE (
  id INTEGER,
  name TEXT,
  slug VARCHAR(255),
  short_description TEXT,
  description TEXT,
  price NUMERIC,
  sale_price NUMERIC,
  image_url TEXT,
  inventory INTEGER,
  categories JSONB,
  highlights JSONB,
  usage TEXT,
  is_new BOOLEAN,
  is_featured BOOLEAN,
  sales_count INTEGER,
  rank REAL,
  similarity_score REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    COALESCE(pt.name, p.name) as name,
    p.slug,
    COALESCE(pt.short_description, p.short_description) as short_description,
    COALESCE(pt.description, p.description) as description,
    p.price,
    p.sale_price,
    p.image_url,
    p.inventory,
    p.categories,
    p.highlights,
    p.usage,
    p.is_new,
    p.is_featured,
    p.sales_count,
    -- Full-text search rank (weighted)
    ts_rank(
      p.search_vector,
      plainto_tsquery('english', search_query)
    ) as rank,
    -- Trigram similarity score (for typo tolerance)
    GREATEST(
      similarity(p.name, search_query),
      similarity(p.description, search_query)
    ) as similarity_score
  FROM products p
  LEFT JOIN product_translations pt
    ON p.id = pt.product_id AND pt.language_code = lang_code
  WHERE
    -- Full-text search match OR trigram similarity
    (p.search_vector @@ plainto_tsquery('english', search_query)
    OR similarity(p.name, search_query) > 0.3
    OR similarity(p.description, search_query) > 0.2)
  ORDER BY
    -- Sort by relevance: full-text rank + similarity
    (rank + similarity_score) DESC,
    p.sales_count DESC
  LIMIT limit_count
  OFFSET offset_count;
END;
$$ LANGUAGE plpgsql;
```

#### Backend Implementation

**Service Updates** (`backend/src/services/productService.ts`):

```typescript
export interface SearchResult {
  products: Product[];
  total: number;
  page: number;
  perPage: number;
  query: string;
  suggestions?: string[];
}

export const search = async (
  query: string,
  options: {
    language?: string;
    page?: number;
    perPage?: number;
    filters?: {
      categories?: string[];
      minPrice?: number;
      maxPrice?: number;
      inStock?: boolean;
      isNew?: boolean;
      isFeatured?: boolean;
    };
  } = {}
): Promise<SearchResult> => {
  const {
    language = 'en',
    page = 1,
    perPage = 20,
    filters = {},
  } = options;

  const offset = (page - 1) * perPage;

  // Build filter conditions
  const filterConditions: string[] = [];
  const filterParams: any[] = [];
  let paramIndex = 4; // Starting after query, lang, limit, offset

  if (filters.categories && filters.categories.length > 0) {
    filterConditions.push(`p.categories ?| $${paramIndex}`);
    filterParams.push(filters.categories);
    paramIndex++;
  }

  if (filters.minPrice !== undefined) {
    filterConditions.push(`p.price >= $${paramIndex}`);
    filterParams.push(filters.minPrice);
    paramIndex++;
  }

  if (filters.maxPrice !== undefined) {
    filterConditions.push(`p.price <= $${paramIndex}`);
    filterParams.push(filters.maxPrice);
    paramIndex++;
  }

  if (filters.inStock) {
    filterConditions.push('p.inventory > 0');
  }

  if (filters.isNew) {
    filterConditions.push('p.is_new = true');
  }

  if (filters.isFeatured) {
    filterConditions.push('p.is_featured = true');
  }

  const whereClause = filterConditions.length > 0
    ? `AND ${filterConditions.join(' AND ')}`
    : '';

  // Search query with filters
  const searchQuery = `
    SELECT
      p.id,
      COALESCE(pt.name, p.name) as name,
      p.slug,
      COALESCE(pt.short_description, p.short_description) as short_description,
      COALESCE(pt.description, p.description) as description,
      p.price,
      p.sale_price,
      p.image_url,
      p.inventory,
      p.categories,
      p.highlights,
      p.usage,
      p.is_new,
      p.is_featured,
      p.sales_count,
      ts_rank(p.search_vector, plainto_tsquery('english', $1)) as rank,
      GREATEST(
        similarity(p.name, $1),
        similarity(p.description, $1)
      ) as similarity_score
    FROM products p
    LEFT JOIN product_translations pt
      ON p.id = pt.product_id AND pt.language_code = $2
    WHERE
      (p.search_vector @@ plainto_tsquery('english', $1)
      OR similarity(p.name, $1) > 0.3
      OR similarity(p.description, $1) > 0.2)
      ${whereClause}
    ORDER BY
      (rank + similarity_score) DESC,
      p.sales_count DESC
    LIMIT $3 OFFSET $4
  `;

  const countQuery = `
    SELECT COUNT(*) as total
    FROM products p
    WHERE
      (p.search_vector @@ plainto_tsquery('english', $1)
      OR similarity(p.name, $1) > 0.3
      OR similarity(p.description, $1) > 0.2)
      ${whereClause}
  `;

  const [results, countResults] = await Promise.all([
    db.query(searchQuery, [query, language, perPage, offset, ...filterParams]),
    db.query(countQuery, [query, ...filterParams]),
  ]);

  const products = results.rows.map(mapProduct);
  const total = parseInt(countResults.rows[0].total);

  // Generate search suggestions for zero results
  let suggestions: string[] = [];
  if (products.length === 0) {
    suggestions = await generateSearchSuggestions(query);
  }

  return {
    products,
    total,
    page,
    perPage,
    query,
    suggestions,
  };
};

// Helper function to generate search suggestions
const generateSearchSuggestions = async (query: string): Promise<string[]> => {
  const suggestionQuery = `
    SELECT DISTINCT name
    FROM products
    WHERE similarity(name, $1) > 0.2
    ORDER BY similarity(name, $1) DESC
    LIMIT 5
  `;

  const result = await db.query(suggestionQuery, [query]);
  return result.rows.map(row => row.name);
};

// Autocomplete function
export const autocomplete = async (
  query: string,
  language: string = 'en',
  limit: number = 10
): Promise<string[]> => {
  const autocompleteQuery = `
    SELECT DISTINCT COALESCE(pt.name, p.name) as name
    FROM products p
    LEFT JOIN product_translations pt
      ON p.id = pt.product_id AND pt.language_code = $2
    WHERE
      p.name ILIKE $1 || '%'
      OR pt.name ILIKE $1 || '%'
    ORDER BY
      p.sales_count DESC,
      COALESCE(pt.name, p.name)
    LIMIT $3
  `;

  const result = await db.query(autocompleteQuery, [query, language, limit]);
  return result.rows.map(row => row.name);
};
```

**Route Updates** (`backend/src/routes/productRoutes.ts`):

```typescript
// Search endpoint
router.get('/products/search', async (req, res) => {
  try {
    const {
      q,
      lang = 'en',
      page = '1',
      perPage = '20',
      categories,
      minPrice,
      maxPrice,
      inStock,
      isNew,
      isFeatured,
    } = req.query;

    if (!q || typeof q !== 'string') {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const searchResults = await productService.search(q, {
      language: lang as string,
      page: parseInt(page as string),
      perPage: parseInt(perPage as string),
      filters: {
        categories: categories ? (categories as string).split(',') : undefined,
        minPrice: minPrice ? parseFloat(minPrice as string) : undefined,
        maxPrice: maxPrice ? parseFloat(maxPrice as string) : undefined,
        inStock: inStock === 'true',
        isNew: isNew === 'true',
        isFeatured: isFeatured === 'true',
      },
    });

    res.json(searchResults);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

// Autocomplete endpoint
router.get('/products/autocomplete', async (req, res) => {
  try {
    const { q, lang = 'en', limit = '10' } = req.query;

    if (!q || typeof q !== 'string') {
      return res.status(400).json({ error: 'Query is required' });
    }

    const suggestions = await productService.autocomplete(
      q,
      lang as string,
      parseInt(limit as string)
    );

    res.json({ suggestions });
  } catch (error) {
    console.error('Autocomplete error:', error);
    res.status(500).json({ error: 'Autocomplete failed' });
  }
});
```

#### Frontend Implementation

**Search API** (`frontend/src/api/products.ts`):

```typescript
export interface SearchFilters {
  categories?: string[];
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  isNew?: boolean;
  isFeatured?: boolean;
}

export interface SearchResult {
  products: Product[];
  total: number;
  page: number;
  perPage: number;
  query: string;
  suggestions?: string[];
}

export const searchProducts = async (
  query: string,
  options: {
    page?: number;
    perPage?: number;
    filters?: SearchFilters;
  } = {}
): Promise<SearchResult> => {
  const params = new URLSearchParams({
    q: query,
    page: String(options.page || 1),
    perPage: String(options.perPage || 20),
  });

  if (options.filters) {
    if (options.filters.categories) {
      params.append('categories', options.filters.categories.join(','));
    }
    if (options.filters.minPrice) {
      params.append('minPrice', String(options.filters.minPrice));
    }
    if (options.filters.maxPrice) {
      params.append('maxPrice', String(options.filters.maxPrice));
    }
    if (options.filters.inStock) {
      params.append('inStock', 'true');
    }
    if (options.filters.isNew) {
      params.append('isNew', 'true');
    }
    if (options.filters.isFeatured) {
      params.append('isFeatured', 'true');
    }
  }

  const response = await apiClient.get(`/products/search?${params}`);
  return response.data;
};

export const autocompleteProducts = async (
  query: string,
  limit: number = 10
): Promise<string[]> => {
  const response = await apiClient.get('/products/autocomplete', {
    params: { q: query, limit },
  });
  return response.data.suggestions;
};
```

**Search Component** (`frontend/src/components/SearchBar.tsx`):

```typescript
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { autocompleteProducts } from '../api/products';
import { useDebounce } from '../hooks/useDebounce';

export const SearchBar: React.FC = () => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const debouncedQuery = useDebounce(query, 300);
  const navigate = useNavigate();
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (debouncedQuery.length >= 2) {
        setIsLoading(true);
        try {
          const results = await autocompleteProducts(debouncedQuery);
          setSuggestions(results);
          setShowSuggestions(true);
        } catch (error) {
          console.error('Autocomplete error:', error);
        } finally {
          setIsLoading(false);
        }
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    };

    fetchSuggestions();
  }, [debouncedQuery]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (searchQuery: string) => {
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setShowSuggestions(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(query);
  };

  return (
    <div ref={wrapperRef} className="relative w-full max-w-2xl">
      <form onSubmit={handleSubmit} className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
          placeholder="Search for products..."
          className="w-full px-4 py-3 pl-12 pr-12 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-jade-500 focus:border-transparent"
        />

        <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />

        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setSuggestions([]);
              setShowSuggestions(false);
            }}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        )}
      </form>

      {/* Autocomplete Suggestions */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-y-auto">
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => {
                setQuery(suggestion);
                handleSearch(suggestion);
              }}
              className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center space-x-3 border-b last:border-b-0"
            >
              <MagnifyingGlassIcon className="w-4 h-4 text-gray-400" />
              <span className="text-gray-700">{suggestion}</span>
            </button>
          ))}
        </div>
      )}

      {isLoading && (
        <div className="absolute right-12 top-1/2 -translate-y-1/2">
          <div className="animate-spin w-4 h-4 border-2 border-jade-500 border-t-transparent rounded-full" />
        </div>
      )}
    </div>
  );
};
```

**Search Results Page** (`frontend/src/pages/SearchPage.tsx`):

```typescript
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { searchProducts, SearchFilters } from '../api/products';
import { ProductCard } from '../components/ProductCard';
import { SEOHead } from '../components/SEOHead';

export const SearchPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<SearchFilters>({});

  const { data, isLoading, error } = useQuery({
    queryKey: ['search', query, page, filters],
    queryFn: () => searchProducts(query, { page, filters }),
    enabled: query.length > 0,
  });

  if (!query) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold text-gray-700">
          Enter a search query to find products
        </h1>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-200 h-64 rounded-lg mb-4" />
              <div className="bg-gray-200 h-4 rounded mb-2" />
              <div className="bg-gray-200 h-4 rounded w-2/3" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const totalPages = data ? Math.ceil(data.total / data.perPage) : 0;

  return (
    <>
      <SEOHead
        title={`Search Results for "${query}" | Luxia Products`}
        description={`Found ${data?.total || 0} products matching "${query}"`}
      />

      <div className="container mx-auto px-4 py-8">
        {/* Search Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Search Results for "{query}"
          </h1>
          <p className="text-gray-600">
            {data?.total || 0} products found
          </p>
        </div>

        {/* Zero Results */}
        {data && data.products.length === 0 && (
          <div className="text-center py-16">
            <h2 className="text-2xl font-semibold text-gray-700 mb-4">
              No products found
            </h2>
            {data.suggestions && data.suggestions.length > 0 && (
              <div className="mt-6">
                <p className="text-gray-600 mb-3">Did you mean:</p>
                <div className="flex flex-wrap justify-center gap-2">
                  {data.suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => setSearchParams({ q: suggestion })}
                      className="px-4 py-2 bg-jade-100 text-jade-700 rounded-full hover:bg-jade-200 transition"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Results Grid */}
        {data && data.products.length > 0 && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {data.products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center space-x-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 border rounded-lg disabled:opacity-50"
                >
                  Previous
                </button>

                <span className="px-4 py-2">
                  Page {page} of {totalPages}
                </span>

                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 border rounded-lg disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
};
```

**Debounce Hook** (`frontend/src/hooks/useDebounce.ts`):

```typescript
import { useState, useEffect } from 'react';

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
```

#### Testing Checklist

- [ ] Full-text search returns relevant results
- [ ] Typo tolerance works (e.g., "shampoo" finds "shampoo")
- [ ] Autocomplete shows suggestions after 2 characters
- [ ] Autocomplete respects debounce (doesn't fire too frequently)
- [ ] Search suggestions appear for zero-result queries
- [ ] Filters work correctly (categories, price range, etc.)
- [ ] Pagination works on search results
- [ ] Search works with multilingual content
- [ ] Performance: Search completes in <100ms for 1000+ products
- [ ] Search vector automatically updates when product is edited

---

### Feature 2.4: Custom Product Attributes System

**Timeline:** Week 3-6 (3 weeks)
**Effort:** 120 hours
**Priority:** High (Foundation for other features)

#### Database Changes

```sql
-- Migration: 003_custom_attributes.sql

-- Table for attribute definitions (schema)
CREATE TABLE product_attribute_definitions (
  id SERIAL PRIMARY KEY,
  attribute_key VARCHAR(100) UNIQUE NOT NULL,
  attribute_label VARCHAR(255) NOT NULL,
  data_type VARCHAR(50) NOT NULL, -- text, number, boolean, select, multiselect, date
  is_searchable BOOLEAN DEFAULT FALSE,
  is_filterable BOOLEAN DEFAULT FALSE,
  is_required BOOLEAN DEFAULT FALSE,
  validation_rules JSONB DEFAULT '{}'::jsonb,
  options JSONB, -- For select/multiselect: [{"value": "50ml", "label": "50ml"}]
  category_ids INTEGER[] DEFAULT '{}', -- Which categories use this attribute
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add custom attributes JSONB column to products
ALTER TABLE products
ADD COLUMN custom_attributes JSONB DEFAULT '{}'::jsonb;

-- Create GIN index for querying custom attributes
CREATE INDEX idx_products_custom_attributes
ON products USING gin (custom_attributes);

-- Create index for filterable attributes
CREATE INDEX idx_product_attributes_filterable
ON product_attribute_definitions(is_filterable)
WHERE is_filterable = true;

-- Example attribute definitions for hair/scalp care products
INSERT INTO product_attribute_definitions
  (attribute_key, attribute_label, data_type, is_searchable, is_filterable, options)
VALUES
  ('volume', 'Volume', 'select', false, true,
   '[{"value": "50ml", "label": "50ml"}, {"value": "100ml", "label": "100ml"}, {"value": "200ml", "label": "200ml"}]'::jsonb),

  ('hair_type', 'Hair Type', 'multiselect', true, true,
   '[{"value": "dry", "label": "Dry"}, {"value": "oily", "label": "Oily"}, {"value": "normal", "label": "Normal"}, {"value": "damaged", "label": "Damaged"}]'::jsonb),

  ('scent', 'Scent', 'select', true, true,
   '[{"value": "lavender", "label": "Lavender"}, {"value": "rose", "label": "Rose"}, {"value": "unscented", "label": "Unscented"}]'::jsonb),

  ('ingredients', 'Key Ingredients', 'multiselect', true, false,
   '[{"value": "argan-oil", "label": "Argan Oil"}, {"value": "keratin", "label": "Keratin"}, {"value": "biotin", "label": "Biotin"}]'::jsonb),

  ('organic', 'Organic', 'boolean', true, true, null),

  ('vegan', 'Vegan', 'boolean', true, true, null),

  ('paraben_free', 'Paraben Free', 'boolean', true, true, null),

  ('sulfate_free', 'Sulfate Free', 'boolean', true, true, null);

-- Function to validate custom attributes against definitions
CREATE OR REPLACE FUNCTION validate_custom_attributes()
RETURNS TRIGGER AS $$
DECLARE
  attr_key TEXT;
  attr_value JSONB;
  definition RECORD;
BEGIN
  -- Iterate through custom attributes
  FOR attr_key, attr_value IN SELECT * FROM jsonb_each(NEW.custom_attributes)
  LOOP
    -- Check if attribute definition exists
    SELECT * INTO definition
    FROM product_attribute_definitions
    WHERE attribute_key = attr_key;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Unknown attribute: %', attr_key;
    END IF;

    -- Validate data type
    CASE definition.data_type
      WHEN 'number' THEN
        IF jsonb_typeof(attr_value) != 'number' THEN
          RAISE EXCEPTION 'Attribute % must be a number', attr_key;
        END IF;
      WHEN 'boolean' THEN
        IF jsonb_typeof(attr_value) != 'boolean' THEN
          RAISE EXCEPTION 'Attribute % must be a boolean', attr_key;
        END IF;
      WHEN 'select' THEN
        -- Validate against options
        IF NOT EXISTS (
          SELECT 1 FROM jsonb_array_elements(definition.options) AS opt
          WHERE opt->>'value' = attr_value#>>'{}'
        ) THEN
          RAISE EXCEPTION 'Invalid option for attribute %', attr_key;
        END IF;
      WHEN 'multiselect' THEN
        -- Validate all values against options
        IF jsonb_typeof(attr_value) != 'array' THEN
          RAISE EXCEPTION 'Attribute % must be an array', attr_key;
        END IF;
      -- Add more validation as needed
    END CASE;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for attribute validation
CREATE TRIGGER validate_product_attributes_trigger
BEFORE INSERT OR UPDATE OF custom_attributes ON products
FOR EACH ROW
EXECUTE FUNCTION validate_custom_attributes();

-- Update search vector function to include custom attributes
CREATE OR REPLACE FUNCTION products_search_vector_update()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', COALESCE(NEW.name, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.short_description, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'C') ||
    setweight(to_tsvector('english', COALESCE(array_to_string(NEW.categories, ' '), '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.custom_attributes::text, '')), 'D');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

This is getting quite long. Should I continue with the full implementation plan covering all the remaining features, or would you like me to:

1. **Continue with the complete document** (will be very comprehensive, 100+ pages)
2. **Create a condensed version** with key points for each feature
3. **Split into multiple documents** (one per phase)
4. **Focus on Phase 1 details first**, then create separate docs for other phases

What would be most useful for you?