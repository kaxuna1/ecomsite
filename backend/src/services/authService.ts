import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { pool } from '../db/client';

interface AdminUser {
  id: number;
  email: string;
  name: string;
  role: string;
  isActive: boolean;
}

export const authService = {
  async validateCredentials(email: string, password: string) {
    try {
      // Query admin user from database
      const result = await pool.query(
        'SELECT id, email, password_hash, name, role, is_active FROM admin_users WHERE email = $1',
        [email]
      );

      if (result.rows.length === 0) return null;

      const user = result.rows[0];

      // Check if user is active
      if (!user.is_active) return null;

      // Verify password
      const match = await bcrypt.compare(password, user.password_hash);
      if (!match) return null;

      // Update last login
      await pool.query(
        'UPDATE admin_users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
        [user.id]
      );

      // Generate JWT token with user info
      const token = jwt.sign(
        {
          id: user.id,
          email: user.email,
          role: user.role
        },
        env.jwtSecret,
        { expiresIn: '8h' }
      );

      return {
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        }
      };
    } catch (error) {
      console.error('Auth error:', error);
      return null;
    }
  },

  async getAdminById(id: number): Promise<AdminUser | null> {
    try {
      const result = await pool.query(
        'SELECT id, email, name, role, is_active as "isActive" FROM admin_users WHERE id = $1 AND is_active = true',
        [id]
      );

      if (result.rows.length === 0) return null;
      return result.rows[0];
    } catch (error) {
      console.error('Error fetching admin user:', error);
      return null;
    }
  }
};
