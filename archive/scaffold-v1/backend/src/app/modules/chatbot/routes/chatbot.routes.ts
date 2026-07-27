import { Router } from 'express';
import { conversationController } from '../controller/conversation.controller';
import { asyncHandler } from '../../../utils/async-handler';
import { validateSendMessage } from '../validators/chatbot.validator';

// Requirement(s) covered: NFR-1.1, NFR-1.1.1, NFR-1.1.2, NFR-1.1.4, NFR-2.7.1, NFR-2.7.2, NFR-2.7.3

export const chatbotRouter = Router();

chatbotRouter.post('/message', validateSendMessage, asyncHandler(conversationController.sendMessage));
