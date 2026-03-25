-- CreateEnum
CREATE TYPE "StudyDocumentType" AS ENUM ('DISCUSSION', 'PROTOCOL', 'AMENDMENT', 'SUSPENSION_RECORD', 'SUSPENSION_REPORT', 'FINAL_REPORT');

-- CreateEnum
CREATE TYPE "DocumentVersion" AS ENUM ('FIRST_DRAFT', 'SECOND_DRAFT', 'THIRD_DRAFT', 'DRAFT_FINAL', 'FINAL', 'N_A');

-- AlterEnum
ALTER TYPE "StudyStatus" ADD VALUE 'ON_HOLD';

-- AlterTable
ALTER TABLE "Study" ADD COLUMN     "projectCode" TEXT,
ADD COLUMN     "sponsor" TEXT,
ADD COLUMN     "studyDirector" TEXT,
ADD COLUMN     "substanceCode" TEXT,
ADD COLUMN     "testSubstance" TEXT,
ADD COLUMN     "userId" TEXT;

-- CreateTable
CREATE TABLE "StudyDocument" (
    "id" TEXT NOT NULL,
    "studyId" TEXT NOT NULL,
    "documentType" "StudyDocumentType" NOT NULL,
    "version" "DocumentVersion" NOT NULL,
    "sentYear" INTEGER NOT NULL,
    "sentMonth" INTEGER NOT NULL,
    "sentDate" TIMESTAMP(3),
    "comment" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudyDocument_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StudyDocument_studyId_sentYear_sentMonth_idx" ON "StudyDocument"("studyId", "sentYear", "sentMonth");

-- CreateIndex
CREATE INDEX "StudyDocument_studyId_documentType_idx" ON "StudyDocument"("studyId", "documentType");

-- CreateIndex
CREATE INDEX "Study_contractId_idx" ON "Study"("contractId");

-- CreateIndex
CREATE INDEX "Study_userId_idx" ON "Study"("userId");

-- CreateIndex
CREATE INDEX "Study_studyNumber_idx" ON "Study"("studyNumber");

-- AddForeignKey
ALTER TABLE "Study" ADD CONSTRAINT "Study_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudyDocument" ADD CONSTRAINT "StudyDocument_studyId_fkey" FOREIGN KEY ("studyId") REFERENCES "Study"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudyDocument" ADD CONSTRAINT "StudyDocument_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
