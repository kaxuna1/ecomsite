import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import { error as errorResponse } from '../utils/response';
import { logger } from '../utils/logger';
import { env } from '../config/env';

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Log the error
  logger.error('Error occurred:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  // Check if it's an operational error
  if (err instanceof AppError) {
    errorResponse(
      res,
      err.message,
      err.statusCode,
      env.NODE_ENV === 'development' ? err.stack : undefined
    );
    return;
  }

  // Handle PostgreSQL errors
  if ('code' in err) {
    const pgError = err as any;
    switch (pgError.code) {
      case '23505': // Unique violation
        errorResponse(res, 'Resource already exists', 409);
        return;
      case '23503': // Foreign key violation
        errorResponse(res, 'Referenced resource not found', 404);
        return;
      case '23502': // Not null violation
        errorResponse(res, 'Required field is missing', 400);
        return;
    }
  }

  // Default to 500 server error
  errorResponse(
    res,
    env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
    500,
    env.NODE_ENV === 'development' ? err.stack : undefined
  );
};

export const notFoundHandler = (req: Request, res: Response): void => {
  errorResponse(res, `Route ${req.path} not found`, 404);
};
