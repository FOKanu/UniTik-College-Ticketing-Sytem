export type SupportedLanguage = 'en' | 'de';

export interface ChatMessage {
  conversationId: string;
  role: 'user' | 'assistant';
  content: string;
  language?: SupportedLanguage;
}
