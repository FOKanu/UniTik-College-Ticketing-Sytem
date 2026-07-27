import { FormEvent, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';

import { apiClient } from '../../../lib/api-client';
import { useAuth } from '../../../store/auth.store';

interface Conversation {
  id: string;
}

interface Message {
  id: string;
  sender: string;
  content: string;
}

export function ChatPage() {
  const { token } = useAuth();
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [content, setContent] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    apiClient
      .post<Conversation>('/chat/conversations', {})
      .then((c) => setConversationId(c.id))
      .catch((err: Error) => setError(err.message));
  }, [token]);

  useEffect(() => {
    if (!conversationId) return;
    apiClient
      .get<Message[]>(`/chat/conversations/${conversationId}/messages`)
      .then(setMessages)
      .catch((err: Error) => setError(err.message));
  }, [conversationId]);

  if (!token) return <Navigate to="/login" replace />;

  const send = async (e: FormEvent) => {
    e.preventDefault();
    if (!conversationId) return;
    try {
      const res = await apiClient.post<{ userMessage: Message; botMessage: Message }>(
        `/chat/conversations/${conversationId}/messages`,
        { content },
      );
      setMessages((prev) => [...prev, res.userMessage, res.botMessage]);
      setContent('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Send failed');
    }
  };

  const escalate = async () => {
    if (!conversationId) return;
    try {
      const res = await apiClient.post<{ ticketId: string }>(
        `/chat/conversations/${conversationId}/escalate`,
      );
      alert(`Escalated to ticket ${res.ticketId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Escalation failed');
    }
  };

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Support chat</h1>
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <div className="border border-uts-muted rounded-lg bg-white p-4 min-h-[240px] space-y-2">
        {messages.map((m) => (
          <div key={m.id} className={m.sender === 'user' ? 'text-right' : ''}>
            <span
              className={`inline-block px-3 py-2 rounded text-sm ${
                m.sender === 'user' ? 'bg-brand-steel text-white' : 'bg-uts-muted'
              }`}
            >
              {m.content}
            </span>
          </div>
        ))}
      </div>
      <form onSubmit={(e) => void send(e)} className="flex gap-2">
        <input
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="flex-1 border border-uts-muted rounded px-3 py-2"
          placeholder="Type a message…"
          required
        />
        <button type="submit" className="bg-brand-steel text-white px-4 py-2 rounded">
          Send
        </button>
      </form>
      <button type="button" onClick={() => void escalate()} className="text-brand-sky text-sm">
        Escalate to ticket
      </button>
    </div>
  );
}
