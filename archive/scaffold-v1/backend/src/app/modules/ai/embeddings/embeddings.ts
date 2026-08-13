// TODO: implement real embedding generation for the FAQ/knowledge-base context engine (NFR-2.7.3).

import { EmbeddingResult } from '../types/ai.types';

export class EmbeddingsService {
  async embed(_text: string): Promise<EmbeddingResult> {
    return { vector: [] };
  }
}
