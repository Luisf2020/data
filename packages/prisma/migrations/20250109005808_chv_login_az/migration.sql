-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


-- ALTER TYPE "AgentModelName" ADD VALUE 'o1_mini';
-- ALTER TYPE "AgentModelName" ADD VALUE 'o1_preview';

-- AlterTable
ALTER TABLE "accounts" ADD COLUMN     "ext_expires_in" INTEGER;

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
