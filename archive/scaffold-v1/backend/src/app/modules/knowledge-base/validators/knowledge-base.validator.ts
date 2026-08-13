import { validateBody } from '../../../shared/validators/base.validator';
import { createKnowledgeBaseSchema, updateKnowledgeBaseSchema } from '../schemas/knowledge-base.schema';

export const validateCreateKnowledgeBase = validateBody(createKnowledgeBaseSchema);
export const validateUpdateKnowledgeBase = validateBody(updateKnowledgeBaseSchema);
