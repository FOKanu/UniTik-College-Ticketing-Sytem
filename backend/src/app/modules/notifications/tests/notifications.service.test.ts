import { NotificationsService } from '../service/notifications.service';

describe('NotificationsService (scaffold)', () => {
  const service = new NotificationsService();

  it('returns mock list data until real persistence is implemented', async () => {
    const items = await service.getAll();
    expect(Array.isArray(items)).toBe(true);
  });

  // TODO: replace with real behavioral tests once notifications business logic is implemented.
});
