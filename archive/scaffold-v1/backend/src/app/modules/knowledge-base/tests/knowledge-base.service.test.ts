import { KnowledgeBaseService } from '../service/knowledge-base.service';

describe('KnowledgeBaseService (scaffold)', () => {
  const service = new KnowledgeBaseService();

  it('returns mock list data until real persistence is implemented', async () => {
    const items = await service.getAll();
    expect(Array.isArray(items)).toBe(true);
  });

  // TODO: replace with real behavioral tests once knowledge-base business logic is implemented.
});
