import { pool } from '../db/client';

export interface AttributeDefinition {
  id: number;
  attributeKey: string;
  attributeLabel: string;
  dataType: 'text' | 'number' | 'boolean' | 'select' | 'multiselect' | 'date';
  isSearchable: boolean;
  isFilterable: boolean;
  isRequired: boolean;
  validationRules: Record<string, any>;
  options?: Array<{ value: string; label: string }>;
  categoryIds: number[];
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface AttributeDefinitionPayload {
  attributeKey: string;
  attributeLabel: string;
  dataType: 'text' | 'number' | 'boolean' | 'select' | 'multiselect' | 'date';
  isSearchable?: boolean;
  isFilterable?: boolean;
  isRequired?: boolean;
  validationRules?: Record<string, any>;
  options?: Array<{ value: string; label: string }>;
  categoryIds?: number[];
  displayOrder?: number;
}

const mapAttributeDefinition = (row: any): AttributeDefinition => ({
  id: row.id,
  attributeKey: row.attribute_key,
  attributeLabel: row.attribute_label,
  dataType: row.data_type,
  isSearchable: row.is_searchable,
  isFilterable: row.is_filterable,
  isRequired: row.is_required,
  validationRules: row.validation_rules || {},
  options: row.options || undefined,
  categoryIds: row.category_ids || [],
  displayOrder: row.display_order,
  createdAt: row.created_at,
  updatedAt: row.updated_at
});

export const attributeService = {
  // List all attribute definitions
  async list(): Promise<AttributeDefinition[]> {
    const result = await pool.query(
      `SELECT * FROM product_attribute_definitions ORDER BY display_order, attribute_label`
    );
    return result.rows.map(mapAttributeDefinition);
  },

  // Get filterable attributes (optionally filtered by category)
  async getFilterable(category?: string): Promise<AttributeDefinition[]> {
    const result = await pool.query(
      `SELECT * FROM get_filterable_attributes($1)`,
      [category || null]
    );
    return result.rows.map(row => ({
      id: row.id,
      attributeKey: row.attribute_key,
      attributeLabel: row.attribute_label,
      dataType: row.data_type,
      options: row.options || undefined,
      displayOrder: row.display_order,
      isSearchable: false,
      isFilterable: true,
      isRequired: false,
      validationRules: {},
      categoryIds: [],
      createdAt: '',
      updatedAt: ''
    }));
  },

  // Get single attribute definition
  async get(id: number): Promise<AttributeDefinition | null> {
    const result = await pool.query(
      `SELECT * FROM product_attribute_definitions WHERE id = $1`,
      [id]
    );
    return result.rows[0] ? mapAttributeDefinition(result.rows[0]) : null;
  },

  // Get by key
  async getByKey(key: string): Promise<AttributeDefinition | null> {
    const result = await pool.query(
      `SELECT * FROM product_attribute_definitions WHERE attribute_key = $1`,
      [key]
    );
    return result.rows[0] ? mapAttributeDefinition(result.rows[0]) : null;
  },

  // Create attribute definition
  async create(payload: AttributeDefinitionPayload): Promise<AttributeDefinition> {
    const result = await pool.query(
      `INSERT INTO product_attribute_definitions
       (attribute_key, attribute_label, data_type, is_searchable, is_filterable,
        is_required, validation_rules, options, category_ids, display_order)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        payload.attributeKey,
        payload.attributeLabel,
        payload.dataType,
        payload.isSearchable ?? false,
        payload.isFilterable ?? false,
        payload.isRequired ?? false,
        JSON.stringify(payload.validationRules || {}),
        payload.options ? JSON.stringify(payload.options) : null,
        payload.categoryIds || [],
        payload.displayOrder ?? 0
      ]
    );
    return mapAttributeDefinition(result.rows[0]);
  },

  // Update attribute definition
  async update(id: number, payload: Partial<AttributeDefinitionPayload>): Promise<AttributeDefinition | null> {
    const current = await this.get(id);
    if (!current) return null;

    const result = await pool.query(
      `UPDATE product_attribute_definitions
       SET attribute_label = $1,
           data_type = $2,
           is_searchable = $3,
           is_filterable = $4,
           is_required = $5,
           validation_rules = $6,
           options = $7,
           category_ids = $8,
           display_order = $9,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $10
       RETURNING *`,
      [
        payload.attributeLabel ?? current.attributeLabel,
        payload.dataType ?? current.dataType,
        payload.isSearchable ?? current.isSearchable,
        payload.isFilterable ?? current.isFilterable,
        payload.isRequired ?? current.isRequired,
        JSON.stringify(payload.validationRules ?? current.validationRules),
        payload.options ? JSON.stringify(payload.options) : current.options ? JSON.stringify(current.options) : null,
        payload.categoryIds ?? current.categoryIds,
        payload.displayOrder ?? current.displayOrder,
        id
      ]
    );
    return mapAttributeDefinition(result.rows[0]);
  },

  // Delete attribute definition
  async remove(id: number): Promise<boolean> {
    const result = await pool.query(
      `DELETE FROM product_attribute_definitions WHERE id = $1`,
      [id]
    );
    return result.rowCount !== null && result.rowCount > 0;
  },

  // Get unique values for a specific attribute across all products
  async getUniqueValues(attributeKey: string): Promise<string[]> {
    const result = await pool.query(
      `SELECT DISTINCT jsonb_array_elements_text(custom_attributes->$1) as value
       FROM products
       WHERE custom_attributes ? $1
         AND jsonb_typeof(custom_attributes->$1) = 'array'
       UNION
       SELECT DISTINCT custom_attributes->>$1 as value
       FROM products
       WHERE custom_attributes ? $1
         AND jsonb_typeof(custom_attributes->$1) != 'array'
       ORDER BY value`,
      [attributeKey]
    );
    return result.rows.map(row => row.value).filter(Boolean);
  }
};
