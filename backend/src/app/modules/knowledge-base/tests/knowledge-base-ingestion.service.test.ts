jest.mock('../../ai/embeddings/embeddings', () => ({
  EmbeddingsService: jest.fn().mockImplementation(() => ({ embed: jest.fn() })),
}));
jest.mock('../repository/faq-embedding.repository', () => ({
  upsertFaqEmbedding: jest.fn(),
}));
jest.mock('../../../shared/logger/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn() },
}));

import {
  buildContextBlob,
  buildEmbeddingInput,
  rebuildKnowledgeBase,
} from '../service/knowledge-base-ingestion.service';
import {
  KnowledgeBaseContentEntry,
  ParsedKnowledgeBaseDocument,
} from '../types/knowledge-base.types';

const entry = (id = 'faq-it-support-001'): KnowledgeBaseContentEntry => ({
  id,
  department: 'IT Support',
  audience: 'Student',
  language: 'en',
  status: 'synthetic-draft',
  source: 'team-synthetic-data',
  question: 'How do I connect?',
  relatedPhrasings: ['Connect to Wi-Fi', 'Campus network access'],
  keywords: ['wifi', 'network'],
  answer: 'Use the campus network.',
  escalation: 'Contact IT Support if access fails.',
});

const expectedInput = `{
  "id": "faq-it-support-001",
  "department": "IT Support",
  "audience": "Student",
  "language": "en",
  "question": "How do I connect?",
  "relatedPhrasings": [
    "Connect to Wi-Fi",
    "Campus network access"
  ],
  "keywords": [
    "wifi",
    "network"
  ],
  "answer": "Use the campus network.",
  "escalationGuidance": "Contact IT Support if access fails."
}`;

describe('knowledge-base ingestion representation', () => {
  it('builds the exact deterministic retrieval text in canonical array order', () => {
    expect(buildEmbeddingInput(entry())).toBe(expectedInput);
    expect(buildEmbeddingInput(entry())).toBe(buildEmbeddingInput(entry()));
    expect(JSON.parse(buildEmbeddingInput(entry())).audience).toBe('Student');
  });

  it('uses the deterministic retrieval text as contextBlob', () => {
    expect(buildContextBlob(entry())).toBe(expectedInput);
  });
});

describe('rebuildKnowledgeBase', () => {
  function dependencies(entries: KnowledgeBaseContentEntry[]) {
    const documents = [] as ParsedKnowledgeBaseDocument[];
    return {
      loadCorpus: jest.fn().mockReturnValue(documents),
      validateCorpus: jest.fn().mockReturnValue(entries),
      embed: jest.fn().mockResolvedValue({ vector: [0.1, 0.2] }),
      upsert: jest.fn().mockResolvedValue(undefined),
    };
  }

  it('processes every validated entry and returns the processed count', async () => {
    const entries = [entry(), entry('faq-it-support-002')];
    const deps = dependencies(entries);

    await expect(rebuildKnowledgeBase(deps)).resolves.toEqual({ processedCount: 2 });
    expect(deps.embed).toHaveBeenNthCalledWith(1, expectedInput);
    expect(deps.embed).toHaveBeenNthCalledWith(
      2,
      buildEmbeddingInput(entries[1]),
    );
    expect(deps.upsert).toHaveBeenNthCalledWith(1, {
      id: entries[0].id,
      question: entries[0].question,
      answer: entries[0].answer,
      category: entries[0].department,
      language: entries[0].language,
      contextBlob: expectedInput,
      embedding: [0.1, 0.2],
    });
    expect(JSON.parse(deps.upsert.mock.calls[0][0].contextBlob).audience).toBe(
      'Student',
    );
    expect(deps.upsert).toHaveBeenCalledTimes(2);
  });

  it('returns zero without invoking the provider or repository for empty validated input', async () => {
    const deps = dependencies([]);
    await expect(rebuildKnowledgeBase(deps)).resolves.toEqual({ processedCount: 0 });
    expect(deps.embed).not.toHaveBeenCalled();
    expect(deps.upsert).not.toHaveBeenCalled();
  });

  it('propagates provider failure without reporting success', async () => {
    const deps = dependencies([entry()]);
    deps.embed.mockRejectedValueOnce(new Error('Embedding request timed out.'));
    await expect(rebuildKnowledgeBase(deps)).rejects.toThrow(
      'Embedding request timed out.',
    );
    expect(deps.upsert).not.toHaveBeenCalled();
  });
});
