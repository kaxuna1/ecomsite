-- Migration: 004_product_variants.sql
-- Description: Add product variants and SKU management system
-- Date: October 29, 2025

-- Table for variant option types (e.g., "Size", "Color", "Material")
CREATE TABLE IF NOT EXISTS variant_options (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table for variant option values (e.g., "Small", "Red", "Cotton")
CREATE TABLE IF NOT EXISTS variant_option_values (
  id SERIAL PRIMARY KEY,
  option_id INTEGER NOT NULL REFERENCES variant_options(id) ON DELETE CASCADE,
  value VARCHAR(100) NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(option_id, value)
);

-- Create index on option_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_variant_option_values_option_id
ON variant_option_values(option_id);

-- Table for product variants (specific combinations of options)
CREATE TABLE IF NOT EXISTS product_variants (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  sku VARCHAR(100) UNIQUE NOT NULL,

  -- Pricing (can override product base price)
  price NUMERIC(10, 2),
  sale_price NUMERIC(10, 2),

  -- Inventory
  inventory INTEGER NOT NULL DEFAULT 0,

  -- Physical attributes
  weight NUMERIC(10, 2), -- in grams
  dimensions_length NUMERIC(10, 2), -- in cm
  dimensions_width NUMERIC(10, 2),
  dimensions_height NUMERIC(10, 2),

  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  is_default BOOLEAN DEFAULT FALSE,

  -- Images
  image_url TEXT,

  -- Tracking
  sales_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_product_variants_product_id
ON product_variants(product_id);

CREATE INDEX IF NOT EXISTS idx_product_variants_sku
ON product_variants(sku);

CREATE INDEX IF NOT EXISTS idx_product_variants_is_active
ON product_variants(is_active);

-- Junction table linking variants to their option values
CREATE TABLE IF NOT EXISTS product_variant_options (
  id SERIAL PRIMARY KEY,
  variant_id INTEGER NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
  option_value_id INTEGER NOT NULL REFERENCES variant_option_values(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(variant_id, option_value_id)
);

-- Create indexes for the junction table
CREATE INDEX IF NOT EXISTS idx_variant_options_variant_id
ON product_variant_options(variant_id);

CREATE INDEX IF NOT EXISTS idx_variant_options_value_id
ON product_variant_options(option_value_id);

-- Insert common variant option types
INSERT INTO variant_options (name, display_order) VALUES
  ('Size', 1),
  ('Color', 2),
  ('Material', 3),
  ('Style', 4),
  ('Volume', 5)
ON CONFLICT DO NOTHING;

-- Insert common size values
INSERT INTO variant_option_values (option_id, value, display_order)
SELECT option_id, value, display_order FROM (
  VALUES
    ((SELECT id FROM variant_options WHERE name = 'Size'), 'XS', 1),
    ((SELECT id FROM variant_options WHERE name = 'Size'), 'S', 2),
    ((SELECT id FROM variant_options WHERE name = 'Size'), 'M', 3),
    ((SELECT id FROM variant_options WHERE name = 'Size'), 'L', 4),
    ((SELECT id FROM variant_options WHERE name = 'Size'), 'XL', 5),
    ((SELECT id FROM variant_options WHERE name = 'Size'), 'XXL', 6)
) AS v(option_id, value, display_order)
ON CONFLICT (option_id, value) DO NOTHING;

-- Insert common color values
INSERT INTO variant_option_values (option_id, value, display_order)
SELECT option_id, value, display_order FROM (
  VALUES
    ((SELECT id FROM variant_options WHERE name = 'Color'), 'White', 1),
    ((SELECT id FROM variant_options WHERE name = 'Color'), 'Black', 2),
    ((SELECT id FROM variant_options WHERE name = 'Color'), 'Gray', 3),
    ((SELECT id FROM variant_options WHERE name = 'Color'), 'Red', 4),
    ((SELECT id FROM variant_options WHERE name = 'Color'), 'Blue', 5),
    ((SELECT id FROM variant_options WHERE name = 'Color'), 'Green', 6),
    ((SELECT id FROM variant_options WHERE name = 'Color'), 'Pink', 7),
    ((SELECT id FROM variant_options WHERE name = 'Color'), 'Purple', 8)
) AS v(option_id, value, display_order)
ON CONFLICT (option_id, value) DO NOTHING;

-- Insert common volume values for hair care products
INSERT INTO variant_option_values (option_id, value, display_order)
SELECT option_id, value, display_order FROM (
  VALUES
    ((SELECT id FROM variant_options WHERE name = 'Volume'), '50ml', 1),
    ((SELECT id FROM variant_options WHERE name = 'Volume'), '100ml', 2),
    ((SELECT id FROM variant_options WHERE name = 'Volume'), '150ml', 3),
    ((SELECT id FROM variant_options WHERE name = 'Volume'), '200ml', 4),
    ((SELECT id FROM variant_options WHERE name = 'Volume'), '250ml', 5),
    ((SELECT id FROM variant_options WHERE name = 'Volume'), '500ml', 6)
) AS v(option_id, value, display_order)
ON CONFLICT (option_id, value) DO NOTHING;

-- Function to get all variants with their option values for a product
CREATE OR REPLACE FUNCTION get_product_variants(product_id_param INTEGER)
RETURNS TABLE(
  variant_id INTEGER,
  sku VARCHAR(100),
  price NUMERIC(10, 2),
  sale_price NUMERIC(10, 2),
  inventory INTEGER,
  weight NUMERIC(10, 2),
  dimensions_length NUMERIC(10, 2),
  dimensions_width NUMERIC(10, 2),
  dimensions_height NUMERIC(10, 2),
  is_active BOOLEAN,
  is_default BOOLEAN,
  image_url TEXT,
  sales_count INTEGER,
  options JSONB,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    pv.id as variant_id,
    pv.sku,
    pv.price,
    pv.sale_price,
    pv.inventory,
    pv.weight,
    pv.dimensions_length,
    pv.dimensions_width,
    pv.dimensions_height,
    pv.is_active,
    pv.is_default,
    pv.image_url,
    pv.sales_count,
    COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'optionId', vo.id,
          'optionName', vo.name,
          'valueId', vov.id,
          'value', vov.value
        ) ORDER BY vo.display_order
      ) FILTER (WHERE vo.id IS NOT NULL),
      '[]'::jsonb
    ) as options,
    pv.created_at,
    pv.updated_at
  FROM product_variants pv
  LEFT JOIN product_variant_options pvo ON pv.id = pvo.variant_id
  LEFT JOIN variant_option_values vov ON pvo.option_value_id = vov.id
  LEFT JOIN variant_options vo ON vov.option_id = vo.id
  WHERE pv.product_id = product_id_param
  GROUP BY pv.id, pv.sku, pv.price, pv.sale_price, pv.inventory, pv.weight,
           pv.dimensions_length, pv.dimensions_width, pv.dimensions_height,
           pv.is_active, pv.is_default, pv.image_url, pv.sales_count,
           pv.created_at, pv.updated_at
  ORDER BY pv.is_default DESC, pv.id;
END;
$$ LANGUAGE plpgsql STABLE;

-- Trigger to ensure only one default variant per product
CREATE OR REPLACE FUNCTION ensure_single_default_variant()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_default = TRUE THEN
    UPDATE product_variants
    SET is_default = FALSE
    WHERE product_id = NEW.product_id AND id != NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_ensure_single_default_variant
BEFORE INSERT OR UPDATE OF is_default ON product_variants
FOR EACH ROW
WHEN (NEW.is_default = TRUE)
EXECUTE FUNCTION ensure_single_default_variant();

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_variant_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_variant_timestamp
BEFORE UPDATE ON product_variants
FOR EACH ROW
EXECUTE FUNCTION update_variant_updated_at();

-- Add flag to products table to indicate if product has variants
ALTER TABLE products
ADD COLUMN IF NOT EXISTS has_variants BOOLEAN DEFAULT FALSE;

-- Create index on has_variants
CREATE INDEX IF NOT EXISTS idx_products_has_variants
ON products(has_variants);

-- Function to automatically update has_variants flag
CREATE OR REPLACE FUNCTION update_product_has_variants()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE products SET has_variants = TRUE WHERE id = NEW.product_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE products
    SET has_variants = EXISTS(SELECT 1 FROM product_variants WHERE product_id = OLD.product_id)
    WHERE id = OLD.product_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_product_has_variants
AFTER INSERT OR DELETE ON product_variants
FOR EACH ROW
EXECUTE FUNCTION update_product_has_variants();
