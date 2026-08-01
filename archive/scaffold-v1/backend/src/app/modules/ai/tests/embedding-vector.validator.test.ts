import {
  EmbeddingValidationError,
  validateEmbeddingVector,
} from '../embeddings/embedding-vector.validator';

const validVector = (): number[] => Array.from({ length: 1536 }, (_, index) => index / 1536);

describe('validateEmbeddingVector', () => {
  it('accepts exactly 1536 finite numbers', () => {
    const vector = validVector();
    expect(validateEmbeddingVector(vector)).toBe(vector);
  });

  it.each([
    ['384 values', Array(384).fill(0)],
    ['an empty array', []],
    ['a short array', Array(1535).fill(0)],
    ['a long array', Array(1537).fill(0)],
  ])('rejects %s', (_name, value) => {
    expect(() => validateEmbeddingVector(value)).toThrow(EmbeddingValidationError);
  });

  it.each([
    ['null', null],
    ['undefined', undefined],
    ['a non-array string', 'not-a-vector'],
  ])('rejects %s', (_name, value) => {
    expect(() => validateEmbeddingVector(value)).toThrow('Embedding must be an array.');
  });

  it.each([
    ['a string element', '0'],
    ['a nested array', [0]],
  ])('rejects %s', (_name, invalidValue) => {
    const vector: unknown[] = validVector();
    vector[10] = invalidValue;
    expect(() => validateEmbeddingVector(vector)).toThrow(
      'Embedding values must be numbers.',
    );
  });

  it.each([
    ['NaN', Number.NaN],
    ['positive Infinity', Number.POSITIVE_INFINITY],
    ['negative Infinity', Number.NEGATIVE_INFINITY],
  ])('rejects %s', (_name, invalidValue) => {
    const vector = validVector();
    vector[10] = invalidValue;
    expect(() => validateEmbeddingVector(vector)).toThrow(
      'Embedding values must be finite.',
    );
  });
});
