// Wraps async route handlers so rejected promises reach the global error handler
// instead of needing a try/catch in every controller method.

import { NextFunction, Request, Response } from 'express';

type AsyncFn = (req: Request, res: Response, next: NextFunction) => Promise<unknown>;

export const asyncHandler =
  (fn: AsyncFn) =>
  (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
