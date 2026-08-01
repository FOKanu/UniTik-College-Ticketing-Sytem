import { describe, expect, it } from 'vitest'
import {
  agentTicketCreateSchema,
  departmentSchema,
  loginSchema,
  registerSchema,
  ticketCreateSchema,
} from './schemas'

describe('loginSchema', () => {
  it('accepts valid credentials', () => {
    const result = loginSchema.safeParse({
      email: 'amara.k@stud.university.edu',
      password: 'password',
    })
    expect(result.success).toBe(true)
  })

  it('rejects non-university email', () => {
    const result = loginSchema.safeParse({
      email: 'user@gmail.com',
      password: 'password',
    })
    expect(result.success).toBe(false)
  })
})

describe('registerSchema', () => {
  it('rejects mismatched passwords', () => {
    const result = registerSchema.safeParse({
      displayName: 'Amara Kanu',
      email: 'amara.k@stud.university.edu',
      password: 'password123',
      confirmPassword: 'different',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0]?.path).toEqual(['confirmPassword'])
    }
  })
})

describe('ticketCreateSchema', () => {
  it('requires a meaningful description', () => {
    const result = ticketCreateSchema.safeParse({
      category: 'IT',
      subject: 'VPN issue',
      description: 'too short',
      priority: 'medium',
    })
    expect(result.success).toBe(false)
  })
})

describe('agentTicketCreateSchema', () => {
  it('accepts urgent priority', () => {
    const result = agentTicketCreateSchema.safeParse({
      requesterType: 'student',
      requester: 'Amara K.',
      category: 'Maintenance',
      subject: 'Broken projector',
      description: 'The projector in room 204 stopped working during class.',
      priority: 'urgent',
      assignTo: 'me',
    })
    expect(result.success).toBe(true)
  })
})

describe('departmentSchema', () => {
  it('accepts optional routing', () => {
    const result = departmentSchema.parse({ name: 'Library' })
    expect(result.routing).toBeUndefined()
  })
})
