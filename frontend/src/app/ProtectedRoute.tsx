import { useEffect } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { ROUTES } from '@/app/routes'
import { canAccessRole, homePathForRole, isJwtExpired } from '@/lib/auth'
import { useAuthStore } from '@/stores/authStore'
import type { UserRole } from '@/types'

interface ProtectedRouteProps {
  allowedRoles?: readonly UserRole[]
  /** Where to send authenticated users who lack the required role */
  forbiddenTo?: string
}

function useValidSession() {
  const user = useAuthStore((s) => s.user)
  const accessToken = useAuthStore((s) => s.accessToken)
  const clearSession = useAuthStore((s) => s.clearSession)

  const valid = Boolean(user && accessToken && !isJwtExpired(accessToken))

  useEffect(() => {
    if (!valid && (user || accessToken)) {
      clearSession()
    }
  }, [valid, user, accessToken, clearSession])

  return { user: valid ? user : null, valid }
}

/**
 * Requires a valid (non-expired) JWT session and optional role membership.
 */
export function ProtectedRoute({
  allowedRoles,
  forbiddenTo = ROUTES.forbidden,
}: ProtectedRouteProps) {
  const { user, valid } = useValidSession()
  const location = useLocation()

  if (!valid || !user) {
    return <Navigate to={ROUTES.login} replace state={{ from: location }} />
  }

  if (allowedRoles && !canAccessRole(user.role, allowedRoles)) {
    return (
      <Navigate
        to={forbiddenTo}
        replace
        state={{ from: location, requiredRoles: [...allowedRoles] }}
      />
    )
  }

  return <Outlet />
}

/**
 * Public auth pages — redirect signed-in users to their role home.
 */
export function GuestRoute() {
  const { user, valid } = useValidSession()
  const location = useLocation()

  if (valid && user) {
    const from =
      (location.state as { from?: { pathname?: string } } | null)?.from
        ?.pathname ?? homePathForRole(user.role)
    return <Navigate to={from} replace />
  }

  return <Outlet />
}
