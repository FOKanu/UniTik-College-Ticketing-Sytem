import { apiClient } from '../../../services/api-client';
import { SendMessageResult } from '../types/chatbot.types';

export const chatbotService = {
  sendMessage: (message: string, conversationId?: string) =>
    apiClient.post<SendMessageResult>('/chatbot/message', { message, conversationId }),
};
