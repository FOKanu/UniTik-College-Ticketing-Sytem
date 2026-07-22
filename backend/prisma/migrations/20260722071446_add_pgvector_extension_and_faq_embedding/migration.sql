-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "vector";

-- AlterTable
ALTER TABLE "FaqEntry" ADD COLUMN     "embedding" vector(1536);
