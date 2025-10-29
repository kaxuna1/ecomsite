import { Response } from 'express';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    message: string;
    details?: any;
  };
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

export const success = <T>(
  res: Response,
  data: T,
  message?: string,
  statusCode = 200,
  meta?: ApiResponse['meta']
): Response => {
  const response: ApiResponse<T> = {
    success: true,
    data,
    ...(message && { message }),
    ...(meta && { meta }),
  };
  return res.status(statusCode).json(response);
};

export const error = (
  res: Response,
  message: string,
  statusCode = 500,
  details?: any
): Response => {
  const response: ApiResponse = {
    success: false,
    error: {
      message,
      ...(details && { details }),
    },
  };
  return res.status(statusCode).json(response);
};

export const created = <T>(res: Response, data: T, message = 'Resource created'): Response => {
  return success(res, data, message, 201);
};

export const noContent = (res: Response): Response => {
  return res.status(204).send();
};
