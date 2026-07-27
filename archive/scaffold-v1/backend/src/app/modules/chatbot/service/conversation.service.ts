// Orchestrates a single chat turn: detect language -> check FAQ -> (TODO) fall back to ticket
// creation via the tickets module if no FAQ match and intent is TICKET_REQUEST.
// NEG-5: must never disclose another user's ticket information — enforce when wiring real logic.
// NEG-6: must never finalize sensitive decisions — categorize/route only.

import { IntentService } from './intent.service';
import { FaqService } from './faq.service';
import { SendMessageDto } from '../dto/send-message.dto';

export class ConversationService {
  constructor(
    private readonly intentService: IntentService = new IntentService(),
    private readonly faqService: FaqService = new FaqService(),
  ) {}

  async handleMessage(dto: SendMessageDto): Promise<{ reply: string; language: string; conversationId: string }> {
    const language = await this.intentService.detectLanguage(dto.message);
    const answer = await this.faqService.findAnswer(dto.message);

    // TODO: if answer is null, classify intent and, if TICKET_REQUEST, hand off to the tickets
    // module to create a ticket (NFR-1.1.2) instead of returning this mock reply.
    const reply = answer ?? 'This is a placeholder chatbot reply. TODO: implement real FAQ/AI-backed answers.';

    return {
      reply,
      language,
      conversationId: dto.conversationId ?? 'mock-conversation-id',
    };
  }
}
