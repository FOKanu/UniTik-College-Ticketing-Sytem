import { validateBody } from '../../../shared/validators/base.validator';
import { createTicketsSchema, updateTicketsSchema } from '../schemas/tickets.schema';

export const validateCreateTickets = validateBody(createTicketsSchema);
export const validateUpdateTickets = validateBody(updateTicketsSchema);
