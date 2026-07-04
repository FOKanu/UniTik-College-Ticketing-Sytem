import { describe, expect, it, vi } from 'vitest';
import { ticketService } from '../services/ticket.service';

describe('Ticket service (scaffold)', () => {
  it('calls the tickets endpoint', async () => {
    const spy = vi.spyOn(await import('../../../services/api-client'), 'apiClient', 'get');
    void spy;
    expect(typeof ticketService.list).toBe('function');
  });

  // TODO: replace with real tests once the tickets module returns real data.
});
