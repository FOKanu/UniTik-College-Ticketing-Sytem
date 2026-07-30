import { mockTickets } from '@/mocks/data'
import type { Ticket, TicketComment } from '@/types'
import { get, isMockDataSource, mockLatency, patch, post } from './client'
import { ApiError } from './errors'
import type {
  AddCommentPayload,
  CreateTicketPayload,
  ListTicketsParams,
  Paginated,
  UpdateTicketPayload,
} from './types'

function paginate<T>(
  items: T[],
  page = 1,
  pageSize = 20,
): Paginated<T> {
  const safePage = Math.max(1, page)
  const start = (safePage - 1) * pageSize
  return {
    items: items.slice(start, start + pageSize),
    total: items.length,
    page: safePage,
    pageSize,
  }
}

function filterTickets(params: ListTicketsParams = {}): Ticket[] {
  let list = [...mockTickets]

  if (params.mine) {
    list = list.filter((t) => t.createdBy === 'user-1')
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
    list = list.filter((t) => t.assignedTo === 'agent-1')
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
    (a, b) =>
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  )
}

export const ticketsApi = {
  async list(params: ListTicketsParams = {}): Promise<Paginated<Ticket>> {
    if (isMockDataSource()) {
      await mockLatency()
      return paginate(
        filterTickets(params),
        params.page ?? 1,
        params.pageSize ?? 20,
      )
    }

    return get<Paginated<Ticket>>('/tickets', { params })
  },

  async listMine(params: Omit<ListTicketsParams, 'mine'> = {}) {
    return ticketsApi.list({ ...params, mine: true })
  },

  async getById(ticketId: string): Promise<Ticket> {
    if (isMockDataSource()) {
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

    return get<Ticket>(`/tickets/${ticketId}`)
  },

  async create(payload: CreateTicketPayload): Promise<Ticket> {
    if (isMockDataSource()) {
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

    return post<Ticket>('/tickets', payload)
  },

  async update(
    ticketId: string,
    payload: UpdateTicketPayload,
  ): Promise<Ticket> {
    if (isMockDataSource()) {
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

    return patch<Ticket>(`/tickets/${ticketId}`, payload)
  },

  async addComment(
    ticketId: string,
    payload: AddCommentPayload,
  ): Promise<TicketComment> {
    if (isMockDataSource()) {
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

    return post<TicketComment>(`/tickets/${ticketId}/comments`, payload)
  },
}
