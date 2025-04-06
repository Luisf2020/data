/*
  Warnings:

  - You are about to drop the `TriggerQueue` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "TriggerQueue" DROP CONSTRAINT "TriggerQueue_agentId_fkey";

-- DropTable
DROP TABLE "TriggerQueue";
