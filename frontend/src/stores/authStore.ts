import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  createMockJwt,
  decodeJwtPayload,
  isJwtExpired,
  userFromJwt,
} from '@/lib/auth'
import type { AuthSession, User } from '@/types'

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
        const previous = get().user
        const user =
          previous?.id === session.user.id
            ? {
                ...session.user,
                displayName: previous.displayName || session.user.displayName,
                avatarColor: previous.avatarColor ?? session.user.avatarColor,
                department: previous.department ?? session.user.department,
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
      partialize: (state) => ({
        accessToken: state.accessToken,
        user: state.user,
      }),
      onRehydrateStorage: () => (state) => {
        state?.hydrateSession()
      },
    },
  ),
)
