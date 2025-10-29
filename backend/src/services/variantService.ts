import { pool } from '../db/client';
import type { ProductVariant, CreateVariantPayload, UpdateVariantPayload, VariantOption, VariantOptionValue } from '../types';

// Helper to map database row to ProductVariant
const mapVariant = (row: any): ProductVariant => ({
  id: row.variant_id,
  productId: row.product_id,
  sku: row.sku,
  price: row.price ? parseFloat(row.price) : null,
  salePrice: row.sale_price ? parseFloat(row.sale_price) : null,
  inventory: row.inventory,
  weight: row.weight ? parseFloat(row.weight) : null,
  dimensionsLength: row.dimensions_length ? parseFloat(row.dimensions_length) : null,
  dimensionsWidth: row.dimensions_width ? parseFloat(row.dimensions_width) : null,
  dimensionsHeight: row.dimensions_height ? parseFloat(row.dimensions_height) : null,
  isActive: row.is_active,
  isDefault: row.is_default,
  imageUrl: row.image_url,
  salesCount: row.sales_count,
  options: row.options || [],
  createdAt: row.created_at,
  updatedAt: row.updated_at
});

export const variantService = {
  // Get all variant option types (Size, Color, etc.)
  async getVariantOptions(): Promise<VariantOption[]> {
    const result = await pool.query(
      'SELECT id, name, display_order, created_at, updated_at FROM variant_options ORDER BY display_order'
    );
    return result.rows.map(row => ({
      id: row.id,
      name: row.name,
      displayOrder: row.display_order,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
  },

  // Get all values for a specific option type
  async getVariantOptionValues(optionId: number): Promise<VariantOptionValue[]> {
    const result = await pool.query(
      'SELECT id, option_id, value, display_order, created_at FROM variant_option_values WHERE option_id = $1 ORDER BY display_order',
      [optionId]
    );
    return result.rows.map(row => ({
      id: row.id,
      optionId: row.option_id,
      value: row.value,
      displayOrder: row.display_order,
      createdAt: row.created_at
    }));
  },

  // Get all values for all option types
  async getAllVariantOptionValues(): Promise<VariantOptionValue[]> {
    const result = await pool.query(
      `SELECT vov.id, vov.option_id, vov.value, vov.display_order, vov.created_at
       FROM variant_option_values vov
       JOIN variant_options vo ON vov.option_id = vo.id
       ORDER BY vo.display_order, vov.display_order`
    );
    return result.rows.map(row => ({
      id: row.id,
      optionId: row.option_id,
      value: row.value,
      displayOrder: row.display_order,
      createdAt: row.created_at
    }));
  },

  // Get all variants for a product using the database function
  async getProductVariants(productId: number): Promise<ProductVariant[]> {
    const result = await pool.query(
      'SELECT * FROM get_product_variants($1)',
      [productId]
    );
    return result.rows.map(mapVariant);
  },

  // Get a single variant by ID with its options
  async getVariant(variantId: number): Promise<ProductVariant | null> {
    const result = await pool.query(
      `SELECT
        pv.id as variant_id,
        pv.product_id,
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
        pv.created_at,
        pv.updated_at,
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
        ) as options
      FROM product_variants pv
      LEFT JOIN product_variant_options pvo ON pv.id = pvo.variant_id
      LEFT JOIN variant_option_values vov ON pvo.option_value_id = vov.id
      LEFT JOIN variant_options vo ON vov.option_id = vo.id
      WHERE pv.id = $1
      GROUP BY pv.id`,
      [variantId]
    );

    return result.rows[0] ? mapVariant(result.rows[0]) : null;
  },

  // Get a variant by SKU
  async getVariantBySKU(sku: string): Promise<ProductVariant | null> {
    const result = await pool.query(
      `SELECT
        pv.id as variant_id,
        pv.product_id,
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
        pv.created_at,
        pv.updated_at,
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
        ) as options
      FROM product_variants pv
      LEFT JOIN product_variant_options pvo ON pv.id = pvo.variant_id
      LEFT JOIN variant_option_values vov ON pvo.option_value_id = vov.id
      LEFT JOIN variant_options vo ON vov.option_id = vo.id
      WHERE pv.sku = $1
      GROUP BY pv.id`,
      [sku]
    );

    return result.rows[0] ? mapVariant(result.rows[0]) : null;
  },

  // Create a new variant
  async createVariant(productId: number, payload: CreateVariantPayload): Promise<ProductVariant> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Insert the variant
      const variantResult = await client.query(
        `INSERT INTO product_variants
         (product_id, sku, price, sale_price, inventory, weight, dimensions_length,
          dimensions_width, dimensions_height, is_active, is_default, image_url)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
         RETURNING *`,
        [
          productId,
          payload.sku,
          payload.price ?? null,
          payload.salePrice ?? null,
          payload.inventory,
          payload.weight ?? null,
          payload.dimensionsLength ?? null,
          payload.dimensionsWidth ?? null,
          payload.dimensionsHeight ?? null,
          payload.isActive ?? true,
          payload.isDefault ?? false,
          payload.imageUrl ?? null
        ]
      );

      const variantId = variantResult.rows[0].id;

      // Insert variant option values
      if (payload.optionValueIds && payload.optionValueIds.length > 0) {
        for (const valueId of payload.optionValueIds) {
          await client.query(
            'INSERT INTO product_variant_options (variant_id, option_value_id) VALUES ($1, $2)',
            [variantId, valueId]
          );
        }
      }

      await client.query('COMMIT');

      // Fetch and return the complete variant with options
      const variant = await this.getVariant(variantId);
      return variant!;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  // Update a variant
  async updateVariant(variantId: number, payload: UpdateVariantPayload): Promise<ProductVariant | null> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Build dynamic update query
      const updateFields: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (payload.sku !== undefined) {
        updateFields.push(`sku = $${paramIndex++}`);
        values.push(payload.sku);
      }
      if (payload.price !== undefined) {
        updateFields.push(`price = $${paramIndex++}`);
        values.push(payload.price);
      }
      if (payload.salePrice !== undefined) {
        updateFields.push(`sale_price = $${paramIndex++}`);
        values.push(payload.salePrice);
      }
      if (payload.inventory !== undefined) {
        updateFields.push(`inventory = $${paramIndex++}`);
        values.push(payload.inventory);
      }
      if (payload.weight !== undefined) {
        updateFields.push(`weight = $${paramIndex++}`);
        values.push(payload.weight);
      }
      if (payload.dimensionsLength !== undefined) {
        updateFields.push(`dimensions_length = $${paramIndex++}`);
        values.push(payload.dimensionsLength);
      }
      if (payload.dimensionsWidth !== undefined) {
        updateFields.push(`dimensions_width = $${paramIndex++}`);
        values.push(payload.dimensionsWidth);
      }
      if (payload.dimensionsHeight !== undefined) {
        updateFields.push(`dimensions_height = $${paramIndex++}`);
        values.push(payload.dimensionsHeight);
      }
      if (payload.isActive !== undefined) {
        updateFields.push(`is_active = $${paramIndex++}`);
        values.push(payload.isActive);
      }
      if (payload.isDefault !== undefined) {
        updateFields.push(`is_default = $${paramIndex++}`);
        values.push(payload.isDefault);
      }
      if (payload.imageUrl !== undefined) {
        updateFields.push(`image_url = $${paramIndex++}`);
        values.push(payload.imageUrl);
      }

      // Update variant if there are fields to update
      if (updateFields.length > 0) {
        updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
        values.push(variantId);

        await client.query(
          `UPDATE product_variants SET ${updateFields.join(', ')} WHERE id = $${paramIndex}`,
          values
        );
      }

      // Update option values if provided
      if (payload.optionValueIds !== undefined) {
        // Delete existing option values
        await client.query('DELETE FROM product_variant_options WHERE variant_id = $1', [variantId]);

        // Insert new option values
        if (payload.optionValueIds.length > 0) {
          for (const valueId of payload.optionValueIds) {
            await client.query(
              'INSERT INTO product_variant_options (variant_id, option_value_id) VALUES ($1, $2)',
              [variantId, valueId]
            );
          }
        }
      }

      await client.query('COMMIT');

      // Fetch and return the updated variant
      const variant = await this.getVariant(variantId);
      return variant;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  // Delete a variant
  async deleteVariant(variantId: number): Promise<boolean> {
    const result = await pool.query('DELETE FROM product_variants WHERE id = $1', [variantId]);
    return result.rowCount !== null && result.rowCount > 0;
  },

  // Set a variant as the default for its product
  async setDefaultVariant(variantId: number): Promise<ProductVariant | null> {
    await pool.query(
      'UPDATE product_variants SET is_default = TRUE WHERE id = $1',
      [variantId]
    );
    return this.getVariant(variantId);
  },

  // Create a new variant option type (Size, Color, etc.)
  async createVariantOption(name: string, displayOrder: number = 0): Promise<VariantOption> {
    const result = await pool.query(
      'INSERT INTO variant_options (name, display_order) VALUES ($1, $2) RETURNING *',
      [name, displayOrder]
    );
    const row = result.rows[0];
    return {
      id: row.id,
      name: row.name,
      displayOrder: row.display_order,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  },

  // Create a new variant option value
  async createVariantOptionValue(optionId: number, value: string, displayOrder: number = 0): Promise<VariantOptionValue> {
    const result = await pool.query(
      'INSERT INTO variant_option_values (option_id, value, display_order) VALUES ($1, $2, $3) RETURNING *',
      [optionId, value, displayOrder]
    );
    const row = result.rows[0];
    return {
      id: row.id,
      optionId: row.option_id,
      value: row.value,
      displayOrder: row.display_order,
      createdAt: row.created_at
    };
  }
};
