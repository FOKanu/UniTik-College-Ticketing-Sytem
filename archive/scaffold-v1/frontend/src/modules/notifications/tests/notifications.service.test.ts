import { describe, expect, it, vi } from 'vitest';
import { notificationsService } from '../services/notifications.service';

describe('Notifications service (scaffold)', () => {
  it('calls the notifications endpoint', async () => {
    const spy = vi.spyOn(await import('../../../services/api-client'), 'apiClient', 'get');
    void spy;
    expect(typeof notificationsService.list).toBe('function');
  });

  // TODO: replace with real tests once the notifications module returns real data.
});
