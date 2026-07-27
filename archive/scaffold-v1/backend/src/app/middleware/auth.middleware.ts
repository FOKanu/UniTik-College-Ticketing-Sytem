// Role-guard scaffolding. Real JWT verification lives in modules/authentication/jwt.
// TODO: replace the placeholder decode below with a call into
// modules/authentication/jwt/jwt.service.ts once implemented.

import { NextFunction, Request, Response } from 'express';
import { Role } from '../shared/constants/roles';
import { UnauthorizedError, ForbiddenError } from '../shared/errors';

export const requireAuth = (req: Request, _res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    throw new UnauthorizedError('Missing or malformed Authorization header');
  }

  // TODO: verify JWT via modules/authentication/jwt/jwt.service.ts and populate req.user for real.
  req.user = { id: 'TODO-user-id', role: Role.STUDENT, email: 'todo@example.com' };
  next();
};

export const requireRole =
  (...roles: Role[]) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new UnauthorizedError();
    }
    if (!roles.includes(req.user.role)) {
      throw new ForbiddenError(`Requires one of roles: ${roles.join(', ')}`);
    }
    next();
  };
