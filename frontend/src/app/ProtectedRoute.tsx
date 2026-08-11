import { useEffect, useState } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { ROUTES } from '@/app/routes'
import { authApi, usesLiveAuth } from '@/lib/api'
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
  const setSession = useAuthStore((s) => s.setSession)
  const [probedToken, setProbedToken] = useState<string | null>(null)

  const valid = Boolean(user && accessToken && !isJwtExpired(accessToken))
  const needsRemoteProbe = usesLiveAuth() && valid && Boolean(accessToken)
  const remoteChecked = !needsRemoteProbe || probedToken === accessToken

  useEffect(() => {
    if (!valid && (user || accessToken)) {
      clearSession()
    }
  }, [valid, user, accessToken, clearSession])

  // Live mode: probe /auth/me so a tampered/revoked token is cleared even if
  // the first screen would otherwise render from localStorage alone.
  useEffect(() => {
    if (!needsRemoteProbe || !accessToken) return
    if (probedToken === accessToken) return

    let cancelled = false
    void authApi
      .me()
      .then((profile) => {
        if (cancelled) return
        const previous = useAuthStore.getState().user
        setSession({
          accessToken,
          user:
            previous?.id === profile.id
              ? { ...previous, ...profile }
              : profile,
        })
      })
      .catch(() => {
        // Axios interceptor clears + redirects on 401.
      })
      .finally(() => {
        if (!cancelled) setProbedToken(accessToken)
      })

    return () => {
      cancelled = true
    }
  }, [needsRemoteProbe, accessToken, probedToken, setSession])

  return {
    user: valid ? user : null,
    valid,
    remoteChecked,
  }
}

/**
 * Requires a valid (non-expired) JWT session and optional role membership.
 */
export function ProtectedRoute({
  allowedRoles,
  forbiddenTo = ROUTES.forbidden,
}: ProtectedRouteProps) {
  const { user, valid, remoteChecked } = useValidSession()
  const location = useLocation()

  if (!valid || !user) {
    return <Navigate to={ROUTES.login} replace state={{ from: location }} />
  }

  if (!remoteChecked) {
    return null
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
