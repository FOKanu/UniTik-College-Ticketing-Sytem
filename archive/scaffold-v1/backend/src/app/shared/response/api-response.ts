// Consistent response envelope used by every controller.
// TODO: extend with pagination metadata helper once list endpoints have real persistence.

import { Response } from 'express';

export interface ApiSuccessBody<T> {
  success: true;
  data: T;
  meta?: Record<string, unknown>;
}

export interface ApiErrorBody {
  success: false;
  error: {
    message: string;
    details?: unknown;
  };
}

export class ApiResponse {
  static success<T>(res: Response, data: T, statusCode = 200, meta?: Record<string, unknown>): Response {
    const body: ApiSuccessBody<T> = { success: true, data, ...(meta ? { meta } : {}) };
    return res.status(statusCode).json(body);
  }

  static error(res: Response, message: string, statusCode = 500, details?: unknown): Response {
    const body: ApiErrorBody = { success: false, error: { message, details } };
    return res.status(statusCode).json(body);
  }
}
