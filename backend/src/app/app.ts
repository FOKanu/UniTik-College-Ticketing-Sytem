// Express application factory. Wires up global middleware, mounts module routes, and registers
// the global error handler last. No business logic lives here.

import cors from 'cors';
import express, { Express } from 'express';
import helmet from 'helmet';
import { env } from './config/env';
import { appConfig } from './config/app.config';
import { errorHandler } from './middleware/error-handler.middleware';
import { notFoundHandler } from './middleware/not-found.middleware';
import { requestLogger } from './middleware/request-logger.middleware';
import { moduleRoutes } from './modules/routes';

export const createApp = (): Express => {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
  app.use(express.json());
  app.use(requestLogger);

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'university-ticketing-backend' });
  });

  app.use(appConfig.apiPrefix, moduleRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
