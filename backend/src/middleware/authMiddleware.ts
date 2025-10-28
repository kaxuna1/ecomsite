import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';

export interface AuthenticatedRequest extends Request {
  user?: { email: string };
}

export const authenticate = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  const token = header.replace('Bearer ', '');
  try {
    const payload = jwt.verify(token, env.jwtSecret) as { email: string };
    req.user = { email: payload.email };
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};
