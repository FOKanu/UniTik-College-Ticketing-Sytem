// Zod runtime validation schema — source of truth for CreateTicketsDto / UpdateTicketsDto,
// which are inferred from these schemas (see dto/create-tickets.dto.ts, dto/update-tickets.dto.ts).

import { z } from 'zod';
import { TicketPriority, TicketStatus } from '@prisma/client';

export const createTicketsSchema = z.object({
  subject: z.string().min(1),
  description: z.string().min(1),
  createdById: z.string().min(1),
  department: z.string().optional(),
  category: z.string().optional(),
  priority: z.nativeEnum(TicketPriority).optional(),
});

const updateTicketsBaseSchema = z.object({
  subject: z.string().min(1),
  description: z.string().min(1),
  status: z.nativeEnum(TicketStatus),
  department: z.string(),
  category: z.string(),
  priority: z.nativeEnum(TicketPriority),
  assignedToId: z.string(),
});

export const updateTicketsSchema = updateTicketsBaseSchema.partial();
