import { describe, expect, it } from 'vitest'
import {
  createMockJwt,
  decodeJwtPayload,
  isJwtExpired,
  userFromJwt,
} from '@/lib/auth/jwt'
import { canAccessRole, hasPermission, homePathForRole } from '@/lib/auth/rbac'
import type { User } from '@/types'

const student: User = {
  id: 'u1',
  email: 'student@campus.edu',
  displayName: 'Alex',
  role: 'student',
}

describe('jwt helpers', () => {
  it('creates a decodable mock JWT with role claims', () => {
    const token = createMockJwt(student)
    const payload = decodeJwtPayload(token)

    expect(payload).not.toBeNull()
    expect(payload?.sub).toBe('u1')
    expect(payload?.role).toBe('student')
    expect(userFromJwt(payload!).email).toBe(student.email)
  })

  it('detects expired tokens', () => {
    const token = createMockJwt(student, -10)
    expect(isJwtExpired(token)).toBe(true)
  })

  it('treats fresh tokens as valid', () => {
    const token = createMockJwt(student, 3600)
    expect(isJwtExpired(token)).toBe(false)
  })

  it('normalises the production backend role claims', () => {
    const productionPayload = {
      sub: 'u1',
      role: 'STUDENT',
      exp: Math.floor(Date.now() / 1000) + 3600,
      iat: Math.floor(Date.now() / 1000),
    }

    expect(userFromJwt(productionPayload).role).toBe('student')
    expect(userFromJwt({ ...productionPayload, role: 'STAFF' }).role).toBe(
      'agent',
    )
  })
})

describe('rbac helpers', () => {
  it('grants student ticket create but not assign', () => {
    expect(hasPermission('student', 'tickets:create')).toBe(true)
    expect(hasPermission('student', 'tickets:assign')).toBe(false)
  })

  it('allows agents into agent console roles', () => {
    expect(canAccessRole('agent', ['agent', 'admin'])).toBe(true)
    expect(canAccessRole('student', ['agent', 'admin'])).toBe(false)
  })

  it('maps roles to home paths', () => {
    expect(homePathForRole('student')).toBe('/dashboard')
    expect(homePathForRole('agent')).toBe('/agent')
    expect(homePathForRole('admin')).toBe('/admin')
  })
})
