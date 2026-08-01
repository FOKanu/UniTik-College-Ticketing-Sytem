// Inferred from the Zod schema, which is the source of truth for this module's request shape.

import { z } from 'zod';
import { createTicketsSchema } from '../schemas/tickets.schema';

export type CreateTicketsDto = z.infer<typeof createTicketsSchema>;
