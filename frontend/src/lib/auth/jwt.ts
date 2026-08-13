import type { User, UserRole } from '@/types'

/** Claims we expect from backend JWT (mirrored in mock tokens). */
export interface JwtPayload {
  sub: string
  // The production backend currently includes only `sub`, `role`, and `exp`.
  // Mock tokens contain the profile fields too.
  email?: string
  displayName?: string
  role: string
  /** Unix expiry seconds */
  exp: number
  iat: number
}

function toBase64Url(value: string): string {
  const bytes = new TextEncoder().encode(value)
  let binary = ''
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte)
  })
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '')
}

function fromBase64Url(value: string): string {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/')
  const pad = padded.length % 4 === 0 ? '' : '='.repeat(4 - (padded.length % 4))
  const binary = atob(padded + pad)
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

/**
 * Build a mock JWT for local development.
 * Signature is a stub — real verification happens on the backend.
 */
export function createMockJwt(
  user: User,
  expiresInSeconds = 60 * 60 * 8,
): string {
  const header = { alg: 'none', typ: 'JWT' }
  const now = Math.floor(Date.now() / 1000)
  const payload: JwtPayload = {
    sub: user.id,
    email: user.email,
    displayName: user.displayName,
    role: user.role,
    iat: now,
    exp: now + expiresInSeconds,
  }

  return [
    toBase64Url(JSON.stringify(header)),
    toBase64Url(JSON.stringify(payload)),
    'mock-signature',
  ].join('.')
}

export function decodeJwtPayload(token: string): JwtPayload | null {
  const parts = token.split('.')
  if (parts.length < 2 || !parts[1]) return null

  try {
    const json = fromBase64Url(parts[1])
    const payload = JSON.parse(json) as JwtPayload
    if (
      typeof payload.sub !== 'string' ||
      typeof payload.role !== 'string' ||
      typeof payload.exp !== 'number'
    ) {
      return null
    }
    return payload
  } catch {
    return null
  }
}

export function isJwtExpired(
  tokenOrPayload: string | JwtPayload,
  skewSeconds = 30,
): boolean {
  const payload =
    typeof tokenOrPayload === 'string'
      ? decodeJwtPayload(tokenOrPayload)
      : tokenOrPayload
  if (!payload) return true
  const now = Math.floor(Date.now() / 1000)
  return payload.exp <= now + skewSeconds
}

export function userFromJwt(payload: JwtPayload): User {
  const roleByClaim: Record<string, UserRole> = {
    STUDENT: 'student',
    student: 'student',
    STAFF: 'agent',
    AGENT: 'agent',
    agent: 'agent',
    ADMIN: 'admin',
    admin: 'admin',
  }

  return {
    id: payload.sub,
    email: payload.email ?? '',
    displayName: payload.displayName ?? '',
    role: roleByClaim[payload.role] ?? 'student',
  }
}
