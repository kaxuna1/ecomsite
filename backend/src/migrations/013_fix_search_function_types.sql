-- Migration: 013_fix_search_function_types.sql
-- Description: Fix type mismatches in search_products function
-- Date: October 29, 2025

-- Drop and recreate search_products function with explicit type casting
DROP FUNCTION IF EXISTS search_products(TEXT, TEXT, INTEGER);

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
      ts_rank(p.search_vector, websearch_to_tsquery('english', search_query)) * 10 +
      similarity(COALESCE(pt.name, p.name), search_query) * 5 +
      CASE WHEN p.is_featured THEN 2 ELSE 0 END +
      CASE WHEN p.is_new THEN 1 ELSE 0 END
    )::REAL as search_rank
  FROM products p
  LEFT JOIN product_translations pt ON p.id = pt.product_id AND pt.language_code = lang_code
  WHERE
    p.search_vector @@ websearch_to_tsquery('english', search_query)
    OR similarity(COALESCE(pt.name, p.name), search_query) > 0.1
  ORDER BY search_rank DESC, p.sales_count DESC
  LIMIT max_results;
END;
$$ LANGUAGE plpgsql STABLE;

-- Also fix autocomplete_products function
DROP FUNCTION IF EXISTS autocomplete_products(TEXT, TEXT, INTEGER);

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
