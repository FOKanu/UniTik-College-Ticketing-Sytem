// Zod runtime validation schema. TODO: replace the permissive placeholder below with real
// field-level validation once the knowledge-base module's shape is finalized.

import { z } from 'zod';

export const createKnowledgeBaseSchema = z.object({}).passthrough();
export const updateKnowledgeBaseSchema = createKnowledgeBaseSchema.partial();
