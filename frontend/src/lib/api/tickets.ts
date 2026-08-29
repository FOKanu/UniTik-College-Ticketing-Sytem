import { findStaffMember, mockTickets } from '@/mocks/data'
import { useAuthStore } from '@/stores/authStore'
import type { Ticket, TicketAttachment, TicketComment } from '@/types'
import {
  type Envelope,
  fromTicketPriority,
  fromTicketStatus,
  toDepartment,
  toTicketPriority,
  toTicketStatus,
  unwrap,
} from './adapters'
import {
  apiClient,
  del,
  get,
  mockLatency,
  patch,
  post,
  postForm,
  usesLiveTickets,
} from './client'
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
  slaDueAt?: string | null
  slaBreachedAt?: string | null
  slaHoursRemaining?: number | null
  slaBreached?: boolean
}

interface BackendComment {
  id: string
  ticketId: string
  authorId: string
  body: string
  isInternal: boolean
  createdAt: string
}

interface BackendAttachment {
  id: string
  ticketId: string
  name: string
  fileType: string
  fileSizeBytes: number
  uploadedAt: string
}

function currentUserId(): string | undefined {
  return useAuthStore.getState().user?.id
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function toAttachment(raw: BackendAttachment): TicketAttachment {
  return {
    id: raw.id,
    name: raw.name,
    sizeLabel: formatFileSize(raw.fileSizeBytes),
  }
}

function toTicket(
  raw: BackendTicket,
  comments: TicketComment[] = [],
  attachments: TicketAttachment[] = [],
): Ticket {
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
    slaDueAt: raw.slaDueAt ?? null,
    slaBreachedAt: raw.slaBreachedAt ?? null,
    slaHoursRemaining: raw.slaHoursRemaining ?? undefined,
    slaBreached: raw.slaBreached ?? false,
    comments,
    attachments: attachments.length > 0 ? attachments : undefined,
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
 * `departmentScope` limits staff to their support bucket (admins omit it).
 */
function filterTickets(
  source: Ticket[],
  params: ListTicketsParams = {},
  identity: {
    self?: string
    agent?: string
    departmentScope?: string
  } = {},
): Ticket[] {
  let list = [...source]

  if (params.mine) {
    list = list.filter((t) => t.createdBy === identity.self)
  }
  if (identity.departmentScope) {
    list = list.filter((t) => t.category === identity.departmentScope)
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

function listIdentity(): {
  self?: string
  agent?: string
  departmentScope?: string
} {
  const user = useAuthStore.getState().user
  if (!user) {
    // Unit tests and pre-login tooling hit mock list without a session.
    if (!usesLiveTickets()) {
      return { self: 'user-1', agent: 'agent-1' }
    }
    return {}
  }
  const departmentScope =
    user.role === 'agent' && user.department ? user.department : undefined
  return {
    self: user.id,
    agent: user.id,
    departmentScope,
  }
}

function assertTicketVisible(ticket: Ticket): void {
  const user = useAuthStore.getState().user
  if (!user) {
    // Mock fixtures remain readable in tests without a hydrated session.
    if (!usesLiveTickets()) return
    throw new ApiError('Not authenticated.', {
      code: 'UNAUTHORIZED',
      status: 401,
    })
  }
  if (user.role === 'student' && ticket.createdBy !== user.id) {
    throw new ApiError('You can only view your own tickets.', {
      code: 'FORBIDDEN',
      status: 403,
    })
  }
  if (
    user.role === 'agent' &&
    user.department &&
    ticket.category !== user.department
  ) {
    throw new ApiError('This ticket belongs to another department.', {
      code: 'FORBIDDEN',
      status: 403,
    })
  }
}

export const ticketsApi = {
  async list(params: ListTicketsParams = {}): Promise<Paginated<Ticket>> {
    if (!usesLiveTickets()) {
      await mockLatency()
      return paginate(
        filterTickets(mockTickets, params, listIdentity()),
        params.page ?? 1,
        params.pageSize ?? 20,
      )
    }

    const raw = unwrap(await get<Envelope<BackendTicket[]>>('/tickets'))
    const tickets = filterTickets(
      raw.map((t) => toTicket(t)),
      params,
      listIdentity(),
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
      assertTicketVisible(ticket)
      return structuredClone(ticket)
    }

    const [ticket, comments, attachments] = await Promise.all([
      get<Envelope<BackendTicket>>(`/tickets/${ticketId}`),
      get<Envelope<BackendComment[]>>(`/tickets/${ticketId}/comments`),
      get<Envelope<BackendAttachment[]>>(`/tickets/${ticketId}/attachments`),
    ])
    const mapped = toTicket(
      unwrap(ticket),
      unwrap(comments).map(toComment),
      unwrap(attachments).map(toAttachment),
    )
    assertTicketVisible(mapped)
    return mapped
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
        createdBy: payload.requesterId ?? currentUserId() ?? 'user-1',
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

      const next: UpdateTicketPayload = { ...payload }
      if (payload.assignedTo !== undefined) {
        if (payload.assignedTo === null) {
          next.assignedTo = null
          next.assignedName = null
        } else {
          const staff = findStaffMember(payload.assignedTo)
          next.assignedTo = payload.assignedTo
          next.assignedName =
            payload.assignedName ?? staff?.name ?? payload.assignedTo
        }
      }

      Object.assign(ticket, next, { updatedAt: new Date().toISOString() })

      if (next.assignedTo === null) {
        delete ticket.assignedTo
        delete ticket.assignedName
      }

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

  async listAttachments(ticketId: string): Promise<TicketAttachment[]> {
    if (!usesLiveTickets()) {
      await mockLatency()
      const ticket = mockTickets.find((t) => t.id === ticketId)
      return structuredClone(ticket?.attachments ?? [])
    }

    const raw = unwrap(
      await get<Envelope<BackendAttachment[]>>(
        `/tickets/${ticketId}/attachments`,
      ),
    )
    return raw.map(toAttachment)
  },

  async uploadAttachment(
    ticketId: string,
    file: File,
  ): Promise<TicketAttachment> {
    if (!usesLiveTickets()) {
      await mockLatency(400)
      const ticket = mockTickets.find((t) => t.id === ticketId)
      if (!ticket) {
        throw new ApiError(`Ticket ${ticketId} was not found.`, {
          code: 'NOT_FOUND',
          status: 404,
        })
      }
      const attachment: TicketAttachment = {
        id: `a-${Date.now()}`,
        name: file.name,
        sizeLabel: formatFileSize(file.size),
      }
      ticket.attachments = [...(ticket.attachments ?? []), attachment]
      return attachment
    }

    const form = new FormData()
    form.append('file', file)
    const created = unwrap(
      await postForm<Envelope<BackendAttachment>>(
        `/tickets/${ticketId}/attachments`,
        form,
      ),
    )
    return toAttachment(created)
  },

  async deleteAttachment(
    ticketId: string,
    attachmentId: string,
  ): Promise<void> {
    if (!usesLiveTickets()) {
      await mockLatency()
      const ticket = mockTickets.find((t) => t.id === ticketId)
      if (!ticket?.attachments) return
      ticket.attachments = ticket.attachments.filter(
        (a) => a.id !== attachmentId,
      )
      return
    }

    unwrap(
      await del<Envelope<{ deleted: boolean }>>(
        `/tickets/${ticketId}/attachments/${attachmentId}`,
      ),
    )
  },

  async downloadAttachment(
    ticketId: string,
    attachment: TicketAttachment,
  ): Promise<void> {
    if (!usesLiveTickets()) {
      // Mock mode has no bytes on disk ? surface a clear failure instead of a
      // silent no-op that looks like a broken download button.
      throw new ApiError('Downloads are only available against the live API.', {
        code: 'NOT_FOUND',
        status: 404,
      })
    }

    const response = await apiClient.get<Blob>(
      `/tickets/${ticketId}/attachments/${attachment.id}`,
      { responseType: 'blob' },
    )
    const url = URL.createObjectURL(response.data)
    const link = document.createElement('a')
    link.href = url
    link.download = attachment.name
    link.click()
    URL.revokeObjectURL(url)
  },
}
