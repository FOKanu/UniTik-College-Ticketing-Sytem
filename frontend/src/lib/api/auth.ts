import { createMockJwt } from '@/lib/auth'
import { findMockAccount } from '@/mocks/data'
import { useAuthStore } from '@/stores/authStore'
import { del, get, isMockDataSource, mockLatency, post } from './client'
import { ApiError } from './errors'
import type { LoginPayload, LoginResponse } from './types'

export const authApi = {
  async login(payload: LoginPayload): Promise<LoginResponse> {
    if (isMockDataSource()) {
      await mockLatency()
      const account = findMockAccount(payload.email)
      if (!account || !payload.password) {
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

    return post<LoginResponse>('/auth/login', payload)
  },

  async me() {
    if (isMockDataSource()) {
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

    return get<LoginResponse['user']>('/auth/me')
  },

  async logout(): Promise<void> {
    if (isMockDataSource()) {
      await mockLatency(80)
      return
    }
    await post('/auth/logout')
  },

  async register(payload: {
    displayName: string
    email: string
    password: string
  }): Promise<LoginResponse> {
    if (isMockDataSource()) {
      await mockLatency()
      const user = {
        id: `user-${Date.now()}`,
        email: payload.email,
        displayName: payload.displayName || 'New Student',
        role: 'student' as const,
      }
      return {
        accessToken: createMockJwt(user),
        user,
      }
    }

    return post<LoginResponse>('/auth/register', payload)
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
  if (isMockDataSource()) return
  await del('/auth/sessions/current')
}
