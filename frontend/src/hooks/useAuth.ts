import { useAuthStore } from '@/stores/authStore'
import {
  getPermissionsForRole,
  hasAllPermissions,
  hasAnyPermission,
  hasPermission,
  type Permission,
} from '@/lib/auth'
import type { UserRole } from '@/types'

export function useAuth() {
  const user = useAuthStore((s) => s.user)
  const accessToken = useAuthStore((s) => s.accessToken)
  const clearSession = useAuthStore((s) => s.clearSession)
  const signInMock = useAuthStore((s) => s.signInMock)
  const setSession = useAuthStore((s) => s.setSession)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  return {
    user,
    accessToken,
    role: user?.role ?? null,
    isAuthenticated: isAuthenticated(),
    clearSession,
    signInMock,
    setSession,
  }
}

export function usePermission(permission: Permission): boolean {
  const role = useAuthStore((s) => s.user?.role)
  return hasPermission(role, permission)
}

export function usePermissions() {
  const role = useAuthStore((s) => s.user?.role)
  return {
    role: role ?? null,
    permissions: role ? getPermissionsForRole(role) : [],
    can: (permission: Permission) => hasPermission(role, permission),
    canAny: (permissions: readonly Permission[]) =>
      hasAnyPermission(role, permissions),
    canAll: (permissions: readonly Permission[]) =>
      hasAllPermissions(role, permissions),
    hasRole: (...roles: UserRole[]) =>
      role !== undefined && role !== null && roles.includes(role),
  }
}
