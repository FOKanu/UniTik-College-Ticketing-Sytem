import { AdminService } from '../service/admin.service';

describe('AdminService (scaffold)', () => {
  const service = new AdminService();

  it('returns mock list data until real persistence is implemented', async () => {
    const items = await service.getAll();
    expect(Array.isArray(items)).toBe(true);
  });

  // TODO: replace with real behavioral tests once admin business logic is implemented.
});
