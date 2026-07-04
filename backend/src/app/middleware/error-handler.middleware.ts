// Global error handler — the last middleware registered in app.ts.
// Every thrown AppError (or subclass) is formatted consistently; unexpected errors are logged
// and returned as a generic 500 so internals never leak to the client.

import { NextFunction, Request, Response } from 'express';
import { AppError } from '../shared/errors';
import { ApiResponse } from '../shared/response/api-response';
import { logger } from '../shared/logger/logger';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const errorHandler = (err: Error, req: Request, res: Response, _next: NextFunction): void => {
  if (err instanceof AppError) {
    logger.warn({ err, path: req.path }, err.message);
    ApiResponse.error(res, err.message, err.statusCode, err.details);
    return;
  }

  logger.error({ err, path: req.path }, 'Unhandled error');
  ApiResponse.error(res, 'Internal server error', 500);
};
