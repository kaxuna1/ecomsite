import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';

export interface AuthenticatedRequest extends Request {
  user?: { email: string };
  userId?: number;
  adminId?: number;
  role?: string;
}

export const authenticate = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  const token = header.replace('Bearer ', '');
  try {
    const payload = jwt.verify(token, env.jwtSecret) as {
      email: string;
      userId?: number;
      id?: number;
      role?: string;
    };
    req.user = { email: payload.email };

    // Extract userId if present in token (for regular user authentication)
    if (payload.userId) {
      req.userId = payload.userId;
    }

    // Extract admin id and role if present in token (for admin authentication)
    if (payload.id && payload.role) {
      req.adminId = payload.id;
      req.role = payload.role;
    }

    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

// User-specific authentication middleware (requires userId in token)
export const userAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  const token = header.replace('Bearer ', '');
  try {
    const payload = jwt.verify(token, env.jwtSecret) as {
      email: string;
      userId?: number;
    };

    if (!payload.userId) {
      return res.status(403).json({ message: 'User authentication required' });
    }

    req.user = { email: payload.email };
    req.userId = payload.userId;

    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

// Optional authentication middleware (doesn't fail if no token, but extracts userId if present)
export const optionalAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    // No token provided, continue as guest
    return next();
  }
  const token = header.replace('Bearer ', '');
  try {
    const payload = jwt.verify(token, env.jwtSecret) as {
      email: string;
      userId?: number;
      id?: number;
      role?: string;
    };
    req.user = { email: payload.email };

    // Extract userId if present in token (for regular user authentication)
    if (payload.userId) {
      req.userId = payload.userId;
    }

    // Extract admin id and role if present in token (for admin authentication)
    if (payload.id && payload.role) {
      req.adminId = payload.id;
      req.role = payload.role;
    }

    next();
  } catch (error) {
    // Invalid token, continue as guest
    next();
  }
};
