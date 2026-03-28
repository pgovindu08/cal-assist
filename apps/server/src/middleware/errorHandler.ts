import type { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/apiResponse';

export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err.name === 'AppError') {
    const appErr = err as AppError;
    sendError(res, appErr.message, appErr.statusCode, appErr.code);
    return;
  }

  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    sendError(res, 'Invalid or expired token', 401, 'INVALID_TOKEN');
    return;
  }

  console.error('Unhandled error:', err);
  sendError(res, 'Internal server error', 500);
}
