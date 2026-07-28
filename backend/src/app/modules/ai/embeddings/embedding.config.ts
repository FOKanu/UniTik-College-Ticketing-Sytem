export interface EmbeddingConfig {
  readonly endpoint: string;
  readonly dimensions: number;
}

export const EMBEDDING_CONFIG: EmbeddingConfig = {
  // Local embedding service — actual model/hosting is decided elsewhere.
  endpoint: process.env.EMBEDDING_SERVICE_URL ?? 'http://localhost:8001/embed',
  dimensions: 384, // update once the actual local model's output size is confirmed
};
