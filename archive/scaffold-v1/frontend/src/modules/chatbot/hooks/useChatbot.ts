import { useState } from 'react';
import { chatbotService } from '../services/chatbot.service';
import { ChatTurn } from '../types/chatbot.types';

// NFR-2.7.2: keep this snappy under peak load — TODO: revisit once real AI calls add latency.
export function useChatbot() {
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [sending, setSending] = useState(false);

  const send = async (message: string) => {
    setTurns((prev) => [...prev, { role: 'user', content: message }]);
    setSending(true);
    try {
      const result = await chatbotService.sendMessage(message, conversationId);
      setConversationId(result.conversationId);
      setTurns((prev) => [...prev, { role: 'assistant', content: result.reply }]);
    } catch (err) {
      setTurns((prev) => [
        ...prev,
        { role: 'assistant', content: err instanceof Error ? err.message : 'Something went wrong.' },
      ]);
    } finally {
      setSending(false);
    }
  };

  return { turns, send, sending };
}
