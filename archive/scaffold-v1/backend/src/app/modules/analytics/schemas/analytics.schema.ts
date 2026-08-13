// Zod runtime validation schema. TODO: replace the permissive placeholder below with real
// field-level validation once the analytics module's shape is finalized.

import { z } from 'zod';

export const createAnalyticsSchema = z.object({}).passthrough();
export const updateAnalyticsSchema = createAnalyticsSchema.partial();
