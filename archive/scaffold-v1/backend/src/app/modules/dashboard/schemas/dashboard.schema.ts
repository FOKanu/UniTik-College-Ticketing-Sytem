// Zod runtime validation schema. TODO: replace the permissive placeholder below with real
// field-level validation once the dashboard module's shape is finalized.

import { z } from 'zod';

export const createDashboardSchema = z.object({}).passthrough();
export const updateDashboardSchema = createDashboardSchema.partial();
