import { describe, expect, it } from 'vitest'
import { notificationTicketPath } from './notificationLink'

describe('notificationTicketPath', () => {
  it('routes students to student ticket detail', () => {
    expect(notificationTicketPath('student', 'TCK-1042')).toBe(
      '/tickets/TCK-1042',
    )
  })

  it('routes agents to agent ticket detail', () => {
    expect(notificationTicketPath('agent', 'TCK-1042')).toBe(
      '/agent/tickets/TCK-1042',
    )
  })
})
