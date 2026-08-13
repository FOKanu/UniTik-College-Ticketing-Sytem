// Single Prisma client instance, shared across all repositories.
// Only repository/ files should import this — services must depend on repository interfaces instead.

import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();
