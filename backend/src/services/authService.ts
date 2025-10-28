import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';

const DEFAULT_PASSWORD = 'LuxiaAdmin2024!';
const fallbackHash = env.adminPasswordHash ?? bcrypt.hashSync(DEFAULT_PASSWORD, 10);

export const authService = {
  async validateCredentials(email: string, password: string) {
    if (email !== env.adminEmail) return null;
    const match = await bcrypt.compare(password, fallbackHash);
    if (!match) return null;
    return {
      token: jwt.sign({ email }, env.jwtSecret, { expiresIn: '8h' })
    };
  }
};
