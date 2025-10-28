import { pool } from '../db/client';
import bcrypt from 'bcryptjs';

interface AdminUser {
  id: number;
  email: string;
  name: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lastLogin: string | null;
}

interface CreateAdminUserPayload {
  email: string;
  password: string;
  name: string;
  role: 'admin' | 'super_admin';
}

interface UpdateAdminUserPayload {
  email?: string;
  name?: string;
  role?: 'admin' | 'super_admin';
  isActive?: boolean;
  password?: string;
}

export const adminUserService = {
  async list(): Promise<AdminUser[]> {
    const result = await pool.query(
      `SELECT id, email, name, role, is_active as "isActive",
              created_at as "createdAt", updated_at as "updatedAt",
              last_login as "lastLogin"
       FROM admin_users
       ORDER BY created_at DESC`
    );
    return result.rows;
  },

  async getById(id: number): Promise<AdminUser | null> {
    const result = await pool.query(
      `SELECT id, email, name, role, is_active as "isActive",
              created_at as "createdAt", updated_at as "updatedAt",
              last_login as "lastLogin"
       FROM admin_users
       WHERE id = $1`,
      [id]
    );
    return result.rows.length > 0 ? result.rows[0] : null;
  },

  async create(payload: CreateAdminUserPayload): Promise<AdminUser> {
    // Check if email already exists
    const existing = await pool.query(
      'SELECT id FROM admin_users WHERE email = $1',
      [payload.email]
    );

    if (existing.rows.length > 0) {
      throw new Error('Email already exists');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(payload.password, 10);

    const result = await pool.query(
      `INSERT INTO admin_users (email, password_hash, name, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, email, name, role, is_active as "isActive",
                 created_at as "createdAt", updated_at as "updatedAt",
                 last_login as "lastLogin"`,
      [payload.email, passwordHash, payload.name, payload.role]
    );

    return result.rows[0];
  },

  async update(id: number, payload: UpdateAdminUserPayload): Promise<AdminUser | null> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (payload.email !== undefined) {
      // Check if new email already exists (for different user)
      const existing = await pool.query(
        'SELECT id FROM admin_users WHERE email = $1 AND id != $2',
        [payload.email, id]
      );
      if (existing.rows.length > 0) {
        throw new Error('Email already exists');
      }
      updates.push(`email = $${paramIndex++}`);
      values.push(payload.email);
    }

    if (payload.name !== undefined) {
      updates.push(`name = $${paramIndex++}`);
      values.push(payload.name);
    }

    if (payload.role !== undefined) {
      updates.push(`role = $${paramIndex++}`);
      values.push(payload.role);
    }

    if (payload.isActive !== undefined) {
      updates.push(`is_active = $${paramIndex++}`);
      values.push(payload.isActive);
    }

    if (payload.password !== undefined) {
      const passwordHash = await bcrypt.hash(payload.password, 10);
      updates.push(`password_hash = $${paramIndex++}`);
      values.push(passwordHash);
    }

    if (updates.length === 0) {
      return this.getById(id);
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const result = await pool.query(
      `UPDATE admin_users
       SET ${updates.join(', ')}
       WHERE id = $${paramIndex}
       RETURNING id, email, name, role, is_active as "isActive",
                 created_at as "createdAt", updated_at as "updatedAt",
                 last_login as "lastLogin"`,
      values
    );

    return result.rows.length > 0 ? result.rows[0] : null;
  },

  async delete(id: number): Promise<boolean> {
    // Prevent deleting the last super admin
    const superAdminCount = await pool.query(
      'SELECT COUNT(*) as count FROM admin_users WHERE role = $1 AND is_active = true',
      ['super_admin']
    );

    if (parseInt(superAdminCount.rows[0].count) <= 1) {
      const user = await this.getById(id);
      if (user?.role === 'super_admin') {
        throw new Error('Cannot delete the last super admin');
      }
    }

    const result = await pool.query('DELETE FROM admin_users WHERE id = $1', [id]);
    return result.rowCount !== null && result.rowCount > 0;
  }
};
