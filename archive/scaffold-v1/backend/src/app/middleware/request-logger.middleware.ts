import pinoHttp from 'pino-http';
import { logger } from '../shared/logger/logger';

export const requestLogger = pinoHttp({ logger });
