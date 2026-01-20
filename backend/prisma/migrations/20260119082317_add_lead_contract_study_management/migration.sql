-- CreateEnum
CREATE TYPE "LeadSource" AS ENUM ('EMAIL', 'PHONE', 'WEBSITE', 'REFERRAL', 'EXHIBITION', 'OTHER');

-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'CONVERTED', 'LOST', 'DORMANT');

-- CreateEnum
CREATE TYPE "ContractStatus" AS ENUM ('NEGOTIATING', 'SIGNED', 'TEST_RECEIVED', 'IN_PROGRESS', 'COMPLETED', 'TERMINATED');

-- CreateEnum
CREATE TYPE "StudyStatus" AS ENUM ('REGISTERED', 'PREPARING', 'IN_PROGRESS', 'ANALYSIS', 'REPORT_DRAFT', 'REPORT_REVIEW', 'COMPLETED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "CustomerGrade" AS ENUM ('LEAD', 'PROSPECT', 'CUSTOMER', 'VIP', 'INACTIVE');

-- AlterTable
ALTER TABLE "Customer" ADD COLUMN     "grade" "CustomerGrade" NOT NULL DEFAULT 'PROSPECT';

-- AlterTable
ALTER TABLE "Quotation" ADD COLUMN     "leadId" TEXT,
ADD COLUMN     "parentId" TEXT,
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 1;

-- CreateTable
CREATE TABLE "PipelineStage" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "color" TEXT,
    "description" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PipelineStage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StageTask" (
    "id" TEXT NOT NULL,
    "stageId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "isRequired" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StageTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lead" (
    "id" TEXT NOT NULL,
    "leadNumber" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "contactName" TEXT NOT NULL,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "department" TEXT,
    "position" TEXT,
    "source" "LeadSource" NOT NULL DEFAULT 'OTHER',
    "inquiryType" "QuotationType",
    "inquiryDetail" TEXT,
    "expectedAmount" DECIMAL(15,2),
    "expectedDate" TIMESTAMP(3),
    "stageId" TEXT NOT NULL,
    "status" "LeadStatus" NOT NULL DEFAULT 'NEW',
    "customerId" TEXT,
    "convertedAt" TIMESTAMP(3),
    "lostReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadActivity" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "contactedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "nextAction" TEXT,
    "nextDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeadActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadTaskCompletion" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "completedBy" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,

    CONSTRAINT "LeadTaskCompletion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contract" (
    "id" TEXT NOT NULL,
    "contractNumber" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "contractType" "QuotationType" NOT NULL,
    "totalAmount" DECIMAL(15,2) NOT NULL,
    "paidAmount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "signedDate" TIMESTAMP(3),
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "status" "ContractStatus" NOT NULL DEFAULT 'NEGOTIATING',
    "terms" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Contract_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContractAmendment" (
    "id" TEXT NOT NULL,
    "amendmentNumber" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "changes" JSONB NOT NULL,
    "amountChange" DECIMAL(15,2),
    "newTotalAmount" DECIMAL(15,2) NOT NULL,
    "newEndDate" TIMESTAMP(3),
    "signedDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContractAmendment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Study" (
    "id" TEXT NOT NULL,
    "studyNumber" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "studyType" "QuotationType" NOT NULL,
    "testName" TEXT NOT NULL,
    "testItemId" TEXT,
    "receivedDate" TIMESTAMP(3),
    "startDate" TIMESTAMP(3),
    "expectedEndDate" TIMESTAMP(3),
    "actualEndDate" TIMESTAMP(3),
    "status" "StudyStatus" NOT NULL DEFAULT 'REGISTERED',
    "reportDraftDate" TIMESTAMP(3),
    "reportFinalDate" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Study_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConsultationRecord" (
    "id" TEXT NOT NULL,
    "recordNumber" TEXT NOT NULL,
    "contractId" TEXT,
    "customerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "customerInfo" JSONB NOT NULL,
    "testInfo" JSONB,
    "substanceInfo" JSONB,
    "substanceName" TEXT,
    "storageStatus" TEXT,
    "storageLocation" TEXT,
    "clientRequests" TEXT,
    "internalNotes" TEXT,
    "consultDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "ConsultationRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_QuotationContracts" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "PipelineStage_code_key" ON "PipelineStage"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Lead_leadNumber_key" ON "Lead"("leadNumber");

-- CreateIndex
CREATE UNIQUE INDEX "LeadTaskCompletion_leadId_taskId_key" ON "LeadTaskCompletion"("leadId", "taskId");

-- CreateIndex
CREATE UNIQUE INDEX "Contract_contractNumber_key" ON "Contract"("contractNumber");

-- CreateIndex
CREATE UNIQUE INDEX "ContractAmendment_amendmentNumber_key" ON "ContractAmendment"("amendmentNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Study_studyNumber_key" ON "Study"("studyNumber");

-- CreateIndex
CREATE UNIQUE INDEX "ConsultationRecord_recordNumber_key" ON "ConsultationRecord"("recordNumber");

-- CreateIndex
CREATE UNIQUE INDEX "_QuotationContracts_AB_unique" ON "_QuotationContracts"("A", "B");

-- CreateIndex
CREATE INDEX "_QuotationContracts_B_index" ON "_QuotationContracts"("B");

-- AddForeignKey
ALTER TABLE "StageTask" ADD CONSTRAINT "StageTask_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "PipelineStage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "PipelineStage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadActivity" ADD CONSTRAINT "LeadActivity_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadActivity" ADD CONSTRAINT "LeadActivity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadTaskCompletion" ADD CONSTRAINT "LeadTaskCompletion_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadTaskCompletion" ADD CONSTRAINT "LeadTaskCompletion_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "StageTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quotation" ADD CONSTRAINT "Quotation_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Quotation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quotation" ADD CONSTRAINT "Quotation_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContractAmendment" ADD CONSTRAINT "ContractAmendment_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Study" ADD CONSTRAINT "Study_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsultationRecord" ADD CONSTRAINT "ConsultationRecord_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsultationRecord" ADD CONSTRAINT "ConsultationRecord_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsultationRecord" ADD CONSTRAINT "ConsultationRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_QuotationContracts" ADD CONSTRAINT "_QuotationContracts_A_fkey" FOREIGN KEY ("A") REFERENCES "Contract"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_QuotationContracts" ADD CONSTRAINT "_QuotationContracts_B_fkey" FOREIGN KEY ("B") REFERENCES "Quotation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
