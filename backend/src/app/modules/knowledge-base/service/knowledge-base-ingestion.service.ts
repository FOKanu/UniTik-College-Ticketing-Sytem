import { join } from 'path';
import {
  loadKnowledgeBaseCorpus,
  validateKnowledgeBaseCorpus,
} from './knowledge-base-content.parser';
import { KnowledgeBaseContentEntry } from '../types/knowledge-base.types';
import { EmbeddingsService } from '../../ai/embeddings/embeddings';
import { upsertFaqEmbedding } from '../repository/faq-embedding.repository';

const CONTENT_DIRECTORY = join(__dirname, '..', 'content');
const embeddingsService = new EmbeddingsService();

function buildEmbeddingInput(entry: KnowledgeBaseContentEntry): string {
  return [entry.question, ...entry.relatedPhrasings, entry.answer].join('\n');
}

export async function rebuildKnowledgeBase(): Promise<void> {
  console.log('Rebuilding knowledge base from canonical corpus...');

  const documents = loadKnowledgeBaseCorpus(CONTENT_DIRECTORY);
  const entries = validateKnowledgeBaseCorpus(documents);

  for (const entry of entries) {
    const { vector } = await embeddingsService.embed(buildEmbeddingInput(entry));

    await upsertFaqEmbedding({
      id: entry.id,
      question: entry.question,
      answer: entry.answer,
      category: entry.department,
      language: entry.language,
      contextBlob: entry.escalation,
      embedding: vector,
    });
  }

  console.log(`Rebuild complete: ${entries.length} entries upserted.`);
}

export async function upsertSingleFaqEntry(entry: KnowledgeBaseContentEntry): Promise<void> {
  const { vector } = await embeddingsService.embed(buildEmbeddingInput(entry));

  await upsertFaqEmbedding({
    id: entry.id,
    question: entry.question,
    answer: entry.answer,
    category: entry.department,
    language: entry.language,
    contextBlob: entry.escalation,
    embedding: vector,
  });

  console.log(`Upserted FAQ: ${entry.id}`);
}
