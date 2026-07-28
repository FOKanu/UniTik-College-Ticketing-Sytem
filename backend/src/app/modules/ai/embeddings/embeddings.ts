import { EmbeddingResult } from '../types/ai.types';
import { EMBEDDING_CONFIG } from './embedding.config';
import { validateEmbeddingVector } from './embedding-vector.validator';

function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === 'AbortError';
}

export class EmbeddingsService {
  async embed(text: string): Promise<EmbeddingResult> {
    const controller = new AbortController();
    let timedOut = false;
    const timeout = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, EMBEDDING_CONFIG.timeoutMs);

    try {
      let response: Response;
      try {
        response = await fetch(EMBEDDING_CONFIG.endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ input: text }),
          signal: controller.signal,
        });
      } catch (error) {
        if (timedOut) {
          throw new Error('Embedding request timed out.', { cause: error });
        }
        if (isAbortError(error)) {
          throw new Error('Embedding request was aborted.', { cause: error });
        }
        throw new Error('Embedding service request failed.', { cause: error });
      }

      if (!response.ok) {
        throw new Error(`Embedding service returned HTTP ${response.status}.`);
      }

      let data: unknown;
      try {
        data = await response.json();
      } catch (error) {
        if (timedOut) {
          throw new Error('Embedding request timed out.', { cause: error });
        }
        if (isAbortError(error)) {
          throw new Error('Embedding request was aborted.', { cause: error });
        }
        throw new Error('Embedding service returned invalid JSON.', { cause: error });
      }

      if (typeof data !== 'object' || data === null || Array.isArray(data)) {
        throw new Error('Embedding service returned an invalid response structure.');
      }
      if (!Object.prototype.hasOwnProperty.call(data, 'embedding')) {
        throw new Error('Embedding service response is missing the embedding property.');
      }

      return {
        vector: validateEmbeddingVector((data as Record<string, unknown>).embedding),
      };
    } finally {
      clearTimeout(timeout);
    }
  }
}
