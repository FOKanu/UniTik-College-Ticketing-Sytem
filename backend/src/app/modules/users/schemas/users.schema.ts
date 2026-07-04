// Zod runtime validation schema. TODO: replace the permissive placeholder below with real
// field-level validation once the users module's shape is finalized.

import { z } from 'zod';

export const createUsersSchema = z.object({}).passthrough();
export const updateUsersSchema = createUsersSchema.partial();
