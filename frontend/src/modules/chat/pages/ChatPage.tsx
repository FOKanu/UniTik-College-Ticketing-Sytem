import { FormEvent, useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';

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

const SUGGESTED_TOPICS = [
  'Reset student portal password',
  'Check tuition refund status',
  'Report a maintenance issue',
];

/**
 * Matches Figma "05 - Student AI Chat" (node 1:6): chat card with user
 * messages right-aligned in steel and bot replies left-aligned in tinted
 * cornflower, an input row pinned under the card, and a right rail with
 * Suggested Topics + an escalation promo.
 *
 * All wiring is real: conversations/messages/escalate endpoints exist (the
 * backend bot is currently a placeholder responder — the LLM/RAG pipeline is
 * a backlog item). "Create Ticket from This Chat" calls the real escalate
 * endpoint and navigates to the created ticket.
 */
export function ChatPage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [content, setContent] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [escalating, setEscalating] = useState(false);

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

  const sendMessage = async (text: string) => {
    if (!conversationId || !text.trim()) return;
    try {
      const res = await apiClient.post<{ userMessage: Message; botMessage: Message }>(
        `/chat/conversations/${conversationId}/messages`,
        { content: text },
      );
      setMessages((prev) => [...prev, res.userMessage, res.botMessage]);
      setContent('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Send failed');
    }
  };

  const send = async (e: FormEvent) => {
    e.preventDefault();
    await sendMessage(content);
  };

  const escalate = async () => {
    if (!conversationId) return;
    setEscalating(true);
    try {
      const res = await apiClient.post<{ ticketId: string }>(
        `/chat/conversations/${conversationId}/escalate`,
      );
      navigate(`/tickets/${res.ticketId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Escalation failed');
    } finally {
      setEscalating(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-[22px] font-semibold text-uts-text">AI Assistant</h1>
        <p className="text-[13px] text-[#6b6b6b] mt-1">
          Ask anything about academics, IT, finance, or maintenance.
        </p>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="grid grid-cols-[1fr_346px] gap-6 items-start">
        <div className="flex flex-col gap-3">
          <div className="bg-white border border-[#dedede] rounded-lg shadow-sm p-5 min-h-[420px] space-y-3">
            {messages.map((m) => {
              const isUser = m.sender === 'user';
              return (
                <div key={m.id} className={isUser ? 'flex justify-end' : 'flex justify-start'}>
                  <div
                    className={`max-w-[62%] rounded-[10px] px-4 py-2.5 text-[12px] ${
                      isUser ? 'bg-brand-steel text-white' : 'bg-brand-cornflower/35 text-[#2e2e2e]'
                    }`}
                  >
                    {m.content}
                  </div>
                </div>
              );
            })}
            {messages.length === 0 && (
              <p className="text-sm text-uts-nav">
                No messages yet — ask a question below, or pick a suggested topic.
              </p>
            )}
            {messages.length > 0 && (
              <button
                type="button"
                onClick={() => void escalate()}
                disabled={escalating}
                className="h-9 px-4 rounded-md border border-[#c7c7c7] bg-white text-[13px] font-medium text-[#2e2e2e] hover:border-brand-sky disabled:opacity-50"
              >
                {escalating ? 'Creating ticket…' : 'Create Ticket from This Chat'}
              </button>
            )}
          </div>

          <form
            onSubmit={(e) => void send(e)}
            className="bg-white border border-[#c7c7c7] rounded-lg p-2.5 flex items-center gap-3"
          >
            <input
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Ask a question..."
              required
              className="flex-1 px-2 text-[12px] placeholder:text-[#a1a1a1] outline-none"
            />
            <button
              type="submit"
              className="h-10 px-6 rounded-md bg-brand-steel text-white text-[13px] font-medium"
            >
              Send
            </button>
          </form>
        </div>

        <aside className="space-y-5">
          <div>
            <h2 className="text-[14px] font-semibold text-uts-text mb-2">Suggested Topics</h2>
            <div className="bg-white border border-[#dedede] rounded-lg shadow-sm divide-y divide-[#ededed]">
              {SUGGESTED_TOPICS.map((topic) => (
                <button
                  key={topic}
                  type="button"
                  onClick={() => void sendMessage(topic)}
                  className="block w-full text-left px-4 py-3.5 text-[12px] text-[#525252] hover:bg-[#fafafa]"
                >
                  {topic}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-brand-steel border border-[#dedede] rounded-lg shadow-sm p-5">
            <p className="text-[14px] font-semibold text-white">Still stuck?</p>
            <p className="text-[12px] text-white mt-1.5">
              Escalate this conversation to a support ticket anytime.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
