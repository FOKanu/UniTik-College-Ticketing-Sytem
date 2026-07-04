import { AiService } from '../service/ai.service';

describe('AiService (scaffold)', () => {
  const service = new AiService();

  it('returns a placeholder low-confidence classification', async () => {
    const result = await service.classifyTicket('My laptop cannot connect to campus WiFi.');
    expect(result.category).toBe('GENERAL');
    expect(result.confidence).toBe(0);
  });

  // TODO: replace with real tests once a model/provider is chosen and implemented.
});
