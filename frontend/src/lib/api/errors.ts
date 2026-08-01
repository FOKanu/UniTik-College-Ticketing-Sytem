import axios from 'axios'

export type ApiErrorCode =
  | 'NETWORK'
  | 'TIMEOUT'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'VALIDATION'
  | 'SERVER'
  | 'UNKNOWN'

export class ApiError extends Error {
  readonly code: ApiErrorCode
  readonly status?: number
  readonly details?: unknown
  readonly isApiError = true as const

  constructor(
    message: string,
    options: {
      code: ApiErrorCode
      status?: number
      details?: unknown
      cause?: unknown
    },
  ) {
    super(message, { cause: options.cause })
    this.name = 'ApiError'
    this.code = options.code
    this.status = options.status
    this.details = options.details
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError
}

function messageFromBody(data: unknown): string | undefined {
  if (!data || typeof data !== 'object') return undefined
  const record = data as Record<string, unknown>
  if (typeof record.message === 'string') return record.message
  if (typeof record.error === 'string') return record.error
  if (typeof record.detail === 'string') return record.detail
  return undefined
}

export function toApiError(error: unknown): ApiError {
  if (isApiError(error)) return error

  if (axios.isAxiosError(error)) {
    if (error.code === 'ECONNABORTED') {
      return new ApiError('Request timed out. Please try again.', {
        code: 'TIMEOUT',
        cause: error,
      })
    }

    if (!error.response) {
      return new ApiError('Unable to reach the server. Check your connection.', {
        code: 'NETWORK',
        cause: error,
      })
    }

    const status = error.response.status
    const details = error.response.data
    const message =
      messageFromBody(details) ??
      error.message ??
      'Something went wrong. Please try again.'

    if (status === 401) {
      return new ApiError(message || 'Your session has expired. Please sign in.', {
        code: 'UNAUTHORIZED',
        status,
        details,
        cause: error,
      })
    }
    if (status === 403) {
      return new ApiError(message || 'You do not have permission for this action.', {
        code: 'FORBIDDEN',
        status,
        details,
        cause: error,
      })
    }
    if (status === 404) {
      return new ApiError(message || 'The requested resource was not found.', {
        code: 'NOT_FOUND',
        status,
        details,
        cause: error,
      })
    }
    if (status === 422 || status === 400) {
      return new ApiError(message || 'Please check the form and try again.', {
        code: 'VALIDATION',
        status,
        details,
        cause: error,
      })
    }
    if (status >= 500) {
      return new ApiError(message || 'The server encountered an error.', {
        code: 'SERVER',
        status,
        details,
        cause: error,
      })
    }

    return new ApiError(message, {
      code: 'UNKNOWN',
      status,
      details,
      cause: error,
    })
  }

  if (error instanceof Error) {
    return new ApiError(error.message, { code: 'UNKNOWN', cause: error })
  }

  return new ApiError('An unexpected error occurred.', {
    code: 'UNKNOWN',
    cause: error,
  })
}
