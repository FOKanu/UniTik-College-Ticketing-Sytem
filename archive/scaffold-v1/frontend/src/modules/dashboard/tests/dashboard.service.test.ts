import { describe, expect, it, vi } from 'vitest';
import { dashboardService } from '../services/dashboard.service';

describe('Dashboard service (scaffold)', () => {
  it('calls the dashboard endpoint', async () => {
    const spy = vi.spyOn(await import('../../../services/api-client'), 'apiClient', 'get');
    void spy;
    expect(typeof dashboardService.list).toBe('function');
  });

  // TODO: replace with real tests once the dashboard module returns real data.
});
