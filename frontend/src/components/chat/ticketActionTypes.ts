import type { Department, TicketPriority, TicketStatus } from '@/types'

export type TicketActionKind = 'create' | 'update' | 'comment'

export type TicketActionStatus =
  | 'pending'
  | 'editing'
  | 'executing'
  | 'completed'
  | 'failed'
  | 'cancelled'

export interface TicketCreateDraft {
  subject: string
  description: string
  category: Department
  priority: TicketPriority
}

export interface TicketUpdateDraft {
  ticketId: string
  ticketLabel: string
  status?: TicketStatus
  priority?: TicketPriority
  category?: Department
}

export interface TicketCommentDraft {
  ticketId: string
  ticketLabel: string
  body: string
}

export interface ProposedTicketAction {
  id: string
  kind: TicketActionKind
  status: TicketActionStatus
  create?: TicketCreateDraft
  update?: TicketUpdateDraft
  comment?: TicketCommentDraft
  error?: string
  resultTicketId?: string
  resultSubject?: string
}

/** Build a create draft from the visible transcript (skip the welcome message). */
export function buildCreateDraftFromMessages(
  messages: { id: string; role: string; body: string }[],
): TicketCreateDraft {
  const transcript = messages
    .filter((m) => m.id !== 'welcome' && m.body.trim())
    .map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.body.trim()}`)
    .join('\n\n')

  const lastUser =
    [...messages].reverse().find((m) => m.role === 'user' && m.body.trim())
      ?.body.trim() ?? 'Support request from chat'

  const subject =
    lastUser.length > 80 ? `${lastUser.slice(0, 77)}…` : lastUser

  return {
    subject,
    description: transcript || lastUser,
    category: 'IT',
    priority: 'medium',
  }
}
