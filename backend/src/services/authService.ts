import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../db/client';
import { env } from '../config/env';

const DEFAULT_ADMIN_USERNAME = 'sa';
const DEFAULT_ADMIN_PASSWORD = '123456';

export const authService = {
  async validateCredentials(username: string, password: string) {
    const result = await pool.query<{ username: string; password_hash: string }>(
      'SELECT username, password_hash FROM admin_users WHERE username = $1',
      [username]
    );
    if (result.rowCount === 0) {
      return null;
    }
    const user = result.rows[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return null;

    return {
      token: jwt.sign({ username: user.username }, env.jwtSecret, { expiresIn: '8h' })
    };
  },
  async ensureDefaultAdmin() {
    const passwordHash = await bcrypt.hash(DEFAULT_ADMIN_PASSWORD, 10);
    await pool.query(
      `INSERT INTO admin_users (username, password_hash)
       VALUES ($1, $2)
       ON CONFLICT (username) DO NOTHING`,
      [DEFAULT_ADMIN_USERNAME, passwordHash]
    );
  }
};
