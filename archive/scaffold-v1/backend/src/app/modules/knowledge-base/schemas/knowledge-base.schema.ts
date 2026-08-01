// Zod runtime validation schema. TODO: replace the permissive placeholder below with real
// field-level validation once the knowledge-base module's shape is finalized.

import { z } from 'zod';

export const createKnowledgeBaseSchema = z.object({}).passthrough();
export const updateKnowledgeBaseSchema = createKnowledgeBaseSchema.partial();

export const knowledgeBaseDepartmentSchema = z.enum([
  'Academics',
  'Finance',
  'IT Support',
  'Maintenance',
]);

export const knowledgeBaseDocumentMetadataSchema = z.object({
  department: knowledgeBaseDepartmentSchema,
  audience: z.literal('Student'),
  language: z.literal('en'),
  status: z.literal('synthetic-draft'),
  source: z.literal('team-synthetic-data'),
  entryCount: z.number().int().positive(),
});

const nonEmptyString = z.string().trim().min(1);
const nonEmptyStringList = z.array(nonEmptyString).min(1);

export const knowledgeBaseContentEntrySchema = z.object({
  id: nonEmptyString,
  department: knowledgeBaseDepartmentSchema,
  audience: z.literal('Student'),
  language: z.literal('en'),
  status: z.literal('synthetic-draft'),
  source: z.literal('team-synthetic-data'),
  question: nonEmptyString,
  answer: nonEmptyString,
  escalation: nonEmptyString,
  relatedPhrasings: nonEmptyStringList,
  keywords: nonEmptyStringList,
});

export const parsedKnowledgeBaseDocumentSchema = z.object({
  filePath: nonEmptyString,
  metadata: knowledgeBaseDocumentMetadataSchema,
  entries: z.array(knowledgeBaseContentEntrySchema).min(1),
});
