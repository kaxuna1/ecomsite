-- Migration: 003_custom_attributes.sql
-- Description: Add custom product attributes system for flexible product properties
-- Date: October 29, 2025

-- Table for attribute definitions (schema)
CREATE TABLE IF NOT EXISTS product_attribute_definitions (
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
ADD COLUMN IF NOT EXISTS custom_attributes JSONB DEFAULT '{}'::jsonb;

-- Create GIN index for querying custom attributes
CREATE INDEX IF NOT EXISTS idx_products_custom_attributes
ON products USING gin (custom_attributes);

-- Create index for filterable attributes
CREATE INDEX IF NOT EXISTS idx_product_attributes_filterable
ON product_attribute_definitions(is_filterable)
WHERE is_filterable = TRUE;

-- Example attribute definitions for hair/scalp care products
INSERT INTO product_attribute_definitions
  (attribute_key, attribute_label, data_type, is_searchable, is_filterable, display_order, options)
VALUES
  ('volume', 'Volume', 'select', FALSE, TRUE, 1,
   '[{"value": "50ml", "label": "50ml"}, {"value": "100ml", "label": "100ml"}, {"value": "200ml", "label": "200ml"}, {"value": "250ml", "label": "250ml"}]'::jsonb),

  ('hair_type', 'Hair Type', 'multiselect', TRUE, TRUE, 2,
   '[{"value": "dry", "label": "Dry"}, {"value": "oily", "label": "Oily"}, {"value": "normal", "label": "Normal"}, {"value": "damaged", "label": "Damaged"}, {"value": "color-treated", "label": "Color-Treated"}]'::jsonb),

  ('scalp_type', 'Scalp Type', 'multiselect', TRUE, TRUE, 3,
   '[{"value": "sensitive", "label": "Sensitive"}, {"value": "itchy", "label": "Itchy"}, {"value": "flaky", "label": "Flaky"}, {"value": "oily", "label": "Oily"}]'::jsonb),

  ('scent', 'Scent', 'select', TRUE, TRUE, 4,
   '[{"value": "lavender", "label": "Lavender"}, {"value": "rose", "label": "Rose"}, {"value": "mint", "label": "Mint"}, {"value": "citrus", "label": "Citrus"}, {"value": "unscented", "label": "Unscented"}]'::jsonb),

  ('ingredients', 'Key Ingredients', 'multiselect', TRUE, FALSE, 5,
   '[{"value": "argan-oil", "label": "Argan Oil"}, {"value": "keratin", "label": "Keratin"}, {"value": "biotin", "label": "Biotin"}, {"value": "collagen", "label": "Collagen"}, {"value": "tea-tree", "label": "Tea Tree"}]'::jsonb),

  ('organic', 'Organic', 'boolean', TRUE, TRUE, 6, NULL),
  ('vegan', 'Vegan', 'boolean', TRUE, TRUE, 7, NULL),
  ('paraben_free', 'Paraben Free', 'boolean', TRUE, TRUE, 8, NULL),
  ('sulfate_free', 'Sulfate Free', 'boolean', TRUE, TRUE, 9, NULL),
  ('cruelty_free', 'Cruelty Free', 'boolean', TRUE, TRUE, 10, NULL),

  ('application_method', 'Application Method', 'select', FALSE, TRUE, 11,
   '[{"value": "spray", "label": "Spray"}, {"value": "pump", "label": "Pump"}, {"value": "dropper", "label": "Dropper"}, {"value": "direct", "label": "Direct Application"}]'::jsonb),

  ('texture', 'Texture', 'select', TRUE, FALSE, 12,
   '[{"value": "liquid", "label": "Liquid"}, {"value": "cream", "label": "Cream"}, {"value": "gel", "label": "Gel"}, {"value": "serum", "label": "Serum"}, {"value": "oil", "label": "Oil"}]'::jsonb)

ON CONFLICT (attribute_key) DO NOTHING;

-- Function to validate custom attributes against definitions
CREATE OR REPLACE FUNCTION validate_custom_attributes()
RETURNS TRIGGER AS $$
DECLARE
  attr_key TEXT;
  attr_value JSONB;
  definition RECORD;
BEGIN
  -- Skip validation if custom_attributes is null or empty
  IF NEW.custom_attributes IS NULL OR NEW.custom_attributes = '{}'::jsonb THEN
    RETURN NEW;
  END IF;

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
      WHEN 'text' THEN
        IF jsonb_typeof(attr_value) != 'string' THEN
          RAISE EXCEPTION 'Attribute % must be a string', attr_key;
        END IF;
      WHEN 'select' THEN
        -- Validate against options
        IF definition.options IS NOT NULL THEN
          IF NOT EXISTS (
            SELECT 1 FROM jsonb_array_elements(definition.options) AS opt
            WHERE opt->>'value' = attr_value#>>'{}'
          ) THEN
            RAISE EXCEPTION 'Invalid option for attribute %: %', attr_key, attr_value;
          END IF;
        END IF;
      WHEN 'multiselect' THEN
        -- Validate all values against options
        IF jsonb_typeof(attr_value) != 'array' THEN
          RAISE EXCEPTION 'Attribute % must be an array', attr_key;
        END IF;
        IF definition.options IS NOT NULL THEN
          -- Check each value in the array
          IF EXISTS (
            SELECT 1 FROM jsonb_array_elements_text(attr_value) AS val
            WHERE NOT EXISTS (
              SELECT 1 FROM jsonb_array_elements(definition.options) AS opt
              WHERE opt->>'value' = val
            )
          ) THEN
            RAISE EXCEPTION 'Invalid options for attribute %', attr_key;
          END IF;
        END IF;
      -- Add more validation as needed
    END CASE;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for attribute validation
DROP TRIGGER IF EXISTS validate_product_attributes_trigger ON products;
CREATE TRIGGER validate_product_attributes_trigger
BEFORE INSERT OR UPDATE OF custom_attributes ON products
FOR EACH ROW
EXECUTE FUNCTION validate_custom_attributes();

-- Update search vector function to include custom attributes
-- This replaces the existing trigger function from migration 002
CREATE OR REPLACE FUNCTION update_product_search_vector()
RETURNS TRIGGER AS $$
DECLARE
  attr_text TEXT := '';
BEGIN
  -- Extract searchable attribute values for full-text search
  SELECT string_agg(value, ' ')
  INTO attr_text
  FROM (
    SELECT jsonb_array_elements_text(value) AS value
    FROM jsonb_each(NEW.custom_attributes)
    WHERE jsonb_typeof(value) = 'array'
    UNION ALL
    SELECT value#>>'{}'
    FROM jsonb_each(NEW.custom_attributes)
    WHERE jsonb_typeof(value) = 'string'
  ) subq;

  NEW.search_vector :=
    setweight(to_tsvector('english', COALESCE(NEW.name, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.short_description, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'C') ||
    setweight(to_tsvector('english', COALESCE(array_to_string(ARRAY(SELECT jsonb_array_elements_text(NEW.categories)), ' '), '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.slug, '')), 'D') ||
    setweight(to_tsvector('english', COALESCE(attr_text, '')), 'D');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to get filterable attributes for a category
CREATE OR REPLACE FUNCTION get_filterable_attributes(category_filter TEXT DEFAULT NULL)
RETURNS TABLE(
  id INTEGER,
  attribute_key VARCHAR(100),
  attribute_label VARCHAR(255),
  data_type VARCHAR(50),
  options JSONB,
  display_order INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    pad.id,
    pad.attribute_key,
    pad.attribute_label,
    pad.data_type,
    pad.options,
    pad.display_order
  FROM product_attribute_definitions pad
  WHERE pad.is_filterable = TRUE
    AND (category_filter IS NULL OR pad.category_ids = '{}' OR category_filter = ANY(pad.category_ids::TEXT[]))
  ORDER BY pad.display_order, pad.attribute_label;
END;
$$ LANGUAGE plpgsql STABLE;
