-- AlterTable
ALTER TABLE "agents" ADD COLUMN     "composioConfig" JSONB;

-- CreateTable
CREATE TABLE "TriggerQueue" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TriggerQueue_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TriggerQueue_processed_createdAt_idx" ON "TriggerQueue"("processed", "createdAt");

-- AddForeignKey
ALTER TABLE "TriggerQueue" ADD CONSTRAINT "TriggerQueue_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "agents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
