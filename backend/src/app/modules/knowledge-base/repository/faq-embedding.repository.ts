import { Prisma } from '@prisma/client';
import { prisma } from '../../../database/prisma';
import { validateEmbeddingVector } from '../../ai/embeddings/embedding-vector.validator';

const KNOWLEDGE_BASE_TRANSACTION_TIMEOUT_MS = 30_000;

export interface FaqEmbeddingRecord {
  id: string;
  question: string;
  answer: string;
  category: string;
  language: string;
  contextBlob: string;
  embedding: number[];
}

interface PreparedFaqEmbeddingRecord {
  record: FaqEmbeddingRecord;
  vectorString: string;
}

type RawSqlClient = Pick<Prisma.TransactionClient, '$executeRaw'>;

function prepareFaqEmbeddingRecord(
  record: FaqEmbeddingRecord,
): PreparedFaqEmbeddingRecord {
  const embedding = validateEmbeddingVector(record.embedding);
  return {
    record,
    vectorString: `[${embedding.join(',')}]`,
  };
}

async function executeFaqEmbeddingUpsert(
  client: RawSqlClient,
  prepared: PreparedFaqEmbeddingRecord,
): Promise<void> {
  const { record, vectorString } = prepared;
  await client.$executeRaw`
    INSERT INTO "FaqEntry" (id, question, answer, category, language, "contextBlob", embedding, "createdAt", "updatedAt")
    VALUES (
      ${record.id},
      ${record.question},
      ${record.answer},
      ${record.category},
      ${record.language},
      ${record.contextBlob},
      ${vectorString}::vector,
      now(),
      now()
    )
    ON CONFLICT (id) DO UPDATE SET
      question = EXCLUDED.question,
      answer = EXCLUDED.answer,
      category = EXCLUDED.category,
      language = EXCLUDED.language,
      "contextBlob" = EXCLUDED."contextBlob",
      embedding = EXCLUDED.embedding,
      "updatedAt" = now()
  `;
}

export async function upsertFaqEmbedding(record: FaqEmbeddingRecord): Promise<void> {
  await executeFaqEmbeddingUpsert(prisma, prepareFaqEmbeddingRecord(record));
}

export async function upsertFaqEmbeddingsAtomically(
  records: FaqEmbeddingRecord[],
): Promise<void> {
  if (records.length === 0) {
    return;
  }

  // Validate and serialize every vector before asking Prisma to open a transaction.
  const preparedRecords = records.map(prepareFaqEmbeddingRecord);

  await prisma.$transaction(
    async (transaction) => {
      for (const prepared of preparedRecords) {
        await executeFaqEmbeddingUpsert(transaction, prepared);
      }
    },
    {
      // Seventy-five parameterized upserts may exceed Prisma's 5-second interactive default.
      timeout: KNOWLEDGE_BASE_TRANSACTION_TIMEOUT_MS,
    },
  );
}
