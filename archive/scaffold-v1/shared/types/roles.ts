// Canonical role enum shared conceptually between backend and frontend.
// Keep in sync with backend/src/app/shared/constants/roles.ts and the Prisma "role" field.

export type Role = 'STUDENT' | 'STAFF' | 'ADMIN';

export const ROLES: Role[] = ['STUDENT', 'STAFF', 'ADMIN'];
