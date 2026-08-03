export type UserRole = 'student' | 'agent' | 'admin'

export type TicketStatus =
  | 'open'
  | 'in_progress'
  | 'waiting_on_student'
  | 'resolved'
  | 'closed'

export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent'

export type Department = 'Academics' | 'IT' | 'Finance' | 'Maintenance'

export interface User {
  id: string
  email: string
  displayName: string
  role: UserRole
  department?: Department
  /** Hex background for initials avatar (client preference). */
  avatarColor?: string
}

export interface TicketComment {
  id: string
  ticketId: string
  authorId: string
  authorName: string
  body: string
  createdAt: string
  internal?: boolean
}

export interface TicketAttachment {
  id: string
  name: string
  sizeLabel?: string
}

export interface Ticket {
  id: string
  subject: string
  description: string
  category: Department
  status: TicketStatus
  priority: TicketPriority
  createdBy: string
  requesterName?: string
  requesterEmail?: string
  assignedTo?: string
  assignedName?: string
  createdAt: string
  updatedAt: string
  /** First-response due timestamp from the API (ISO). */
  slaDueAt?: string | null
  /** Set once when the open ticket passed slaDueAt. */
  slaBreachedAt?: string | null
  slaHoursRemaining?: number
  slaBreached?: boolean
  comments: TicketComment[]
  attachments?: TicketAttachment[]
}

export interface NotificationItem {
  id: string
  title: string
  body: string
  read: boolean
  createdAt: string
  ticketId?: string
}

export interface KnowledgeArticle {
  id: string
  title: string
  category: Department
  status: 'published' | 'draft'
  views: number
  updatedAt: string
}

export interface AuthSession {
  accessToken: string
  user: User
}
