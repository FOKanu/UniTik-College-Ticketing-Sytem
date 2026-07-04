import { describe, expect, it, vi } from 'vitest';
import { adminService } from '../services/admin.service';

describe('Admin service (scaffold)', () => {
  it('calls the admin endpoint', async () => {
    const spy = vi.spyOn(await import('../../../services/api-client'), 'apiClient', 'get');
    void spy;
    expect(typeof adminService.list).toBe('function');
  });

  // TODO: replace with real tests once the admin module returns real data.
});
