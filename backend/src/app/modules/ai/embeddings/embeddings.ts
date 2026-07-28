import { EmbeddingResult } from '../types/ai.types';
import { EMBEDDING_CONFIG } from './embedding.config';

interface EmbeddingServiceResponse {
  embedding: number[];
}

export class EmbeddingsService {
  async embed(text: string): Promise<EmbeddingResult> {
    const response = await fetch(EMBEDDING_CONFIG.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ input: text }),
    });

    if (!response.ok) {
      throw new Error(`Embedding service error: ${response.status} ${response.statusText}`);
    }

    const data = (await response.json()) as EmbeddingServiceResponse;
    const vector = data.embedding;

    if (vector.length !== EMBEDDING_CONFIG.dimensions) {
      throw new Error(
        `Embedding dimension mismatch: expected ${EMBEDDING_CONFIG.dimensions}, got ${vector.length}`
      );
    }

    return { vector };
  }
}
