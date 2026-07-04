// Keep in sync with shared/types/roles.ts at the repo root and prisma schema's Role enum.

export enum Role {
  STUDENT = 'STUDENT',
  STAFF = 'STAFF',
  ADMIN = 'ADMIN',
}

export const ALL_ROLES = [Role.STUDENT, Role.STAFF, Role.ADMIN];
