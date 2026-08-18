jest.mock('../service/knowledge-base-ingestion.service', () => ({
  rebuildKnowledgeBase: jest.fn(),
}));
jest.mock('../../../shared/logger/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn() },
}));

import { logger } from '../../../shared/logger/logger';
import { runKnowledgeBaseRebuild } from '../scripts/rebuild-knowledge-base';
import { rebuildKnowledgeBase } from '../service/knowledge-base-ingestion.service';

const rebuild = rebuildKnowledgeBase as jest.Mock;
const mockedLogger = logger as unknown as {
  info: jest.Mock;
  error: jest.Mock;
};

describe('runKnowledgeBaseRebuild', () => {
  const originalExitCode = process.exitCode;

  beforeEach(() => {
    rebuild.mockReset();
    mockedLogger.info.mockReset();
    mockedLogger.error.mockReset();
    process.exitCode = undefined;
  });

  afterAll(() => {
    process.exitCode = originalExitCode;
  });

  it('leaves a successful process result and logs only the safe count', async () => {
    rebuild.mockResolvedValue({ processedCount: 75 });
    await runKnowledgeBaseRebuild();
    expect(process.exitCode).toBe(0);
    expect(mockedLogger.info).toHaveBeenCalledWith(
      { processedCount: 75 },
      'Knowledge-base rebuild command completed',
    );
  });

  it('sets a non-zero exit code and logs a safe failure classification', async () => {
    rebuild.mockRejectedValue(
      new Error('secret endpoint and vector must not be logged'),
    );
    await runKnowledgeBaseRebuild();
    expect(process.exitCode).toBe(1);
    expect(mockedLogger.error).toHaveBeenCalledWith(
      { errorType: 'Error' },
      'Knowledge-base rebuild command failed',
    );
    expect(JSON.stringify(mockedLogger.error.mock.calls)).not.toContain('secret');
  });
});
