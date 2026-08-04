import type {
  Department,
  Ticket,
  TicketPriority,
  TicketStatus,
  User,
} from '@/types'

export interface ListTicketsParams {
  query?: string
  status?: TicketStatus | 'all'
  department?: Department | 'all'
  priority?: TicketPriority | 'all'
  assignee?: 'me' | 'unassigned' | 'all'
  mine?: boolean
  page?: number
  pageSize?: number
}

export interface Paginated<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
}

export interface CreateTicketPayload {
  subject: string
  description: string
  category: Department
  priority: TicketPriority
  urgent?: boolean
  requesterId?: string
  assignedTo?: string
}

export interface AddCommentPayload {
  body: string
  internal?: boolean
}

export interface UpdateTicketPayload {
  status?: TicketStatus
  priority?: TicketPriority
  /** UI department bucket; sent as both category + department for routing. */
  category?: Department
  assignedTo?: string | null
  assignedName?: string | null
  resolutionSummary?: string
}

export interface LoginPayload {
  email: string
  password: string
}

export interface LoginResponse {
  accessToken: string
  user: User
}

export interface CreateTicketResponse {
  ticket: Ticket
}
