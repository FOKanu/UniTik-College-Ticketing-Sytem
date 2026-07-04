// Augments Express's Request type with the fields the auth middleware attaches.
// TODO: replace `role`/`userId` placeholder shape once authentication module is implemented.

import { Role } from '../constants/roles';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: Role;
        email: string;
      };
    }
  }
}

export {};
