import type { UserRole } from '@/types'

/**
 * Application permissions used by the frontend RBAC layer.
 * Backend JWT/RBAC middleware remains the source of truth when API mode is on.
 */
export const PERMISSIONS = [
  'tickets:read:own',
  'tickets:create',
  'tickets:comment:own',
  'tickets:read:assigned',
  'tickets:update:assigned',
  'tickets:read:all',
  'tickets:assign',
  'users:manage',
  'reports:view',
] as const

export type Permission = (typeof PERMISSIONS)[number]

const ROLE_PERMISSIONS: Record<UserRole, readonly Permission[]> = {
  student: ['tickets:read:own', 'tickets:create', 'tickets:comment:own'],
  agent: [
    'tickets:read:own',
    'tickets:create',
    'tickets:comment:own',
    'tickets:read:assigned',
    'tickets:update:assigned',
    'reports:view',
  ],
  admin: [
    'tickets:read:own',
    'tickets:create',
    'tickets:comment:own',
    'tickets:read:assigned',
    'tickets:update:assigned',
    'tickets:read:all',
    'tickets:assign',
    'users:manage',
    'reports:view',
  ],
}

export function getPermissionsForRole(role: UserRole): readonly Permission[] {
  return ROLE_PERMISSIONS[role]
}

export function hasPermission(
  role: UserRole | null | undefined,
  permission: Permission,
): boolean {
  if (!role) return false
  return ROLE_PERMISSIONS[role].includes(permission)
}

export function hasAnyPermission(
  role: UserRole | null | undefined,
  permissions: readonly Permission[],
): boolean {
  return permissions.some((permission) => hasPermission(role, permission))
}

export function hasAllPermissions(
  role: UserRole | null | undefined,
  permissions: readonly Permission[],
): boolean {
  return permissions.every((permission) => hasPermission(role, permission))
}

export function canAccessRole(
  role: UserRole | null | undefined,
  allowedRoles: readonly UserRole[],
): boolean {
  if (!role) return false
  return allowedRoles.includes(role)
}

/** Default landing path after login, by role */
export function homePathForRole(role: UserRole): string {
  switch (role) {
    case 'agent':
      return '/agent'
    case 'admin':
      return '/admin'
    default:
      return '/dashboard'
  }
}
