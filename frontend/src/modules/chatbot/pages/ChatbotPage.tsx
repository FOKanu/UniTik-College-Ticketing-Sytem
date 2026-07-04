import { ChatWindow } from '../components/ChatWindow';

export function ChatbotPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold text-gray-900">Chatbot</h1>
      <ChatWindow />
    </div>
  );
}
