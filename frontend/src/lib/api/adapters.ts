/**
 * Bridges the FastAPI backend's shapes to the UI's types.
 *
 * The frontend was built mock-first, so its vocabulary drifted from the
 * backend's: envelopes, SCREAMING_CASE enums, `createdById` vs `createdBy`,
 * and free-text categories against a four-value union. Everything needed to
 * reconcile the two lives here rather than being duplicated per module.
 */

import type { Department, TicketPriority, TicketStatus } from '@/types'
import { ApiError } from './errors'

export interface Envelope<T> {
  success: boolean
  data: T
  error?: { message: string }
}

export function unwrap<T>(body: Envelope<T>): T {
  if (!body?.success) {
    throw new ApiError(body?.error?.message ?? 'Request failed', { code: 'SERVER' })
  }
  return body.data
}

const STATUS_MAP: Record<string, TicketStatus> = {
  OPEN: 'open',
  IN_PROGRESS: 'in_progress',
  WAITING_ON_STUDENT: 'waiting_on_student',
  RESOLVED: 'resolved',
  CLOSED: 'closed',
}

const PRIORITY_MAP: Record<string, TicketPriority> = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent',
}

export function toTicketStatus(raw: string | null | undefined): TicketStatus {
  return STATUS_MAP[String(raw).toUpperCase()] ?? 'open'
}

export function toTicketPriority(raw: string | null | undefined): TicketPriority {
  return PRIORITY_MAP[String(raw).toUpperCase()] ?? 'medium'
}

/** The backend has no URGENT level; it is the UI's label for a high-priority flag. */
export function fromTicketPriority(priority: TicketPriority): string {
  return priority === 'urgent' ? 'HIGH' : priority.toUpperCase()
}

export function fromTicketStatus(status: TicketStatus): string {
  return status.toUpperCase()
}

// Backend categories are free text ("Network", "Academic Records", or the
// lowercase labels our AI triage writes). The UI buckets everything into four
// departments, so match on keywords and fall back to IT.
const CATEGORY_KEYWORDS: Array<[Department, string[]]> = [
  ['Academics', ['academic', 'exam', 'grade', 'course', 'enrol', 'registration', 'library']],
  ['Finance', ['financ', 'fee', 'billing', 'refund', 'payment', 'scholarship', 'invoice']],
  ['Maintenance', ['maintenance', 'facilit', 'repair', 'building', 'room', 'cleaning', 'heating']],
  ['IT', ['network', 'access', 'wifi', 'email', 'password', 'hardware', 'software', 'portal', 'support', 'tier']],
]

export function toDepartment(raw: string | null | undefined): Department {
  const value = (raw ?? '').trim().toLowerCase()
  // Matching is by substring, so the two-letter "it" is compared exactly —
  // otherwise it would swallow "facility", "maintenance", and friends.
  if (!value || value === 'it') return 'IT'

  for (const [department, keywords] of CATEGORY_KEYWORDS) {
    if (keywords.some((keyword) => value.includes(keyword))) return department
  }
  return 'IT'
}
