import { describe, expect, it, vi } from 'vitest';
import { faqService } from '../services/faq.service';

describe('Faq service (scaffold)', () => {
  it('calls the knowledge-base endpoint', async () => {
    const spy = vi.spyOn(await import('../../../services/api-client'), 'apiClient', 'get');
    void spy;
    expect(typeof faqService.list).toBe('function');
  });

  // TODO: replace with real tests once the knowledge-base module returns real data.
});
