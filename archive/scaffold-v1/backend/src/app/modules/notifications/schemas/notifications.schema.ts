// Zod runtime validation schema. TODO: replace the permissive placeholder below with real
// field-level validation once the notifications module's shape is finalized.

import { z } from 'zod';

export const createNotificationsSchema = z.object({}).passthrough();
export const updateNotificationsSchema = createNotificationsSchema.partial();
