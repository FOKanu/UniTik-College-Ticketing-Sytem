import axios, { type AxiosRequestConfig, type AxiosResponse } from 'axios'
import { ROUTES } from '@/app/routes'
import { isJwtExpired } from '@/lib/auth'
import { useAuthStore } from '@/stores/authStore'
import { ApiError, toApiError } from './errors'

const baseURL = import.meta.env.VITE_API_BASE_URL || '/api'

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

export function isMockDataSource(): boolean {
  return import.meta.env.VITE_DATA_SOURCE !== 'api'
}

/** Small delay so mock mode feels async like a real API */
export async function mockLatency(ms = 280): Promise<void> {
  if (!isMockDataSource()) return
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
