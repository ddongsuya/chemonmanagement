-- AlterTable
ALTER TABLE "TestReception" ADD COLUMN     "projectAttachments" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "projectStage" TEXT NOT NULL DEFAULT 'PLAN_DELIVERY',
ADD COLUMN     "projectStageHistory" JSONB NOT NULL DEFAULT '[]';
