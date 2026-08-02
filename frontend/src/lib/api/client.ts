import axios, { type AxiosRequestConfig, type AxiosResponse } from 'axios'
import { ROUTES } from '@/app/routes'
import { isJwtExpired } from '@/lib/auth'
import { useAuthStore } from '@/stores/authStore'
import { ApiError, toApiError } from './errors'

const baseURL = import.meta.env.VITE_API_BASE_URL || '/api'

/** Exposed for callers that bypass axios, e.g. SSE streaming over fetch. */
export const apiBaseUrl = baseURL

export const apiClient = axios.create({
  baseURL,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
  timeout: 15000,
})

let handlingUnauthorized = false

function redirectToLogin() {
  if (typeof window === 'undefined') return
  const path = window.location.pathname
  if (path === ROUTES.login || path === ROUTES.register) return
  const search = new URLSearchParams({
    from: `${path}${window.location.search}`,
  })
  window.location.assign(`${ROUTES.login}?${search.toString()}`)
}

apiClient.interceptors.request.use((config) => {
  const { accessToken, clearSession } = useAuthStore.getState()

  if (accessToken) {
    if (isJwtExpired(accessToken)) {
      clearSession()
      return Promise.reject(
        new ApiError('Your session has expired. Please sign in.', {
          code: 'UNAUTHORIZED',
          status: 401,
        }),
      )
    }
    config.headers.Authorization = `Bearer ${accessToken}`
  }

  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const apiError = toApiError(error)

    if (apiError.code === 'UNAUTHORIZED' && !handlingUnauthorized) {
      handlingUnauthorized = true
      useAuthStore.getState().clearSession()
      redirectToLogin()
      queueMicrotask(() => {
        handlingUnauthorized = false
      })
    }

    return Promise.reject(apiError)
  },
)

/**
 * Data-source modes:
 * - `mock`   — full fixture UI (no FastAPI). Safe default for design work.
 * - `hybrid` — live auth + chat + tickets (LLM path); mock notifications /
 *              knowledge fixtures for slices the backend does not own yet.
 * - `api`    — everything talks to FastAPI; unfinished slices degrade empty.
 */
export type DataSourceMode = 'mock' | 'hybrid' | 'api'

export function getDataSourceMode(): DataSourceMode {
  const raw = String(import.meta.env.VITE_DATA_SOURCE ?? 'mock').toLowerCase()
  if (raw === 'api' || raw === 'hybrid') return raw
  return 'mock'
}

/** True only in pure fixture mode — every module uses local mocks. */
export function isMockDataSource(): boolean {
  return getDataSourceMode() === 'mock'
}

export function usesLiveAuth(): boolean {
  return getDataSourceMode() !== 'mock'
}

export function usesLiveChat(): boolean {
  return getDataSourceMode() !== 'mock'
}

export function usesLiveTickets(): boolean {
  // Tickets have a backend slice; keep them live whenever auth is live so
  // chat→ticket escalation shows up under My Tickets.
  return getDataSourceMode() !== 'mock'
}

/** Notifications have no backend slice — prefer fixtures outside pure api. */
export function usesMockNotifications(): boolean {
  return getDataSourceMode() !== 'api'
}

/** Knowledge/FAQ keeps rich fixtures outside pure api mode. */
export function usesMockKnowledge(): boolean {
  return getDataSourceMode() !== 'api'
}

/** Small delay so fixture-backed calls feel async like a real API. */
export async function mockLatency(ms = 280): Promise<void> {
  if (getDataSourceMode() === 'api') return
  await new Promise((resolve) => setTimeout(resolve, ms))
}

export async function apiRequest<T>(
  config: AxiosRequestConfig,
): Promise<T> {
  try {
    const response: AxiosResponse<T> = await apiClient.request<T>(config)
    return response.data
  } catch (error) {
    throw toApiError(error)
  }
}

export function get<T>(url: string, config?: AxiosRequestConfig) {
  return apiRequest<T>({ ...config, method: 'GET', url })
}

export function post<T>(url: string, data?: unknown, config?: AxiosRequestConfig) {
  return apiRequest<T>({ ...config, method: 'POST', url, data })
}

export function patch<T>(url: string, data?: unknown, config?: AxiosRequestConfig) {
  return apiRequest<T>({ ...config, method: 'PATCH', url, data })
}

export function put<T>(url: string, data?: unknown, config?: AxiosRequestConfig) {
  return apiRequest<T>({ ...config, method: 'PUT', url, data })
}

export function del<T>(url: string, config?: AxiosRequestConfig) {
  return apiRequest<T>({ ...config, method: 'DELETE', url })
}
