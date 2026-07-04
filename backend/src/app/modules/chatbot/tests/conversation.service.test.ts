import { ConversationService } from '../service/conversation.service';

describe('ConversationService (scaffold)', () => {
  const service = new ConversationService();

  it('returns a placeholder reply and default language', async () => {
    const result = await service.handleMessage({ message: 'How do I reset my password?' });
    expect(result.language).toBe('en');
    expect(typeof result.reply).toBe('string');
  });

  // TODO: replace with real tests once FAQ/AI-backed answers are implemented.
});
