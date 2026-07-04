# Chatbot module (frontend)

Chat widget UI wired to the chatbot module's mock `/chatbot/message` endpoint.

**Requirement IDs:** NFR-1.1, NFR-1.1.1, NFR-1.1.2, NFR-1.1.4
**Backend counterpart:** `backend/src/app/modules/chatbot`

## Structure

```
chatbot/
├── components/ChatWindow.tsx   message list + input
├── pages/ChatbotPage.tsx       routed at /chatbot
├── hooks/useChatbot.ts         conversation state + send()
├── services/chatbot.service.ts POST /chatbot/message
├── types/chatbot.types.ts
├── tests/
└── README.md
```

## TODO

- [ ] Render detected language back to the user once real language detection lands (NFR-1.1.1)
- [ ] Add a "create ticket from this conversation" action once ticket-creation handoff is implemented
- [ ] NEG-5: audit that this UI never renders another user's ticket data once real answers are wired
