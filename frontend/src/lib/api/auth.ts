import { createMockJwt } from '@/lib/auth'
import {
  findMockAccount,
  findMockAccountSecret,
  registerMockAccount,
} from '@/mocks/data'
import { useAuthStore } from '@/stores/authStore'
import type { User, UserRole } from '@/types'
import { type Envelope, toDepartment, unwrap } from './adapters'
import { get, mockLatency, post, usesLiveAuth } from './client'
import { ApiError } from './errors'
import type { LoginPayload, LoginResponse } from './types'

interface BackendUser {
  id: string
  email: string
  displayName: string
  role: string
  department?: string | null
}

// The backend calls the support role STAFF; the UI calls it agent.
const ROLE_MAP: Record<string, UserRole> = {
  STUDENT: 'student',
  STAFF: 'agent',
  AGENT: 'agent',
  ADMIN: 'admin',
}

function toUser(raw: BackendUser): User {
  const role = ROLE_MAP[raw.role?.toUpperCase()] ?? 'student'
  // Map free-text staff departments ("IT Support — Tier 1") into UI buckets.
  // Students keep academic majors off the support-department field.
  const department =
    role === 'agent' || role === 'admin'
      ? toDepartment(raw.department)
      : undefined

  return {
    id: raw.id,
    email: raw.email,
    displayName: raw.displayName,
    role,
    ...(department ? { department } : {}),
  }
}

export const authApi = {
  async login(payload: LoginPayload): Promise<LoginResponse> {
    if (!usesLiveAuth()) {
      await mockLatency()
      const account = findMockAccount(payload.email)
      const secret = findMockAccountSecret(payload.email)
      if (!account || !payload.password) {
        throw new ApiError('Invalid email or password.', {
          code: 'UNAUTHORIZED',
          status: 401,
        })
      }
      // Seeded fixtures accept any non-empty password; registered accounts
      // must match the password chosen at sign-up.
      if (secret !== undefined && secret !== payload.password) {
        throw new ApiError('Invalid email or password.', {
          code: 'UNAUTHORIZED',
          status: 401,
        })
      }
      return {
        accessToken: createMockJwt(account),
        user: account,
      }
    }

    const data = unwrap(
      await post<Envelope<{ token: string; user: BackendUser }>>(
        '/auth/login',
        payload,
      ),
    )
    return { accessToken: data.token, user: toUser(data.user) }
  },

  async me() {
    if (!usesLiveAuth()) {
      await mockLatency(120)
      const user = useAuthStore.getState().user
      if (!user) {
        throw new ApiError('Not authenticated.', {
          code: 'UNAUTHORIZED',
          status: 401,
        })
      }
      return user
    }

    return toUser(unwrap(await get<Envelope<BackendUser>>('/auth/me')))
  },

  async logout(): Promise<void> {
    // JWTs are stateless server-side; signing out is purely a client concern.
    if (!usesLiveAuth()) await mockLatency(80)
  },

  async register(payload: {
    displayName: string
    email: string
    password: string
  }): Promise<LoginResponse> {
    if (!usesLiveAuth()) {
      await mockLatency()
      if (findMockAccount(payload.email)) {
        throw new ApiError('An account with this email already exists.', {
          code: 'VALIDATION',
          status: 400,
        })
      }
      const user = {
        id: `user-${Date.now()}`,
        email: payload.email,
        displayName: payload.displayName || 'New Student',
        role: 'student' as const,
      }
      registerMockAccount(user, payload.password)
      return {
        accessToken: createMockJwt(user),
        user,
      }
    }

    const data = unwrap(
      await post<Envelope<{ token: string; user: BackendUser }>>(
        '/auth/register',
        payload,
      ),
    )
    return { accessToken: data.token, user: toUser(data.user) }
  },
}

/** Clears local session; optional server logout when API mode is on */
export async function signOut(): Promise<void> {
  try {
    await authApi.logout()
  } finally {
    useAuthStore.getState().clearSession()
  }
}

export async function revokeSessionRemote(): Promise<void> {
  // No server-side session to revoke yet — kept so callers stay unchanged.
  return Promise.resolve()
}
