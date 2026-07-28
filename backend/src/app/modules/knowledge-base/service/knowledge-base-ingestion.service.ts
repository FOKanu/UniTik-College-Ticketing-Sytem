import { join } from 'path';
import {
  loadKnowledgeBaseCorpus,
  validateKnowledgeBaseCorpus,
} from './knowledge-base-content.parser';
import { KnowledgeBaseContentEntry } from '../types/knowledge-base.types';
import { EmbeddingsService } from '../../ai/embeddings/embeddings';
import {
  FaqEmbeddingRecord,
  upsertFaqEmbedding,
  upsertFaqEmbeddingsAtomically,
} from '../repository/faq-embedding.repository';
import { logger } from '../../../shared/logger/logger';

const CONTENT_DIRECTORY = join(__dirname, '..', 'content');
const embeddingsService = new EmbeddingsService();

export interface KnowledgeBaseRebuildResult {
  processedCount: number;
}

interface KnowledgeBaseIngestionDependencies {
  loadCorpus: typeof loadKnowledgeBaseCorpus;
  validateCorpus: typeof validateKnowledgeBaseCorpus;
  embed: (text: string) => Promise<{ vector: number[] }>;
  upsertAll: (records: FaqEmbeddingRecord[]) => Promise<void>;
}

const defaultDependencies: KnowledgeBaseIngestionDependencies = {
  loadCorpus: loadKnowledgeBaseCorpus,
  validateCorpus: validateKnowledgeBaseCorpus,
  embed: (text) => embeddingsService.embed(text),
  upsertAll: upsertFaqEmbeddingsAtomically,
};

export function buildEmbeddingInput(entry: KnowledgeBaseContentEntry): string {
  return JSON.stringify(
    {
      id: entry.id,
      department: entry.department,
      audience: entry.audience,
      language: entry.language,
      question: entry.question,
      relatedPhrasings: entry.relatedPhrasings,
      keywords: entry.keywords,
      answer: entry.answer,
      escalationGuidance: entry.escalation,
    },
    null,
    2,
  );
}

export function buildContextBlob(entry: KnowledgeBaseContentEntry): string {
  return buildEmbeddingInput(entry);
}

function buildFaqEmbeddingRecord(
  entry: KnowledgeBaseContentEntry,
  embedding: number[],
): FaqEmbeddingRecord {
  return {
    id: entry.id,
    question: entry.question,
    answer: entry.answer,
    category: entry.department,
    language: entry.language,
    contextBlob: buildContextBlob(entry),
    embedding,
  };
}

export async function rebuildKnowledgeBase(
  dependencies: KnowledgeBaseIngestionDependencies = defaultDependencies,
): Promise<KnowledgeBaseRebuildResult> {
  logger.info('Rebuilding knowledge base from canonical corpus');

  const documents = dependencies.loadCorpus(CONTENT_DIRECTORY);
  const entries = dependencies.validateCorpus(documents);
  const records: FaqEmbeddingRecord[] = [];

  for (const entry of entries) {
    const { vector } = await dependencies.embed(buildEmbeddingInput(entry));
    records.push(buildFaqEmbeddingRecord(entry, vector));
  }

  if (records.length > 0) {
    await dependencies.upsertAll(records);
  }

  const result = { processedCount: entries.length };
  logger.info(result, 'Knowledge-base rebuild complete');
  return result;
}

export async function upsertSingleFaqEntry(
  entry: KnowledgeBaseContentEntry,
): Promise<{ id: string }> {
  const { vector } = await embeddingsService.embed(buildEmbeddingInput(entry));

  await upsertFaqEmbedding(buildFaqEmbeddingRecord(entry, vector));

  const result = { id: entry.id };
  logger.info(result, 'Knowledge-base FAQ upserted');
  return result;
}
