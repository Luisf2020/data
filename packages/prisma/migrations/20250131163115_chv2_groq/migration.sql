-- CreateEnum
CREATE TYPE "CompanySize" AS ENUM ('ONLY', 'MICRO', 'SMALL', 'MEDIUM', 'LARGE', 'ENTERPRISE');

-- CreateEnum
CREATE TYPE "OnboardingStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'PENDING_PAYMENT', 'COMPLETED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AgentModelName" ADD VALUE 'llama_3_3_70b';
ALTER TYPE "AgentModelName" ADD VALUE 'llama_3_1_8b_instant';

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "onboardingStatus" "OnboardingStatus" NOT NULL DEFAULT 'NOT_STARTED',
ADD COLUMN     "onboarding_completed_at" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "onboarding_info" (
    "id" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "companySize" "CompanySize" NOT NULL,
    "industry" TEXT NOT NULL,
    "websiteUrl" TEXT,
    "companyLocation" TEXT[],
    "primaryUseCase" TEXT NOT NULL,
    "expectedVolume" INTEGER,
    "requiredLanguages" TEXT[],
    "communicationChannels" TEXT[],
    "acquisitionSource" TEXT,
    "currentTools" TEXT,
    "user_id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "status" "OnboardingStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "completedSteps" TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "onboarding_info_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "onboarding_info_user_id_key" ON "onboarding_info"("user_id");

-- AddForeignKey
ALTER TABLE "onboarding_info" ADD CONSTRAINT "onboarding_info_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "onboarding_info" ADD CONSTRAINT "onboarding_info_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
