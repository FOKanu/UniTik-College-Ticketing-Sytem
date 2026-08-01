import { createApp } from './app/app';
import { env } from './app/config/env';
import { logger } from './app/shared/logger/logger';

const app = createApp();

app.listen(env.PORT, () => {
  logger.info(`Backend listening on port ${env.PORT} (${env.NODE_ENV})`);
});
