import { DashboardService } from '../service/dashboard.service';

describe('DashboardService (scaffold)', () => {
  const service = new DashboardService();

  it('returns mock list data until real persistence is implemented', async () => {
    const items = await service.getAll();
    expect(Array.isArray(items)).toBe(true);
  });

  // TODO: replace with real behavioral tests once dashboard business logic is implemented.
});
