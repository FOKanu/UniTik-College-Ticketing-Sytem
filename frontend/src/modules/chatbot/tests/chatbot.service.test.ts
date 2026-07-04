import { describe, expect, it } from 'vitest';
import { chatbotService } from '../services/chatbot.service';

describe('chatbotService (scaffold)', () => {
  it('exposes a sendMessage function', () => {
    expect(typeof chatbotService.sendMessage).toBe('function');
  });

  // TODO: replace with real tests (mocking apiClient) once the chatbot module is implemented.
});
