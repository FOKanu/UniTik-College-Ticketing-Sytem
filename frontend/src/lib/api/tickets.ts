import { mockTickets } from '@/mocks/data'
import { useAuthStore } from '@/stores/authStore'
import type { Ticket, TicketComment } from '@/types'
import {
  type Envelope,
  fromTicketPriority,
  fromTicketStatus,
  toDepartment,
  toTicketPriority,
  toTicketStatus,
  unwrap,
} from './adapters'
import { get, mockLatency, patch, post, usesLiveTickets } from './client'
import { ApiError } from './errors'
import type {
  AddCommentPayload,
  CreateTicketPayload,
  ListTicketsParams,
  Paginated,
  UpdateTicketPayload,
} from './types'

interface BackendTicket {
  id: string
  subject: string
  description: string
  status: string
  priority: string
  category: string | null
  department: string | null
  createdById: string
  assignedToId: string | null
  createdAt: string
  updatedAt: string
  createdByName?: string | null
  createdByEmail?: string | null
  assignedToName?: string | null
}

interface BackendComment {
  id: string
  ticketId: string
  authorId: string
  body: string
  isInternal: boolean
  createdAt: string
}

function currentUserId(): string | undefined {
  return useAuthStore.getState().user?.id
}

function toTicket(raw: BackendTicket, comments: TicketComment[] = []): Ticket {
  return {
    id: raw.id,
    subject: raw.subject,
    description: raw.description,
    category: toDepartment(raw.category ?? raw.department),
    status: toTicketStatus(raw.status),
    priority: toTicketPriority(raw.priority),
    createdBy: raw.createdById,
    assignedTo: raw.assignedToId ?? undefined,
    // Names are resolved server-side from the user relationships. Without
    // them every row would read "Unassigned" even when assignedToId is set.
    assignedName: raw.assignedToName ?? undefined,
    requesterName: raw.createdByName ?? undefined,
    requesterEmail: raw.createdByEmail ?? undefined,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
    comments,
  }
}

function toComment(raw: BackendComment): TicketComment {
  return {
    id: raw.id,
    ticketId: raw.ticketId,
    authorId: raw.authorId,
    // The comments endpoint returns ids only, so names are resolved from the
    // one identity the client is sure of.
    authorName: raw.authorId === currentUserId() ? 'You' : 'Support',
    body: raw.body,
    createdAt: raw.createdAt,
    internal: raw.isInternal,
  }
}

function paginate<T>(items: T[], page = 1, pageSize = 20): Paginated<T> {
  const safePage = Math.max(1, page)
  const start = (safePage - 1) * pageSize
  return {
    items: items.slice(start, start + pageSize),
    total: items.length,
    page: safePage,
    pageSize,
  }
}

/**
 * The backend list endpoint accepts no query parameters, so filtering happens
 * client-side for both data sources. `self`/`agent` identify the current user;
 * in mock mode they are the fixtures' fixed ids.
 */
function filterTickets(
  source: Ticket[],
  params: ListTicketsParams = {},
  identity: { self?: string; agent?: string } = {},
): Ticket[] {
  let list = [...source]

  if (params.mine) {
    list = list.filter((t) => t.createdBy === identity.self)
  }
  if (params.status && params.status !== 'all') {
    list = list.filter((t) => t.status === params.status)
  }
  if (params.department && params.department !== 'all') {
    list = list.filter((t) => t.category === params.department)
  }
  if (params.priority && params.priority !== 'all') {
    list = list.filter((t) => t.priority === params.priority)
  }
  if (params.assignee === 'me') {
    list = list.filter((t) => t.assignedTo === identity.agent)
  }
  if (params.assignee === 'unassigned') {
    list = list.filter((t) => !t.assignedTo)
  }
  if (params.query?.trim()) {
    const q = params.query.toLowerCase()
    list = list.filter(
      (t) =>
        t.subject.toLowerCase().includes(q) ||
        t.id.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q) ||
        (t.assignedName ?? '').toLowerCase().includes(q),
    )
  }

  return list.sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  )
}

