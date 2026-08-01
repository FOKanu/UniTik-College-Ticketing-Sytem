export const EMBEDDING_DIMENSIONS = 1536;

export class EmbeddingValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EmbeddingValidationError';
  }
}

export function validateEmbeddingVector(value: unknown): number[] {
  if (!Array.isArray(value)) {
    throw new EmbeddingValidationError('Embedding must be an array.');
  }

  if (value.length !== EMBEDDING_DIMENSIONS) {
    throw new EmbeddingValidationError(
      `Embedding must contain exactly ${EMBEDDING_DIMENSIONS} values.`,
    );
  }

  for (const element of value) {
    if (typeof element !== 'number') {
      throw new EmbeddingValidationError('Embedding values must be numbers.');
    }
    if (!Number.isFinite(element)) {
      throw new EmbeddingValidationError('Embedding values must be finite.');
    }
  }

  return value;
}
