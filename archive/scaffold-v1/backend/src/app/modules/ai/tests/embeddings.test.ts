jest.mock('../embeddings/embedding.config', () => ({
  EMBEDDING_CONFIG: {
    endpoint: 'http://embedding.test/embed',
    dimensions: 1536,
    timeoutMs: 100,
  },
}));

import { EmbeddingsService } from '../embeddings/embeddings';

const validVector = (): number[] => Array.from({ length: 1536 }, (_, index) => index / 1536);

function response(body: unknown, options: { ok?: boolean; status?: number } = {}): Response {
  return {
    ok: options.ok ?? true,
    status: options.status ?? 200,
    json: jest.fn().mockResolvedValue(body),
  } as unknown as Response;
}

describe('EmbeddingsService', () => {
  const service = new EmbeddingsService();

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('returns a valid 1536-dimensional embedding', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue(response({ embedding: validVector() }));
    await expect(service.embed('question')).resolves.toEqual({ vector: validVector() });
  });

  it('rejects a missing embedding property', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue(response({}));
    await expect(service.embed('question')).rejects.toThrow(
      'Embedding service response is missing the embedding property.',
    );
  });

  it.each([
    ['null', null],
    ['an array', []],
  ])('rejects %s as an invalid top-level response structure', async (_name, body) => {
    jest.spyOn(global, 'fetch').mockResolvedValue(response(body));
    await expect(service.embed('question')).rejects.toThrow(
      'Embedding service returned an invalid response structure.',
    );
  });

  it.each([
    ['null embedding', null, 'Embedding must be an array.'],
    ['non-array embedding', {}, 'Embedding must be an array.'],
    ['incorrect dimension', Array(384).fill(0), 'exactly 1536'],
  ])('rejects %s', async (_name, embedding, expected) => {
    jest.spyOn(global, 'fetch').mockResolvedValue(response({ embedding }));
    await expect(service.embed('question')).rejects.toThrow(expected);
  });

  it('rejects malformed JSON', async () => {
    const invalidJsonResponse = response({});
    jest
      .mocked(invalidJsonResponse.json)
      .mockRejectedValueOnce(new SyntaxError('Unexpected token'));
    jest.spyOn(global, 'fetch').mockResolvedValue(invalidJsonResponse);
    await expect(service.embed('question')).rejects.toThrow(
      'Embedding service returned invalid JSON.',
    );
  });

  it('rejects non-2xx responses without reading the body', async () => {
    const failedResponse = response({ secret: 'not-read' }, { ok: false, status: 503 });
    jest.spyOn(global, 'fetch').mockResolvedValue(failedResponse);
    await expect(service.embed('question')).rejects.toThrow(
      'Embedding service returned HTTP 503.',
    );
    expect(failedResponse.json).not.toHaveBeenCalled();
  });

  it('wraps network failures with a stable error', async () => {
    jest.spyOn(global, 'fetch').mockRejectedValue(new TypeError('connection details'));
    await expect(service.embed('question')).rejects.toThrow(
      'Embedding service request failed.',
    );
  });

  it('distinguishes an aborted request', async () => {
    const abortError = new Error('native abort details');
    abortError.name = 'AbortError';
    jest.spyOn(global, 'fetch').mockRejectedValue(abortError);
    await expect(service.embed('question')).rejects.toThrow(
      'Embedding request was aborted.',
    );
  });

  it('times out and aborts a pending request', async () => {
    jest.useFakeTimers();
    jest.spyOn(global, 'fetch').mockImplementation((_input, init) => {
      return new Promise((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => {
          const error = new Error('native abort details');
          error.name = 'AbortError';
          reject(error);
        });
      });
    });

    const result = service.embed('question');
    const rejection = expect(result).rejects.toThrow('Embedding request timed out.');
    await jest.advanceTimersByTimeAsync(100);
    await rejection;
  });

  it('classifies an abort while reading the response body as a timeout', async () => {
    jest.useFakeTimers();
    jest.spyOn(global, 'fetch').mockImplementation((_input, init) => {
      const bodyResponse = {
        ok: true,
        status: 200,
        json: jest.fn(
          () =>
          new Promise((_resolve, reject) => {
            init?.signal?.addEventListener('abort', () => {
              const error = new Error('native abort details');
              error.name = 'AbortError';
              reject(error);
            });
          }),
        ),
      } as unknown as Response;
      return Promise.resolve(bodyResponse);
    });

    const result = service.embed('question');
    const rejection = expect(result).rejects.toThrow('Embedding request timed out.');
    await jest.advanceTimersByTimeAsync(100);
    await rejection;
  });

  it.each([
    ['a non-finite element', Number.NaN, 'Embedding values must be finite.'],
    ['a string-valued element', '0', 'Embedding values must be numbers.'],
  ])('rejects %s', async (_name, invalidValue, expected) => {
    const embedding: unknown[] = validVector();
    embedding[0] = invalidValue;
    jest.spyOn(global, 'fetch').mockResolvedValue(response({ embedding }));
    await expect(service.embed('question')).rejects.toThrow(expected);
  });
});
