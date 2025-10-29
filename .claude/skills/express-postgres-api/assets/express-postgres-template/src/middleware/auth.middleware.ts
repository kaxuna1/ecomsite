import { Request, Response, NextFunction } from 'express';
import { userService } from '../services/user.service';
import { UnauthorizedError } from '../utils/errors';

export interface AuthRequest extends Request {
  userId?: number;
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('No token provided');
    }

    const token = authHeader.substring(7);
    const payload = await userService.verifyToken(token);

    req.userId = payload.userId;
    next();
  } catch (error) {
    next(error);
  }
};

export const optionalAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const payload = await userService.verifyToken(token);
      req.userId = payload.userId;
    }

    next();
  } catch (error) {
    // For optional auth, continue even if token is invalid
    next();
  }
};
