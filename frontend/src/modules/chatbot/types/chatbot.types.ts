export interface ChatTurn {
  role: 'user' | 'assistant';
  content: string;
}

export interface SendMessageResult {
  reply: string;
  language: string;
  conversationId: string;
}
