// Inferred from the Zod schema, which is the source of truth for this module's request shape.

import { z } from 'zod';
import { updateTicketsSchema } from '../schemas/tickets.schema';

export type UpdateTicketsDto = z.infer<typeof updateTicketsSchema>;
