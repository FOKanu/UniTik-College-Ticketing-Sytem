import { logger } from '../../../shared/logger/logger';
import { rebuildKnowledgeBase } from '../service/knowledge-base-ingestion.service';

export async function runKnowledgeBaseRebuild(): Promise<void> {
  try {
    const result = await rebuildKnowledgeBase();
    logger.info(result, 'Knowledge-base rebuild command completed');
    process.exitCode = 0;
  } catch (error) {
    logger.error(
      { errorType: error instanceof Error ? error.name : 'UnknownError' },
      'Knowledge-base rebuild command failed',
    );
    process.exitCode = 1;
  }
}

if (require.main === module) {
  void runKnowledgeBaseRebuild();
}
