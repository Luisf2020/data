-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AgentModelName" ADD VALUE 'gemini_1_5_flash';
ALTER TYPE "AgentModelName" ADD VALUE 'gemini_2_0_flash';
ALTER TYPE "AgentModelName" ADD VALUE 'gemini_2_0_flash_thinking';
ALTER TYPE "AgentModelName" ADD VALUE 'gemini_2_0_flash_thinking_app';
