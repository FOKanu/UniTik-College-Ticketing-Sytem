import { describe, expect, it } from 'vitest'
import {
  fromTicketPriority,
  fromTicketStatus,
  toDepartment,
  toTicketPriority,
  toTicketStatus,
  unwrap,
} from './adapters'
import { ApiError } from './errors'

describe('unwrap', () => {
  it('returns the payload from a successful envelope', () => {
    expect(unwrap({ success: true, data: [1, 2] })).toEqual([1, 2])
  })

  it('raises the backend message when the envelope reports failure', () => {
    expect(() =>
      unwrap({ success: false, data: null, error: { message: 'Ticket not found' } }),
    ).toThrow(ApiError)
  })
})

describe('ticket enum mapping', () => {
  it('lowercases backend statuses the UI knows', () => {
    expect(toTicketStatus('OPEN')).toBe('open')
    expect(toTicketStatus('IN_PROGRESS')).toBe('in_progress')
    expect(toTicketStatus('RESOLVED')).toBe('resolved')
    expect(toTicketStatus('CLOSED')).toBe('closed')
  })

  it('falls back rather than emitting a status no component handles', () => {
    expect(toTicketStatus('SOMETHING_NEW')).toBe('open')
    expect(toTicketStatus(null)).toBe('open')
    expect(toTicketPriority(undefined)).toBe('medium')
  })

  it('collapses urgent onto HIGH, which is all the backend stores', () => {
    expect(fromTicketPriority('urgent')).toBe('HIGH')
    expect(fromTicketPriority('low')).toBe('LOW')
    expect(fromTicketStatus('in_progress')).toBe('IN_PROGRESS')
  })
})

describe('toDepartment', () => {
  it('maps the free-text categories the seed and AI triage produce', () => {
    expect(toDepartment('Network')).toBe('IT')
    expect(toDepartment('Access')).toBe('IT')
    expect(toDepartment('Academic Records')).toBe('Academics')
    expect(toDepartment('fees')).toBe('Finance')
  })

  it('does not let the two-letter IT match swallow longer words', () => {
    expect(toDepartment('Facilities')).toBe('Maintenance')
    expect(toDepartment('maintenance')).toBe('Maintenance')
  })

  it('defaults to IT for blank or unrecognised input', () => {
    expect(toDepartment(null)).toBe('IT')
    expect(toDepartment('  ')).toBe('IT')
    expect(toDepartment('Something else')).toBe('IT')
  })
})
