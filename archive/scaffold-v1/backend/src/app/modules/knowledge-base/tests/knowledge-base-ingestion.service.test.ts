jest.mock('../../ai/embeddings/embeddings', () => ({
  EmbeddingsService: jest.fn().mockImplementation(() => ({ embed: jest.fn() })),
}));
jest.mock('../repository/faq-embedding.repository', () => ({
  upsertFaqEmbedding: jest.fn(),
  upsertFaqEmbeddingsAtomically: jest.fn(),
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
import { logger } from '../../../shared/logger/logger';

const mockedLogger = logger as unknown as { info: jest.Mock };

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
      upsertAll: jest.fn().mockResolvedValue(undefined),
    };
  }

  beforeEach(() => {
    mockedLogger.info.mockReset();
  });

  it('prepares every embedding before one ordered atomic write', async () => {
    const entries = [entry(), entry('faq-it-support-002')];
    const deps = dependencies(entries);
    deps.upsertAll.mockImplementation(async () => {
      expect(deps.embed).toHaveBeenCalledTimes(2);
    });

    await expect(rebuildKnowledgeBase(deps)).resolves.toEqual({ processedCount: 2 });
    expect(deps.embed).toHaveBeenNthCalledWith(1, expectedInput);
    expect(deps.embed).toHaveBeenNthCalledWith(
      2,
      buildEmbeddingInput(entries[1]),
    );
    expect(deps.upsertAll).toHaveBeenCalledTimes(1);
    expect(deps.upsertAll).toHaveBeenCalledWith([
      {
        id: entries[0].id,
        question: entries[0].question,
        answer: entries[0].answer,
        category: entries[0].department,
        language: entries[0].language,
        contextBlob: expectedInput,
        embedding: [0.1, 0.2],
      },
      {
        id: entries[1].id,
        question: entries[1].question,
        answer: entries[1].answer,
        category: entries[1].department,
        language: entries[1].language,
        contextBlob: buildContextBlob(entries[1]),
        embedding: [0.1, 0.2],
      },
    ]);
    expect(
      JSON.parse(deps.upsertAll.mock.calls[0][0][0].contextBlob).audience,
    ).toBe('Student');
  });

  it('returns zero without invoking the provider or atomic repository', async () => {
    const deps = dependencies([]);
    await expect(rebuildKnowledgeBase(deps)).resolves.toEqual({ processedCount: 0 });
    expect(deps.embed).not.toHaveBeenCalled();
    expect(deps.upsertAll).not.toHaveBeenCalled();
  });

  it('makes no repository call when the first embedding fails', async () => {
    const deps = dependencies([entry()]);
    deps.embed.mockRejectedValueOnce(new Error('Embedding request timed out.'));
    await expect(rebuildKnowledgeBase(deps)).rejects.toThrow(
      'Embedding request timed out.',
    );
    expect(deps.upsertAll).not.toHaveBeenCalled();
    expect(mockedLogger.info).not.toHaveBeenCalledWith(
      expect.anything(),
      'Knowledge-base rebuild complete',
    );
  });

  it('makes no repository call when a middle embedding fails', async () => {
    const entries = [
      entry(),
      entry('faq-it-support-002'),
      entry('faq-it-support-003'),
    ];
    const deps = dependencies(entries);
    deps.embed
      .mockResolvedValueOnce({ vector: [0.1] })
      .mockRejectedValueOnce(new Error('provider failed'));

    await expect(rebuildKnowledgeBase(deps)).rejects.toThrow('provider failed');
    expect(deps.embed).toHaveBeenCalledTimes(2);
    expect(deps.upsertAll).not.toHaveBeenCalled();
  });

  it('propagates an atomic repository failure without logging success', async () => {
    const deps = dependencies([entry()]);
    deps.upsertAll.mockRejectedValueOnce(new Error('database transaction failed'));

    await expect(rebuildKnowledgeBase(deps)).rejects.toThrow(
      'database transaction failed',
    );
    expect(deps.upsertAll).toHaveBeenCalledTimes(1);
    expect(mockedLogger.info).not.toHaveBeenCalledWith(
      expect.anything(),
      'Knowledge-base rebuild complete',
    );
  });

  it('does not resolve or log success until the atomic write completes', async () => {
    const deps = dependencies([entry()]);
    let resolveAtomicWrite: (() => void) | undefined;
    deps.upsertAll.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveAtomicWrite = resolve;
        }),
    );

    let settled = false;
    const rebuild = rebuildKnowledgeBase(deps).finally(() => {
      settled = true;
    });
    await Promise.resolve();
    await Promise.resolve();

    expect(settled).toBe(false);
    expect(mockedLogger.info).not.toHaveBeenCalledWith(
      expect.anything(),
      'Knowledge-base rebuild complete',
    );

    resolveAtomicWrite?.();
    await expect(rebuild).resolves.toEqual({ processedCount: 1 });
    expect(mockedLogger.info).toHaveBeenCalledWith(
      { processedCount: 1 },
      'Knowledge-base rebuild complete',
    );
  });
});
