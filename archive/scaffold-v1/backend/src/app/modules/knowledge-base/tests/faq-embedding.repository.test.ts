const transactionExecuteRaw = jest.fn();
const transaction = { $executeRaw: transactionExecuteRaw };

jest.mock('../../../database/prisma', () => ({
  prisma: {
    $executeRaw: jest.fn(),
    $transaction: jest.fn(),
  },
}));

import { prisma } from '../../../database/prisma';
import {
  upsertFaqEmbedding,
  upsertFaqEmbeddingsAtomically,
} from '../repository/faq-embedding.repository';

const executeRaw = prisma.$executeRaw as jest.Mock;
const runTransaction = prisma.$transaction as jest.Mock;
const validVector = (): number[] =>
  Array.from({ length: 1536 }, (_, index) => index / 1536);

function record(embedding = validVector(), id = 'faq-academics-001') {
  return {
    id,
    question: 'Question',
    answer: 'Answer',
    category: 'Academics',
    language: 'en',
    contextBlob: 'Deterministic retrieval context.',
    embedding,
  };
}

describe('FAQ embedding repository', () => {
  beforeEach(() => {
    executeRaw.mockReset();
    runTransaction.mockReset();
    transactionExecuteRaw.mockReset();
    runTransaction.mockImplementation(
      async (operation: (client: typeof transaction) => Promise<void>) =>
        operation(transaction),
    );
  });

  describe('upsertFaqEmbedding', () => {
    it('writes a valid vector through the global parameterized raw-SQL client', async () => {
      executeRaw.mockResolvedValue(1);
      await expect(upsertFaqEmbedding(record())).resolves.toBeUndefined();
      expect(executeRaw).toHaveBeenCalledTimes(1);
      expect(runTransaction).not.toHaveBeenCalled();
    });

    it('validates before executing single-record SQL', async () => {
      await expect(upsertFaqEmbedding(record(Array(384).fill(0)))).rejects.toThrow(
        'exactly 1536',
      );
      expect(executeRaw).not.toHaveBeenCalled();
    });
  });

  describe('upsertFaqEmbeddingsAtomically', () => {
    it('returns safely for an empty list without opening a transaction', async () => {
      await expect(upsertFaqEmbeddingsAtomically([])).resolves.toBeUndefined();
      expect(runTransaction).not.toHaveBeenCalled();
    });

    it('validates every vector before opening a transaction', async () => {
      const records = [
        record(validVector(), 'faq-academics-001'),
        record(Array(384).fill(0), 'faq-academics-002'),
      ];

      await expect(upsertFaqEmbeddingsAtomically(records)).rejects.toThrow(
        'exactly 1536',
      );
      expect(runTransaction).not.toHaveBeenCalled();
      expect(transactionExecuteRaw).not.toHaveBeenCalled();
      expect(executeRaw).not.toHaveBeenCalled();
    });

    it('writes every valid record through one transaction client', async () => {
      transactionExecuteRaw.mockResolvedValue(1);
      const records = [
        record(validVector(), 'faq-academics-001'),
        record(validVector(), 'faq-academics-002'),
      ];

      await expect(upsertFaqEmbeddingsAtomically(records)).resolves.toBeUndefined();
      expect(runTransaction).toHaveBeenCalledTimes(1);
      expect(runTransaction.mock.calls[0][1]).toEqual({ timeout: 30_000 });
      expect(transactionExecuteRaw).toHaveBeenCalledTimes(2);
      expect(executeRaw).not.toHaveBeenCalled();
    });

    it('propagates a transactional SQL failure', async () => {
      transactionExecuteRaw
        .mockResolvedValueOnce(1)
        .mockRejectedValueOnce(new Error('transactional write failed'));
      const records = [
        record(validVector(), 'faq-academics-001'),
        record(validVector(), 'faq-academics-002'),
      ];

      await expect(upsertFaqEmbeddingsAtomically(records)).rejects.toThrow(
        'transactional write failed',
      );
      expect(runTransaction).toHaveBeenCalledTimes(1);
      expect(transactionExecuteRaw).toHaveBeenCalledTimes(2);
      expect(executeRaw).not.toHaveBeenCalled();
    });
  });
});