export const ticketsApi = {
  async list(params: ListTicketsParams = {}): Promise<Paginated<Ticket>> {
    if (!usesLiveTickets()) {
      await mockLatency()
      return paginate(
        filterTickets(mockTickets, params, {
          self: 'user-1',
          agent: 'agent-1',
        }),
        params.page ?? 1,
        params.pageSize ?? 20,
      )
    }

    const raw = unwrap(await get<Envelope<BackendTicket[]>>('/tickets'))
    const self = currentUserId()
    const tickets = filterTickets(
      raw.map((t) => toTicket(t)),
      params,
      { self, agent: self },
    )
    return paginate(tickets, params.page ?? 1, params.pageSize ?? 20)
  },

  async listMine(params: Omit<ListTicketsParams, 'mine'> = {}) {
    return ticketsApi.list({ ...params, mine: true })
  },

  async getById(ticketId: string): Promise<Ticket> {
    if (!usesLiveTickets()) {
      await mockLatency()
      const ticket = mockTickets.find((t) => t.id === ticketId)
      if (!ticket) {
        throw new ApiError(`Ticket ${ticketId} was not found.`, {
          code: 'NOT_FOUND',
          status: 404,
        })
      }
      return structuredClone(ticket)
    }

    const [ticket, comments] = await Promise.all([
      get<Envelope<BackendTicket>>(`/tickets/${ticketId}`),
      get<Envelope<BackendComment[]>>(`/tickets/${ticketId}/comments`),
    ])
    return toTicket(unwrap(ticket), unwrap(comments).map(toComment))
  },

  async create(payload: CreateTicketPayload): Promise<Ticket> {
    if (!usesLiveTickets()) {
      await mockLatency(400)
      const ticket: Ticket = {
        id: `TCK-${Math.floor(1000 + Math.random() * 9000)}`,
        subject: payload.subject,
        description: payload.description,
        category: payload.category,
        status: 'open',
        priority: payload.urgent ? 'urgent' : payload.priority,
        createdBy: payload.requesterId ?? 'user-1',
        assignedTo: payload.assignedTo,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        comments: [],
      }
      mockTickets.unshift(ticket)
      return ticket
    }

    const created = unwrap(
      await post<Envelope<BackendTicket>>('/tickets', {
        subject: payload.subject,
        description: payload.description,
        category: payload.category,
        priority: fromTicketPriority(
          payload.urgent ? 'urgent' : payload.priority,
        ),
      }),
    )
    return toTicket(created)
  },

  async update(
    ticketId: string,
    payload: UpdateTicketPayload,
  ): Promise<Ticket> {
    if (!usesLiveTickets()) {
      await mockLatency()
      const ticket = mockTickets.find((t) => t.id === ticketId)
      if (!ticket) {
        throw new ApiError(`Ticket ${ticketId} was not found.`, {
          code: 'NOT_FOUND',
          status: 404,
        })
      }
      Object.assign(ticket, payload, { updatedAt: new Date().toISOString() })
      return structuredClone(ticket)
    }

    const body: Record<string, unknown> = {}
    if (payload.status) body.status = fromTicketStatus(payload.status)
    if (payload.priority) body.priority = fromTicketPriority(payload.priority)
    if (payload.category !== undefined) {
      // Keep category + department aligned so queue filters and staff routing
      // see the same bucket the UI picker chose.
      body.category = payload.category
      body.department = payload.category
    }
    if (payload.assignedTo !== undefined) body.assignedToId = payload.assignedTo

    const updated = unwrap(
      await patch<Envelope<BackendTicket>>(`/tickets/${ticketId}`, body),
    )
    return toTicket(updated)
  },

  async addComment(
    ticketId: string,
    payload: AddCommentPayload,
  ): Promise<TicketComment> {
    if (!usesLiveTickets()) {
      await mockLatency()
      const ticket = mockTickets.find((t) => t.id === ticketId)
      if (!ticket) {
        throw new ApiError(`Ticket ${ticketId} was not found.`, {
          code: 'NOT_FOUND',
          status: 404,
        })
      }
      const comment: TicketComment = {
        id: `cmt-${Date.now()}`,
        ticketId,
        authorId: payload.internal ? 'agent-1' : 'user-1',
        authorName: payload.internal ? 'J. Novak' : 'You',
        body: payload.body,
        createdAt: new Date().toISOString(),
        internal: payload.internal,
      }
      ticket.comments.push(comment)
      ticket.updatedAt = comment.createdAt
      return comment
    }

    const created = unwrap(
      await post<Envelope<BackendComment>>(`/tickets/${ticketId}/comments`, {
        body: payload.body,
        isInternal: payload.internal ?? false,
      }),
    )
    return toComment(created)
  },
}
