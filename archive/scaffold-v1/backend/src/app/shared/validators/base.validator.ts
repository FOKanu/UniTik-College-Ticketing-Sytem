// Thin wrapper turning a Zod schema into an Express middleware. Modules build their own
// module-specific validators on top of this in <module>/validators/.

import { NextFunction, Request, Response } from 'express';
import { ZodSchema } from 'zod';
import { BadRequestError } from '../errors';

export const validateBody =
  (schema: ZodSchema) => (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      throw new BadRequestError('Validation failed', result.error.flatten());
    }
    req.body = result.data;
    next();
  };
