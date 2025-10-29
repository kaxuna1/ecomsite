-- Migration: 014_improve_search_flexibility.sql
-- Description: Improve search to support partial word matches
-- Date: October 29, 2025

-- Drop and recreate search_products function with better partial matching
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
