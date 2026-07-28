import { prisma } from '../../../database/prisma';
import { validateEmbeddingVector } from '../../ai/embeddings/embedding-vector.validator';

export interface FaqEmbeddingRecord {
  id: string;
  question: string;
  answer: string;
  category: string;
  language: string;
  contextBlob: string;
  embedding: number[];
}

export async function upsertFaqEmbedding(record: FaqEmbeddingRecord): Promise<void> {
  const embedding = validateEmbeddingVector(record.embedding);
  const vectorString = `[${embedding.join(',')}]`;

  await prisma.$executeRaw`
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
