import { Role } from '../../../shared/constants/roles';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: Role;
}

export interface AuthTokenPayload {
  sub: string;
  role: Role;
  email: string;
}
