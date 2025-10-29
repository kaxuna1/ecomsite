-- Migration 001: Add SEO Fields to Products
-- Phase 1, Feature 1.3: SEO Metadata Enhancement
-- Created: 2025-10-29

-- Add SEO fields to main products table
ALTER TABLE products
ADD COLUMN IF NOT EXISTS slug VARCHAR(255) UNIQUE,
ADD COLUMN IF NOT EXISTS meta_title VARCHAR(255),
ADD COLUMN IF NOT EXISTS meta_description TEXT,
ADD COLUMN IF NOT EXISTS meta_keywords TEXT[],
ADD COLUMN IF NOT EXISTS og_image_url TEXT,
ADD COLUMN IF NOT EXISTS canonical_url TEXT;

-- Create unique index for slug
CREATE UNIQUE INDEX IF NOT EXISTS idx_products_slug ON products(slug);

-- Create index for translations slug with language (if not exists)
CREATE UNIQUE INDEX IF NOT EXISTS idx_product_translations_slug_lang
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
    -- Generate slug from name and append ID to ensure uniqueness
    NEW.slug := generate_slug(NEW.name);

    -- If slug already exists, append ID
    IF EXISTS (SELECT 1 FROM products WHERE slug = NEW.slug AND id != COALESCE(NEW.id, 0)) THEN
      NEW.slug := NEW.slug || '-' || COALESCE(NEW.id::TEXT, EXTRACT(EPOCH FROM CURRENT_TIMESTAMP)::TEXT);
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS product_slug_trigger ON products;

CREATE TRIGGER product_slug_trigger
BEFORE INSERT OR UPDATE ON products
FOR EACH ROW
EXECUTE FUNCTION set_product_slug();

-- Populate existing products with slugs
UPDATE products
SET slug = generate_slug(name) || '-' || id
WHERE slug IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN products.slug IS 'SEO-friendly URL slug, auto-generated from product name';
COMMENT ON COLUMN products.meta_title IS 'Meta title for SEO (recommended: 50-60 characters)';
COMMENT ON COLUMN products.meta_description IS 'Meta description for SEO (recommended: 150-160 characters)';
COMMENT ON COLUMN products.meta_keywords IS 'Array of SEO keywords';
COMMENT ON COLUMN products.og_image_url IS 'Open Graph image URL for social sharing';
COMMENT ON COLUMN products.canonical_url IS 'Canonical URL for SEO';
