// Shared ticket types — mirrors backend/app/schemas/tickets.py::TicketResponse /
// CommentResponse and the TicketStatus / TicketPriority enums in
// backend/app/db/base.py. Keep these two in sync: if a field or enum value
// changes on the backend, update it here once instead of in every page that
// used to redefine its own local `Ticket` interface.

export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH';

export const TICKET_STATUS_OPTIONS: TicketStatus[] = [
  'OPEN',
  'IN_PROGRESS',
  'RESOLVED',
  'CLOSED',
];

export interface Ticket {
  id: string;
  subject: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  category: string | null;
  department: string | null;
  createdById: string;
  assignedToId: string | null;
  problemId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TicketComment {
  id: string;
  ticketId: string;
  authorId: string;
  body: string;
  isInternal: boolean;
  createdAt: string;
}
