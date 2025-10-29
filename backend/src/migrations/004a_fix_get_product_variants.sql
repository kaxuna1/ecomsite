-- Fix: Remove reference to non-existent display_order column
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
