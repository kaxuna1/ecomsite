import { pool } from '../db/client';

interface RegularUser {
  id: number;
  email: string;
  name: string;
  createdAt: string;
  orderCount: number;
  totalSpent: number;
}

interface UpdateUserPayload {
  email?: string;
  name?: string;
}

export const regularUserService = {
  async list(): Promise<RegularUser[]> {
    const result = await pool.query(
      `SELECT u.id, u.email, u.name,
              u.created_at as "createdAt",
              COUNT(DISTINCT o.id) as "orderCount",
              COALESCE(SUM(o.total), 0) as "totalSpent"
       FROM users u
       LEFT JOIN orders o ON u.id = o.user_id
       GROUP BY u.id, u.email, u.name, u.created_at
       ORDER BY u.created_at DESC`
    );

    return result.rows.map(row => ({
      ...row,
      orderCount: parseInt(row.orderCount),
      totalSpent: parseFloat(row.totalSpent)
    }));
  },

  async getById(id: number): Promise<RegularUser | null> {
    const result = await pool.query(
      `SELECT u.id, u.email, u.name,
              u.created_at as "createdAt",
              COUNT(DISTINCT o.id) as "orderCount",
              COALESCE(SUM(o.total), 0) as "totalSpent"
       FROM users u
       LEFT JOIN orders o ON u.id = o.user_id
       WHERE u.id = $1
       GROUP BY u.id, u.email, u.name, u.created_at`,
      [id]
    );

    if (result.rows.length === 0) return null;

    const row = result.rows[0];
    return {
      ...row,
      orderCount: parseInt(row.orderCount),
      totalSpent: parseFloat(row.totalSpent)
    };
  },

  async update(id: number, payload: UpdateUserPayload): Promise<RegularUser | null> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (payload.email !== undefined) {
      // Check if new email already exists (for different user)
      const existing = await pool.query(
        'SELECT id FROM users WHERE email = $1 AND id != $2',
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

    if (updates.length === 0) {
      return this.getById(id);
    }

    values.push(id);

    await pool.query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramIndex}`,
      values
    );

    return this.getById(id);
  },

  async delete(id: number): Promise<boolean> {
    // Delete user (orders will remain with null user_id due to ON DELETE SET NULL)
    const result = await pool.query('DELETE FROM users WHERE id = $1', [id]);
    return result.rowCount !== null && result.rowCount > 0;
  },

  async getStats() {
    const result = await pool.query(
      `SELECT
         COUNT(*) as "totalUsers",
         COUNT(CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as "newUsers"
       FROM users`
    );

    // Count active users as those who have placed orders in the last 30 days
    const activeResult = await pool.query(
      `SELECT COUNT(DISTINCT user_id) as "activeUsers"
       FROM orders
       WHERE user_id IS NOT NULL AND created_at >= NOW() - INTERVAL '30 days'`
    );

    return {
      totalUsers: parseInt(result.rows[0].totalUsers),
      activeUsers: parseInt(activeResult.rows[0].activeUsers) || 0,
      newUsers: parseInt(result.rows[0].newUsers)
    };
  }
};
