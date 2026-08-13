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

/** Phrases that mean the user wants a support ticket filed from chat. */
const CREATE_INTENT =
  /\b((create|open|file|submit|raise|make|start|log)\b[\s\S]{0,48}\b(a\s+)?(ticket|support request|case)\b|\b(need|want|like)\b[\s\S]{0,24}\b(a\s+)?(ticket|support)\b|\bescalate(\s+this|\s+to\s+(a\s+)?ticket)?\b|\btalk to (a |an )?(human|agent|person|staff)\b)/i

export function isTicketCreateIntent(text: string): boolean {
  return CREATE_INTENT.test(text.trim())
}

function inferCategory(text: string): Department {
  const t = text.toLowerCase()
  if (
    /grade|exam|course|registrar|appeal|enrol|transcript|module|lecture/.test(t)
  ) {
    return 'Academics'
  }
  if (/pay|tuition|invoice|refund|fee|finance|billing|receipt/.test(t)) {
    return 'Finance'
  }
  if (
    /heat|plumb|room|maintenance|facility|door|hvac|cleaning|housing|locker/.test(
      t,
    )
  ) {
    return 'Maintenance'
  }
  return 'IT'
}

function inferPriority(text: string): TicketPriority {
  const t = text.toLowerCase()
  if (/\b(urgent|asap|emergency|critical|blocked)\b/.test(t)) return 'urgent'
  if (/\b(high priority|severe|outage)\b/.test(t)) return 'high'
  if (/\b(low priority|whenever|no rush)\b/.test(t)) return 'low'
  return 'medium'
}

function subjectFromMessages(
  messages: { id: string; role: string; body: string }[],
): string {
  const userBodies = messages
    .filter((m) => m.role === 'user' && m.body.trim() && m.id !== 'welcome')
    .map((m) => m.body.trim())

  // Prefer the last substantive user turn, not a short "create a ticket" ask.
  const substantive = [...userBodies]
    .reverse()
    .find((body) => !(isTicketCreateIntent(body) && body.length < 100))

  const raw =
    substantive ??
    userBodies[userBodies.length - 1] ??
    'Support request from chat'
  return raw.length > 80 ? `${raw.slice(0, 77)}…` : raw
}

/** Build a create draft from the visible transcript (skip the welcome message). */
export function buildCreateDraftFromMessages(
  messages: { id: string; role: string; body: string }[],
): TicketCreateDraft {
  const transcript = messages
    .filter((m) => m.id !== 'welcome' && m.body.trim())
    .map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.body.trim()}`)
    .join('\n\n')

  const blob = transcript || subjectFromMessages(messages)

  return {
    subject: subjectFromMessages(messages),
    description: transcript || blob,
    category: inferCategory(blob),
    priority: inferPriority(blob),
  }
}

/** Append a pending create-ticket card if none is already open. */
export function withCreateProposalMessage<
  T extends {
    id: string
    role: string
    body: string
    action?: ProposedTicketAction
  },
>(
  messages: T[],
  options: { alreadyHasTicket?: boolean; intro?: string } = {},
): Array<T & { action?: ProposedTicketAction }> {
  if (options.alreadyHasTicket) return messages
  const hasOpen = messages.some(
    (m) =>
      m.action &&
      (m.action.status === 'pending' ||
        m.action.status === 'editing' ||
        m.action.status === 'executing'),
  )
  if (hasOpen) return messages

  const action: ProposedTicketAction = {
    id: `act-create-${Date.now()}`,
    kind: 'create',
    status: 'pending',
    create: buildCreateDraftFromMessages(messages),
  }

  const intro =
    options.intro ??
    'I opened a ticket proposal from this conversation. Review the details below, edit if needed, then confirm to file it.'

  return [
    ...messages,
    {
      id: `a-action-${Date.now()}`,
      role: 'assistant',
      body: intro,
      action,
    } as T & { action?: ProposedTicketAction },
  ]
}
