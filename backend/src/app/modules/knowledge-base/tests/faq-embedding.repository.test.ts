jest.mock('../../../database/prisma', () => ({
  prisma: {
    $executeRaw: jest.fn(),
  },
}));

import { prisma } from '../../../database/prisma';
import { upsertFaqEmbedding } from '../repository/faq-embedding.repository';

const executeRaw = prisma.$executeRaw as jest.Mock;
const validVector = (): number[] => Array.from({ length: 1536 }, (_, index) => index / 1536);

function record(embedding: number[]) {
  return {
    id: 'faq-academics-001',
    question: 'Question',
    answer: 'Answer',
    category: 'Academics',
    language: 'en',
    contextBlob: 'Escalate when needed.',
    embedding,
  };
}

describe('upsertFaqEmbedding', () => {
  beforeEach(() => {
    executeRaw.mockReset();
  });

  it('passes a valid vector to the parameterized Prisma raw-SQL boundary', async () => {
    executeRaw.mockResolvedValue(1);
    await expect(upsertFaqEmbedding(record(validVector()))).resolves.toBeUndefined();
    expect(executeRaw).toHaveBeenCalledTimes(1);
  });

  it('rejects an invalid dimension before executing SQL', async () => {
    await expect(upsertFaqEmbedding(record(Array(384).fill(0)))).rejects.toThrow(
      'exactly 1536',
    );
    expect(executeRaw).not.toHaveBeenCalled();
  });

  it('rejects a non-finite vector before executing SQL', async () => {
    const embedding = validVector();
    embedding[20] = Number.POSITIVE_INFINITY;
    await expect(upsertFaqEmbedding(record(embedding))).rejects.toThrow(
      'Embedding values must be finite.',
    );
    expect(executeRaw).not.toHaveBeenCalled();
  });
});
