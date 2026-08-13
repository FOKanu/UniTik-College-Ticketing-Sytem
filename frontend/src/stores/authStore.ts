import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  createMockJwt,
  decodeJwtPayload,
  isJwtExpired,
  userFromJwt,
} from '@/lib/auth'
import type { AuthSession, User, UserRole } from '@/types'

interface AuthState {
  user: User | null
  accessToken: string | null
  setSession: (session: AuthSession) => void
  /** Issues a mock JWT for local/dev login flows */
  signInMock: (user: User) => void
  updateProfile: (patch: Partial<Pick<User, 'displayName' | 'avatarColor'>>) => void
  clearSession: () => void
  /** Re-validate persisted JWT; clears session if invalid/expired */
  hydrateSession: () => boolean
  isAuthenticated: () => boolean
}

const UI_ROLES: UserRole[] = ['student', 'agent', 'admin']

function isUiRole(role: unknown): role is UserRole {
  return typeof role === 'string' && UI_ROLES.includes(role as UserRole)
}

function sessionFromToken(accessToken: string): AuthSession | null {
  const payload = decodeJwtPayload(accessToken)
  if (!payload || isJwtExpired(payload)) return null
  return { accessToken, user: userFromJwt(payload) }
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      setSession: (session) =>
        set({ user: session.user, accessToken: session.accessToken }),
      signInMock: (user) => {
        const accessToken = createMockJwt(user)
        set({ user, accessToken })
      },
      updateProfile: (patch) => {
        const current = get().user
        if (!current) return
        set({
          user: {
            ...current,
            ...patch,
            displayName: patch.displayName?.trim() || current.displayName,
          },
        })
      },
      clearSession: () => {
        set({ user: null, accessToken: null })
        void import('./resetClientState').then(({ resetClientState }) => {
          resetClientState()
        })
      },
      hydrateSession: () => {
        const token = get().accessToken
        if (!token) {
          set({ user: null, accessToken: null })
          return false
        }
        const session = sessionFromToken(token)
        if (!session) {
          set({ user: null, accessToken: null })
          return false
        }
        // Discard sessions poisoned by the pre-adapter API switch
        // (uppercase STUDENT/STAFF claims that fail RBAC and blank the UI).
        if (!isUiRole(session.user.role)) {
          set({ user: null, accessToken: null })
          return false
        }
        const previous = get().user
        const user =
          previous?.id === session.user.id && isUiRole(previous.role)
            ? {
                // The production JWT deliberately contains minimal identity
                // claims. Keep the profile populated by /auth/login, while
                // taking the token-normalised id and role as authoritative.
                ...previous,
                id: session.user.id,
                role: session.user.role,
              }
            : session.user
        set({ user, accessToken: session.accessToken })
        return true
      },
      isAuthenticated: () => {
        const token = get().accessToken
        if (!token || isJwtExpired(token)) return false
        return get().user !== null
      },
    }),
    {
      name: 'tss-auth',
      version: 2,
      partialize: (state) => ({
        accessToken: state.accessToken,
        user: state.user,
      }),
      migrate: (persisted) => {
        // v1 sessions may carry uppercase backend roles that infinite-loop
        // through /forbidden. Drop them and force a fresh login.
        void persisted
        return { user: null, accessToken: null }
      },
      onRehydrateStorage: () => (state) => {
        state?.hydrateSession()
      },
    },
  ),
)
