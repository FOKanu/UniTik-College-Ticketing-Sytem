import { FormEvent, useState } from 'react';
import { Button } from '../../../components/common/Button';
import { Input } from '../../../components/common/Input';
import { useChatbot } from '../hooks/useChatbot';

// NFR-1.1 / NFR-1.1.1 / NFR-1.1.2 / NFR-1.1.4. NEG-5: never render another user's ticket data here.
export function ChatWindow() {
  const { turns, send, sending } = useChatbot();
  const [message, setMessage] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    void send(message);
    setMessage('');
  };

  return (
    <div className="flex flex-col gap-4 bg-white rounded-lg border border-gray-200 p-4 h-[28rem]">
      <div className="flex-1 overflow-y-auto flex flex-col gap-2">
        {turns.length === 0 && (
          <p className="text-sm text-gray-500">
            Ask a question in English or German — TODO: real FAQ/AI-backed answers not yet implemented.
          </p>
        )}
        {turns.map((turn, i) => (
          <div
            key={i}
            className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
              turn.role === 'user' ? 'self-end bg-blue-600 text-white' : 'self-start bg-gray-100 text-gray-900'
            }`}
          >
            {turn.content}
          </div>
        ))}
      </div>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          id="chatbot-message"
          className="flex-1"
          placeholder="Type your question..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <Button type="submit" disabled={sending}>
          {sending ? '...' : 'Send'}
        </Button>
      </form>
    </div>
  );
}
