import type { Response } from 'express';

interface SuccessResponse<T> {
  success: true;
  data: T;
}

interface ErrorResponse {
  success: false;
  error: {
    message: string;
    code?: string;
  };
}

export function sendSuccess<T>(res: Response, data: T, statusCode = 200): Response {
  const body: SuccessResponse<T> = { success: true, data };
  return res.status(statusCode).json(body);
}

export function sendError(
  res: Response,
  message: string,
  statusCode = 500,
  code?: string
): Response {
  const body: ErrorResponse = {
    success: false,
    error: { message, ...(code && { code }) },
  };
  return res.status(statusCode).json(body);
}
