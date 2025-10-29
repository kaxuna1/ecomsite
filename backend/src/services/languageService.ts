import { pool } from '../db/client';
import type { Language, LanguagePayload, UpdateLanguagePayload } from '../types';

const mapLanguage = (row: any): Language => ({
  code: row.code,
  name: row.name,
  nativeName: row.native_name,
  isDefault: row.is_default,
  isEnabled: row.is_enabled,
  displayOrder: row.display_order,
  createdAt: row.created_at
});

export const languageService = {
  async list(includeDisabled: boolean = false): Promise<Language[]> {
    const query = `
      SELECT * FROM languages
      ${!includeDisabled ? 'WHERE is_enabled = true' : ''}
      ORDER BY display_order ASC, code ASC
    `;

    const result = await pool.query(query);
    return result.rows.map(mapLanguage);
  },

  async getByCode(code: string): Promise<Language | null> {
    const query = 'SELECT * FROM languages WHERE code = $1';
    const result = await pool.query(query, [code]);

    if (result.rows.length === 0) {
      return null;
    }

    return mapLanguage(result.rows[0]);
  },

  async create(payload: LanguagePayload): Promise<Language> {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Check if language code already exists
      const existingCheck = await client.query(
        'SELECT code FROM languages WHERE code = $1',
        [payload.code]
      );

      if (existingCheck.rows.length > 0) {
        throw new Error(`Language with code '${payload.code}' already exists`);
      }

      // If this is set as default, unset other defaults
      if (payload.isDefault) {
        await client.query('UPDATE languages SET is_default = false');
      }

      // Get the next display order if not provided
      let displayOrder = payload.displayOrder;
      if (displayOrder === undefined) {
        const maxOrderResult = await client.query(
          'SELECT COALESCE(MAX(display_order), 0) + 1 as next_order FROM languages'
        );
        displayOrder = maxOrderResult.rows[0].next_order;
      }

      const query = `
        INSERT INTO languages (code, name, native_name, is_default, is_enabled, display_order)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `;

      const result = await client.query(query, [
        payload.code,
        payload.name,
        payload.nativeName,
        payload.isDefault ?? false,
        payload.isEnabled ?? true,
        displayOrder
      ]);

      await client.query('COMMIT');
      return mapLanguage(result.rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  async update(code: string, payload: UpdateLanguagePayload): Promise<Language> {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Check if language exists
      const existingCheck = await client.query(
        'SELECT code FROM languages WHERE code = $1',
        [code]
      );

      if (existingCheck.rows.length === 0) {
        throw new Error(`Language with code '${code}' not found`);
      }

      // If this is set as default, unset other defaults
      if (payload.isDefault) {
        await client.query('UPDATE languages SET is_default = false WHERE code != $1', [code]);
      }

      const updates: string[] = [];
      const values: any[] = [];
      let paramCount = 1;

      if (payload.name !== undefined) {
        updates.push(`name = $${paramCount++}`);
        values.push(payload.name);
      }

      if (payload.nativeName !== undefined) {
        updates.push(`native_name = $${paramCount++}`);
        values.push(payload.nativeName);
      }

      if (payload.isDefault !== undefined) {
        updates.push(`is_default = $${paramCount++}`);
        values.push(payload.isDefault);
      }

      if (payload.isEnabled !== undefined) {
        updates.push(`is_enabled = $${paramCount++}`);
        values.push(payload.isEnabled);
      }

      if (payload.displayOrder !== undefined) {
        updates.push(`display_order = $${paramCount++}`);
        values.push(payload.displayOrder);
      }

      if (updates.length === 0) {
        // No updates provided, just return current language
        return (await this.getByCode(code))!;
      }

      values.push(code);

      const query = `
        UPDATE languages
        SET ${updates.join(', ')}
        WHERE code = $${paramCount}
        RETURNING *
      `;

      const result = await client.query(query, values);
      await client.query('COMMIT');

      return mapLanguage(result.rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  async delete(code: string): Promise<void> {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Check if language exists
      const existingCheck = await client.query(
        'SELECT code, is_default FROM languages WHERE code = $1',
        [code]
      );

      if (existingCheck.rows.length === 0) {
        throw new Error(`Language with code '${code}' not found`);
      }

      // Prevent deleting the default language
      if (existingCheck.rows[0].is_default) {
        throw new Error('Cannot delete the default language');
      }

      // Delete the language (cascade will handle translations)
      await client.query('DELETE FROM languages WHERE code = $1', [code]);

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  async toggleEnabled(code: string): Promise<Language> {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Check if language exists and is not default
      const existingCheck = await client.query(
        'SELECT code, is_default, is_enabled FROM languages WHERE code = $1',
        [code]
      );

      if (existingCheck.rows.length === 0) {
        throw new Error(`Language with code '${code}' not found`);
      }

      // Prevent disabling the default language
      if (existingCheck.rows[0].is_default && existingCheck.rows[0].is_enabled) {
        throw new Error('Cannot disable the default language');
      }

      const query = `
        UPDATE languages
        SET is_enabled = NOT is_enabled
        WHERE code = $1
        RETURNING *
      `;

      const result = await client.query(query, [code]);
      await client.query('COMMIT');

      return mapLanguage(result.rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  async getDefault(): Promise<Language> {
    const query = 'SELECT * FROM languages WHERE is_default = true LIMIT 1';
    const result = await pool.query(query);

    if (result.rows.length === 0) {
      throw new Error('No default language configured');
    }

    return mapLanguage(result.rows[0]);
  }
};
