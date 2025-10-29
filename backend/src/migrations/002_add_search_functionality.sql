-- Migration: 002_add_search_functionality.sql
-- Description: Add full-text search with PostgreSQL FTS and fuzzy matching
-- Date: October 29, 2025

-- Enable pg_trgm extension for fuzzy matching (similarity search)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Add search_vector column for full-text search
ALTER TABLE products ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Create GIN index for fast full-text search
CREATE INDEX IF NOT EXISTS idx_products_search_vector ON products USING gin(search_vector);

-- Create GIN index for fuzzy/trigram matching on product name
CREATE INDEX IF NOT EXISTS idx_products_name_trgm ON products USING gin(name gin_trgm_ops);

-- Create function to update search vector
CREATE OR REPLACE FUNCTION update_product_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', COALESCE(NEW.name, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.short_description, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'C') ||
    setweight(to_tsvector('english', COALESCE(array_to_string(ARRAY(SELECT jsonb_array_elements_text(NEW.categories)), ' '), '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.slug, '')), 'D');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update search_vector
DROP TRIGGER IF EXISTS trigger_update_product_search_vector ON products;
CREATE TRIGGER trigger_update_product_search_vector
  BEFORE INSERT OR UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_product_search_vector();

-- Populate search_vector for existing products
UPDATE products SET search_vector =
  setweight(to_tsvector('english', COALESCE(name, '')), 'A') ||
  setweight(to_tsvector('english', COALESCE(short_description, '')), 'B') ||
  setweight(to_tsvector('english', COALESCE(description, '')), 'C') ||
  setweight(to_tsvector('english', COALESCE(array_to_string(ARRAY(SELECT jsonb_array_elements_text(categories)), ' '), '')), 'B') ||
  setweight(to_tsvector('english', COALESCE(slug, '')), 'D')
WHERE search_vector IS NULL;

-- Create optimized search function with ranking and partial word matching
CREATE OR REPLACE FUNCTION search_products(
  search_query TEXT,
  lang_code TEXT DEFAULT 'en',
  max_results INTEGER DEFAULT 20
)
RETURNS TABLE(
  id INTEGER,
  name TEXT,
  short_description TEXT,
  description TEXT,
  price NUMERIC,
  sale_price NUMERIC,
  image_url TEXT,
  inventory INTEGER,
  categories TEXT,
  highlights TEXT,
  usage TEXT,
  is_new BOOLEAN,
  is_featured BOOLEAN,
  sales_count INTEGER,
  slug TEXT,
  meta_title TEXT,
  meta_description TEXT,
  meta_keywords TEXT[],
  og_image_url TEXT,
  canonical_url TEXT,
  search_rank REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    COALESCE(pt.name, p.name)::TEXT as name,
    COALESCE(pt.short_description, p.short_description)::TEXT as short_description,
    COALESCE(pt.description, p.description)::TEXT as description,
    p.price,
    p.sale_price,
    p.image_url::TEXT,
    p.inventory,
    p.categories::TEXT,
    COALESCE(pt.highlights, p.highlights)::TEXT as highlights,
    COALESCE(pt.usage, p.usage)::TEXT as usage,
    p.is_new,
    p.is_featured,
    p.sales_count,
    COALESCE(pt.slug, p.slug)::TEXT as slug,
    COALESCE(pt.meta_title, p.meta_title)::TEXT as meta_title,
    COALESCE(pt.meta_description, p.meta_description)::TEXT as meta_description,
    p.meta_keywords,
    p.og_image_url::TEXT,
    p.canonical_url::TEXT,
    (
      -- Exact phrase match in name (highest priority)
      CASE WHEN COALESCE(pt.name, p.name) ILIKE '%' || search_query || '%' THEN 20 ELSE 0 END +
      -- Full-text search match
      ts_rank(p.search_vector, websearch_to_tsquery('english', search_query)) * 10 +
      -- Trigram similarity (fuzzy matching)
      similarity(COALESCE(pt.name, p.name), search_query) * 5 +
      -- Partial word match in description
      CASE WHEN COALESCE(pt.description, p.description) ILIKE '%' || search_query || '%' THEN 2 ELSE 0 END +
      -- Featured/New boost
      CASE WHEN p.is_featured THEN 2 ELSE 0 END +
      CASE WHEN p.is_new THEN 1 ELSE 0 END
    )::REAL as search_rank
  FROM products p
  LEFT JOIN product_translations pt ON p.id = pt.product_id AND pt.language_code = lang_code
  WHERE
    -- Partial match in name (most important)
    COALESCE(pt.name, p.name) ILIKE '%' || search_query || '%'
    -- OR full-text search match
    OR p.search_vector @@ websearch_to_tsquery('english', search_query)
    -- OR fuzzy/trigram match (lowered threshold for more results)
    OR similarity(COALESCE(pt.name, p.name), search_query) > 0.05
    -- OR partial match in description
    OR COALESCE(pt.description, p.description) ILIKE '%' || search_query || '%'
    -- OR partial match in short description
    OR COALESCE(pt.short_description, p.short_description) ILIKE '%' || search_query || '%'
  ORDER BY search_rank DESC, p.sales_count DESC
  LIMIT max_results;
END;
$$ LANGUAGE plpgsql STABLE;

-- Create autocomplete function for typeahead suggestions
CREATE OR REPLACE FUNCTION autocomplete_products(
  search_prefix TEXT,
  lang_code TEXT DEFAULT 'en',
  max_results INTEGER DEFAULT 10
)
RETURNS TABLE(
  id INTEGER,
  name TEXT,
  slug TEXT,
  image_url TEXT,
  price NUMERIC,
  sale_price NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    COALESCE(pt.name, p.name)::TEXT as name,
    COALESCE(pt.slug, p.slug)::TEXT as slug,
    p.image_url::TEXT,
    p.price,
    p.sale_price
  FROM products p
  LEFT JOIN product_translations pt ON p.id = pt.product_id AND pt.language_code = lang_code
  WHERE
    COALESCE(pt.name, p.name) ILIKE search_prefix || '%'
    OR p.search_vector @@ to_tsquery('english', search_prefix || ':*')
  ORDER BY
    CASE WHEN COALESCE(pt.name, p.name) ILIKE search_prefix || '%' THEN 0 ELSE 1 END,
    p.sales_count DESC,
    p.is_featured DESC,
    p.is_new DESC
  LIMIT max_results;
END;
$$ LANGUAGE plpgsql STABLE;
