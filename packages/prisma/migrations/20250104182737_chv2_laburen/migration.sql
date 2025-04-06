-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


-- ALTER TYPE "AgentModelName" ADD VALUE 'o1_mini';
-- ALTER TYPE "AgentModelName" ADD VALUE 'o1_preview';
ALTER TYPE "AgentModelName" ADD VALUE 'claude_3_5_sonnet';
ALTER TYPE "AgentModelName" ADD VALUE 'claude_3_5_v2_sonnet';
ALTER TYPE "AgentModelName" ADD VALUE 'claude_3_5_v2_haiku';
ALTER TYPE "AgentModelName" ADD VALUE 'mixtral_small';
ALTER TYPE "AgentModelName" ADD VALUE 'mixtral_large';
ALTER TYPE "AgentModelName" ADD VALUE 'command_r_plus';
ALTER TYPE "AgentModelName" ADD VALUE 'llama_3_1_70b';
ALTER TYPE "AgentModelName" ADD VALUE 'llama_3_2_11b';
ALTER TYPE "AgentModelName" ADD VALUE 'llama_3_2_90b';
ALTER TYPE "AgentModelName" ADD VALUE 'llama_3_2_1b';
ALTER TYPE "AgentModelName" ADD VALUE 'llama_3_2_3b';
ALTER TYPE "AgentModelName" ADD VALUE 'llama_3_8b';

-- AlterEnum
ALTER TYPE "ConversationChannel" ADD VALUE 'meta';

-- AlterEnum
ALTER TYPE "ServiceProviderType" ADD VALUE 'meta';

-- AlterTable
ALTER TABLE "contacts" ADD COLUMN     "instagram_id" TEXT;

-- CreateTable
-- CREATE TABLE "crm_chatsappai_tokens" (
--     "id" TEXT NOT NULL,
--     "organization_id" TEXT NOT NULL,
--     "token" TEXT NOT NULL,
--     "tokenAgentBot" TEXT NOT NULL,
--     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
--     "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

--     CONSTRAINT "crm_chatsappai_tokens_pkey" PRIMARY KEY ("id")
-- );

-- CreateIndex
-- CREATE UNIQUE INDEX "crm_chatsappai_tokens_token_key" ON "crm_chatsappai_tokens"("token");

-- AddForeignKey
-- ALTER TABLE "crm_chatsappai_tokens" ADD CONSTRAINT "crm_chatsappai_tokens_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
