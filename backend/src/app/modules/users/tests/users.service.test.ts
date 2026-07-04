import { UsersService } from '../service/users.service';

describe('UsersService (scaffold)', () => {
  const service = new UsersService();

  it('returns mock list data until real persistence is implemented', async () => {
    const items = await service.getAll();
    expect(Array.isArray(items)).toBe(true);
  });

  // TODO: replace with real behavioral tests once users business logic is implemented.
});
