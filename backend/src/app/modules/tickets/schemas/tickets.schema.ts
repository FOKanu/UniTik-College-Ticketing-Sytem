// Zod runtime validation schema. TODO: replace the permissive placeholder below with real
// field-level validation once the tickets module's shape is finalized.

import { z } from 'zod';

export const createTicketsSchema = z.object({}).passthrough();
export const updateTicketsSchema = createTicketsSchema.partial();
