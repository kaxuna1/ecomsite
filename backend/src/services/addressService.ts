import { pool } from '../db/client';

export interface UserAddress {
  id: number;
  userId: number;
  label: string | null;
  name: string;
  phone: string | null;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string | null;
  postalCode: string;
  country: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAddressPayload {
  label?: string;
  name: string;
  phone?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state?: string;
  postalCode: string;
  country?: string;
  isDefault?: boolean;
}

export interface UpdateAddressPayload {
  label?: string;
  name?: string;
  phone?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  isDefault?: boolean;
}

const mapAddress = (row: any): UserAddress => ({
  id: row.id,
  userId: row.user_id,
  label: row.label,
  name: row.name,
  phone: row.phone,
  addressLine1: row.address_line1,
  addressLine2: row.address_line2,
  city: row.city,
  state: row.state,
  postalCode: row.postal_code,
  country: row.country,
  isDefault: row.is_default,
  createdAt: row.created_at,
  updatedAt: row.updated_at
});

export const addressService = {
  async listByUserId(userId: number): Promise<UserAddress[]> {
    const result = await pool.query(
      'SELECT * FROM user_addresses WHERE user_id = $1 ORDER BY is_default DESC, created_at DESC',
      [userId]
    );
    return result.rows.map(mapAddress);
  },

  async getById(id: number, userId: number): Promise<UserAddress | null> {
    const result = await pool.query(
      'SELECT * FROM user_addresses WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    if (result.rows.length === 0) return null;
    return mapAddress(result.rows[0]);
  },

  async create(userId: number, payload: CreateAddressPayload): Promise<UserAddress> {
    const result = await pool.query(
      `INSERT INTO user_addresses (
        user_id, label, name, phone, address_line1, address_line2,
        city, state, postal_code, country, is_default
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *`,
      [
        userId,
        payload.label || null,
        payload.name,
        payload.phone || null,
        payload.addressLine1,
        payload.addressLine2 || null,
        payload.city,
        payload.state || null,
        payload.postalCode,
        payload.country || 'USA',
        payload.isDefault || false
      ]
    );
    return mapAddress(result.rows[0]);
  },

  async update(id: number, userId: number, payload: UpdateAddressPayload): Promise<UserAddress | null> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (payload.label !== undefined) {
      updates.push(`label = $${paramIndex++}`);
      values.push(payload.label);
    }
    if (payload.name !== undefined) {
      updates.push(`name = $${paramIndex++}`);
      values.push(payload.name);
    }
    if (payload.phone !== undefined) {
      updates.push(`phone = $${paramIndex++}`);
      values.push(payload.phone);
    }
    if (payload.addressLine1 !== undefined) {
      updates.push(`address_line1 = $${paramIndex++}`);
      values.push(payload.addressLine1);
    }
    if (payload.addressLine2 !== undefined) {
      updates.push(`address_line2 = $${paramIndex++}`);
      values.push(payload.addressLine2);
    }
    if (payload.city !== undefined) {
      updates.push(`city = $${paramIndex++}`);
      values.push(payload.city);
    }
    if (payload.state !== undefined) {
      updates.push(`state = $${paramIndex++}`);
      values.push(payload.state);
    }
    if (payload.postalCode !== undefined) {
      updates.push(`postal_code = $${paramIndex++}`);
      values.push(payload.postalCode);
    }
    if (payload.country !== undefined) {
      updates.push(`country = $${paramIndex++}`);
      values.push(payload.country);
    }
    if (payload.isDefault !== undefined) {
      updates.push(`is_default = $${paramIndex++}`);
      values.push(payload.isDefault);
    }

    if (updates.length === 0) {
      return this.getById(id, userId);
    }

    updates.push(`updated_at = NOW()`);
    values.push(id, userId);

    const result = await pool.query(
      `UPDATE user_addresses SET ${updates.join(', ')}
       WHERE id = $${paramIndex++} AND user_id = $${paramIndex++}
       RETURNING *`,
      values
    );

    if (result.rows.length === 0) return null;
    return mapAddress(result.rows[0]);
  },

  async delete(id: number, userId: number): Promise<boolean> {
    const result = await pool.query(
      'DELETE FROM user_addresses WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    return result.rowCount !== null && result.rowCount > 0;
  },

  async setDefault(id: number, userId: number): Promise<UserAddress | null> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // First, ensure the address exists and belongs to the user
      const addressCheck = await client.query(
        'SELECT id FROM user_addresses WHERE id = $1 AND user_id = $2',
        [id, userId]
      );

      if (addressCheck.rows.length === 0) {
        await client.query('ROLLBACK');
        return null;
      }

      // Unset all defaults for this user
      await client.query(
        'UPDATE user_addresses SET is_default = false WHERE user_id = $1',
        [userId]
      );

      // Set this address as default
      const result = await client.query(
        'UPDATE user_addresses SET is_default = true, updated_at = NOW() WHERE id = $1 AND user_id = $2 RETURNING *',
        [id, userId]
      );

      await client.query('COMMIT');
      return mapAddress(result.rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  async getDefault(userId: number): Promise<UserAddress | null> {
    const result = await pool.query(
      'SELECT * FROM user_addresses WHERE user_id = $1 AND is_default = true LIMIT 1',
      [userId]
    );
    if (result.rows.length === 0) return null;
    return mapAddress(result.rows[0]);
  }
};
