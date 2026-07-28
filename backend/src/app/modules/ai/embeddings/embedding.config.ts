import { env } from '../../../config';
import { EMBEDDING_DIMENSIONS } from './embedding-vector.validator';

export interface EmbeddingConfig {
  readonly endpoint: string;
  readonly dimensions: number;
  readonly timeoutMs: number;
}

export const EMBEDDING_CONFIG: EmbeddingConfig = {
  endpoint: env.EMBEDDING_SERVICE_URL,
  dimensions: EMBEDDING_DIMENSIONS,
  timeoutMs: env.EMBEDDING_TIMEOUT_MS,
};
