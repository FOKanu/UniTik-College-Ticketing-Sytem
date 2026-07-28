// Centralized environment variable loading + validation.
// TODO: expand schema as new env vars are introduced by modules; fail fast on missing required vars.

import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.string().default('4000'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  JWT_SECRET: z.string().min(1, 'JWT_SECRET is required'),
  JWT_EXPIRES_IN: z.string().default('1d'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  // LDAP / SSO — optional until OI-01 is resolved with IT. Do not require these yet.
  LDAP_URL: z.string().optional(),
  LDAP_BIND_DN: z.string().optional(),
  LDAP_BIND_PASSWORD: z.string().optional(),
  // AI provider — optional until a provider is chosen.
  AI_PROVIDER: z.string().optional(),
  AI_API_KEY: z.string().optional(),
  EMBEDDING_SERVICE_URL: z.string().url().default('http://localhost:8001/embed'),
  EMBEDDING_TIMEOUT_MS: z.coerce.number().int().positive().default(10000),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  // eslint-disable-next-line no-console
  console.error('Invalid environment configuration:', parsed.error.flatten().fieldErrors);
  throw new Error('Invalid environment configuration. See logged field errors above.');
}

export const env = {
  ...parsed.data,
  PORT: Number(parsed.data.PORT),
};
