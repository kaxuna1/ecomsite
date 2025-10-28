import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../db/client';
import { env } from '../config/env';

export interface User {
  id: number;
  email: string;
  name: string;
  createdAt: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  name: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export const userAuthService = {
  async register(payload: RegisterPayload): Promise<{ user: User; token: string } | null> {
    // Check if user exists
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [payload.email]);
    if (existing.rows.length > 0) {
      return null; // User already exists
    }

    // Hash password
    const passwordHash = await bcrypt.hash(payload.password, 10);

    // Insert user
    const result = await pool.query(
      'INSERT INTO users (email, password_hash, name) VALUES ($1, $2, $3) RETURNING id, email, name, created_at',
      [payload.email, passwordHash, payload.name]
    );

    const user = {
      id: result.rows[0].id,
      email: result.rows[0].email,
      name: result.rows[0].name,
      createdAt: result.rows[0].created_at
    };

    const token = jwt.sign({ userId: user.id, email: user.email }, env.jwtSecret, {
      expiresIn: '7d'
    });

    return { user, token };
  },

  async login(payload: LoginPayload): Promise<{ user: User; token: string } | null> {
    // Get user
    const result = await pool.query(
      'SELECT id, email, password_hash, name, created_at FROM users WHERE email = $1',
      [payload.email]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];

    // Verify password
    const match = await bcrypt.compare(payload.password, row.password_hash);
    if (!match) {
      return null;
    }

    const user = {
      id: row.id,
      email: row.email,
      name: row.name,
      createdAt: row.created_at
    };

    const token = jwt.sign({ userId: user.id, email: user.email }, env.jwtSecret, {
      expiresIn: '7d'
    });

    return { user, token };
  },

  async getUserById(userId: number): Promise<User | null> {
    const result = await pool.query(
      'SELECT id, email, name, created_at FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      id: row.id,
      email: row.email,
      name: row.name,
      createdAt: row.created_at
    };
  }
};
