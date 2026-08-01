import { Router } from 'express';
import { knowledgeBaseController } from '../controller/knowledge-base.controller';
import { asyncHandler } from '../../../utils/async-handler';
import { requireAuth } from '../../../middleware/auth.middleware';
import { validateCreateKnowledgeBase, validateUpdateKnowledgeBase } from '../validators/knowledge-base.validator';

// Requirement(s) covered: NFR-1.1.4, NFR-2.7.3 (context engine)
// FAQ storage/retrieval and the context-engine placeholder consumed by the chatbot module.

export const knowledgeBaseRouter = Router();

knowledgeBaseRouter.get('/', requireAuth, asyncHandler(knowledgeBaseController.list));
knowledgeBaseRouter.get('/:id', requireAuth, asyncHandler(knowledgeBaseController.getById));
knowledgeBaseRouter.post('/', requireAuth, validateCreateKnowledgeBase, asyncHandler(knowledgeBaseController.create));
knowledgeBaseRouter.patch('/:id', requireAuth, validateUpdateKnowledgeBase, asyncHandler(knowledgeBaseController.update));
knowledgeBaseRouter.delete('/:id', requireAuth, asyncHandler(knowledgeBaseController.remove));
