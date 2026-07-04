// Isolated JWT issuance/verification. Middleware (app/middleware/auth.middleware.ts) should
// eventually call `verify` here instead of the current placeholder decode.
// TODO: replace the placeholder payload below with real signing once authentication.service.ts
// is wired to real credential checks.

import jwt, { SignOptions } from 'jsonwebtoken';
import { env } from '../../../config/env';
import { AuthTokenPayload } from '../types/authentication.types';

export class JwtService {
  sign(payload: AuthTokenPayload): string {
    const options: SignOptions = { expiresIn: env.JWT_EXPIRES_IN as SignOptions['expiresIn'] };
    return jwt.sign(payload, env.JWT_SECRET, options);
  }

  verify(token: string): AuthTokenPayload {
    return jwt.verify(token, env.JWT_SECRET) as AuthTokenPayload;
  }
}
