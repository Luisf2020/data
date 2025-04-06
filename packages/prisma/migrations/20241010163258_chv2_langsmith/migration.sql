-- AlterEnum
ALTER TYPE "AgentModelName" ADD VALUE 'gpt_4o_mini';

-- AlterTable
ALTER TABLE "agents" ALTER COLUMN "model_name" SET DEFAULT 'gpt_4o';
