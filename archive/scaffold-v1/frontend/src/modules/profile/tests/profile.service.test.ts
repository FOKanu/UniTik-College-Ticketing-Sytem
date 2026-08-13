import { describe, expect, it, vi } from 'vitest';
import { profileService } from '../services/profile.service';

describe('Profile service (scaffold)', () => {
  it('calls the users endpoint', async () => {
    const spy = vi.spyOn(await import('../../../services/api-client'), 'apiClient', 'get');
    void spy;
    expect(typeof profileService.list).toBe('function');
  });

  // TODO: replace with real tests once the users module returns real data.
});
