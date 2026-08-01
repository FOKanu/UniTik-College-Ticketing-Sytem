import { validateBody } from '../../../shared/validators/base.validator';
import { sendMessageSchema } from '../schemas/chatbot.schema';

export const validateSendMessage = validateBody(sendMessageSchema);
