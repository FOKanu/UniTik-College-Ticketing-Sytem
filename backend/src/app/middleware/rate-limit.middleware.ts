// Placeholder rate limiter — no-op for now so the interface exists where it will be wired in later.
// TODO: replace with `express-rate-limit` (or similar) tuned for chatbot/ticket-creation endpoints
// once NFR-2.7.2 (chatbot performance under peak load) is addressed.

import { NextFunction, Request, Response } from 'express';

export const rateLimitPlaceholder = (_req: Request, _res: Response, next: NextFunction): void => {
  next();
};
