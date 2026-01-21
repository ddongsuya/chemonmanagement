-- CreateEnum
CREATE TYPE "SampleType" AS ENUM ('WHOLE_BLOOD', 'SERUM', 'PLASMA', 'URINE');

-- CreateEnum
CREATE TYPE "ClinicalTestCategory" AS ENUM ('CBC', 'DIFF', 'RETIC', 'CHEMISTRY_GENERAL', 'ELECTROLYTE', 'CHEMISTRY_ADDITIONAL', 'COAGULATION', 'URINALYSIS', 'URINE_CHEMISTRY');

-- CreateEnum
CREATE TYPE "ClinicalQuotationStatus" AS ENUM ('DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'EXPIRED', 'CONVERTED');

-- CreateEnum
CREATE TYPE "ClinicalTestRequestStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'RECEIVED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ClinicalReportType" AS ENUM ('SUMMARY', 'FULL', 'FULL_WITH_STAT');

-- CreateEnum
CREATE TYPE "SampleDisposal" AS ENUM ('RETURN', 'DISPOSE');

-- CreateTable
CREATE TABLE "ClinicalTestItem" (
    "id" TEXT NOT NULL,
    "category" "ClinicalTestCategory" NOT NULL,
    "code" TEXT NOT NULL,
    "nameKr" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "unit" TEXT,
    "method" TEXT,
    "unitPrice" INTEGER NOT NULL,
    "isPackage" BOOLEAN NOT NULL DEFAULT false,
    "packageItems" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "requiredSampleTypes" "SampleType"[] DEFAULT ARRAY[]::"SampleType"[],
    "minSampleVolume" INTEGER,
    "requiresItem" TEXT,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClinicalTestItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClinicalQcSetting" (
    "id" TEXT NOT NULL,
    "category" "ClinicalTestCategory" NOT NULL,
    "thresholdCount" INTEGER NOT NULL DEFAULT 100,
    "qcFee" INTEGER NOT NULL DEFAULT 400000,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClinicalQcSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClinicalQuotation" (
    "id" TEXT NOT NULL,
    "quotationNumber" TEXT NOT NULL,
    "customerId" TEXT,
    "customerName" TEXT NOT NULL,
    "contactPersonId" TEXT,
    "contactName" TEXT NOT NULL,
    "contactPhone" TEXT,
    "contactEmail" TEXT,
    "testStandard" TEXT NOT NULL DEFAULT 'NON_GLP',
    "animalSpecies" TEXT NOT NULL,
    "sampleTypes" "SampleType"[],
    "totalSamples" INTEGER NOT NULL,
    "maleSamples" INTEGER NOT NULL DEFAULT 0,
    "femaleSamples" INTEGER NOT NULL DEFAULT 0,
    "subtotal" INTEGER NOT NULL DEFAULT 0,
    "qcFees" JSONB,
    "totalQcFee" INTEGER NOT NULL DEFAULT 0,
    "discountType" TEXT,
    "discountValue" DOUBLE PRECISION,
    "discountAmount" INTEGER NOT NULL DEFAULT 0,
    "discountReason" TEXT,
    "totalBeforeVat" INTEGER NOT NULL DEFAULT 0,
    "vatRate" DOUBLE PRECISION NOT NULL DEFAULT 10,
    "vatAmount" INTEGER NOT NULL DEFAULT 0,
    "totalAmount" INTEGER NOT NULL DEFAULT 0,
    "validDays" INTEGER NOT NULL DEFAULT 60,
    "validUntil" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "status" "ClinicalQuotationStatus" NOT NULL DEFAULT 'DRAFT',
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "sentAt" TIMESTAMP(3),
    "acceptedAt" TIMESTAMP(3),

    CONSTRAINT "ClinicalQuotation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClinicalQuotationItem" (
    "id" TEXT NOT NULL,
    "quotationId" TEXT NOT NULL,
    "testItemId" TEXT NOT NULL,
    "category" "ClinicalTestCategory" NOT NULL,
    "code" TEXT NOT NULL,
    "nameKr" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "unit" TEXT,
    "method" TEXT,
    "isPackage" BOOLEAN NOT NULL DEFAULT false,
    "unitPrice" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "amount" INTEGER NOT NULL,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClinicalQuotationItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClinicalTestRequest" (
    "id" TEXT NOT NULL,
    "testNumber" TEXT,
    "quotationId" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "contactName" TEXT NOT NULL,
    "contactPhone" TEXT,
    "contactEmail" TEXT,
    "address" TEXT,
    "postalCode" TEXT,
    "fax" TEXT,
    "requestDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "desiredCompletionDate" TIMESTAMP(3),
    "reportType" "ClinicalReportType" NOT NULL DEFAULT 'FULL',
    "includeStatistics" BOOLEAN NOT NULL DEFAULT false,
    "animalSpecies" TEXT NOT NULL,
    "sampleTypes" "SampleType"[],
    "totalSamples" INTEGER NOT NULL,
    "maleSamples" INTEGER NOT NULL DEFAULT 0,
    "femaleSamples" INTEGER NOT NULL DEFAULT 0,
    "sampleSendDate" TIMESTAMP(3),
    "sampleDisposal" "SampleDisposal" NOT NULL DEFAULT 'DISPOSE',
    "returnAddress" TEXT,
    "testDescription" TEXT,
    "receivedDate" TIMESTAMP(3),
    "testDirectorId" TEXT,
    "receiverId" TEXT,
    "operationManagerId" TEXT,
    "approvalDate" TIMESTAMP(3),
    "status" "ClinicalTestRequestStatus" NOT NULL DEFAULT 'DRAFT',
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "submittedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "ClinicalTestRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClinicalTestRequestItem" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "testItemId" TEXT NOT NULL,
    "category" "ClinicalTestCategory" NOT NULL,
    "code" TEXT NOT NULL,
    "nameKr" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "isSelected" BOOLEAN NOT NULL DEFAULT true,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClinicalTestRequestItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ClinicalTestItem_code_key" ON "ClinicalTestItem"("code");

-- CreateIndex
CREATE INDEX "ClinicalTestItem_category_isActive_idx" ON "ClinicalTestItem"("category", "isActive");

-- CreateIndex
CREATE INDEX "ClinicalTestItem_code_idx" ON "ClinicalTestItem"("code");

-- CreateIndex
CREATE UNIQUE INDEX "ClinicalQcSetting_category_key" ON "ClinicalQcSetting"("category");

-- CreateIndex
CREATE UNIQUE INDEX "ClinicalQuotation_quotationNumber_key" ON "ClinicalQuotation"("quotationNumber");

-- CreateIndex
CREATE INDEX "ClinicalQuotation_quotationNumber_idx" ON "ClinicalQuotation"("quotationNumber");

-- CreateIndex
CREATE INDEX "ClinicalQuotation_customerId_idx" ON "ClinicalQuotation"("customerId");

-- CreateIndex
CREATE INDEX "ClinicalQuotation_status_idx" ON "ClinicalQuotation"("status");

-- CreateIndex
CREATE INDEX "ClinicalQuotation_createdById_idx" ON "ClinicalQuotation"("createdById");

-- CreateIndex
CREATE INDEX "ClinicalQuotation_createdAt_idx" ON "ClinicalQuotation"("createdAt");

-- CreateIndex
CREATE INDEX "ClinicalQuotationItem_quotationId_idx" ON "ClinicalQuotationItem"("quotationId");

-- CreateIndex
CREATE INDEX "ClinicalQuotationItem_category_idx" ON "ClinicalQuotationItem"("category");

-- CreateIndex
CREATE UNIQUE INDEX "ClinicalTestRequest_testNumber_key" ON "ClinicalTestRequest"("testNumber");

-- CreateIndex
CREATE UNIQUE INDEX "ClinicalTestRequest_quotationId_key" ON "ClinicalTestRequest"("quotationId");

-- CreateIndex
CREATE INDEX "ClinicalTestRequest_testNumber_idx" ON "ClinicalTestRequest"("testNumber");

-- CreateIndex
CREATE INDEX "ClinicalTestRequest_quotationId_idx" ON "ClinicalTestRequest"("quotationId");

-- CreateIndex
CREATE INDEX "ClinicalTestRequest_status_idx" ON "ClinicalTestRequest"("status");

-- CreateIndex
CREATE INDEX "ClinicalTestRequest_createdAt_idx" ON "ClinicalTestRequest"("createdAt");

-- CreateIndex
CREATE INDEX "ClinicalTestRequestItem_requestId_idx" ON "ClinicalTestRequestItem"("requestId");

-- AddForeignKey
ALTER TABLE "ClinicalQuotation" ADD CONSTRAINT "ClinicalQuotation_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicalQuotation" ADD CONSTRAINT "ClinicalQuotation_contactPersonId_fkey" FOREIGN KEY ("contactPersonId") REFERENCES "Requester"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicalQuotation" ADD CONSTRAINT "ClinicalQuotation_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicalQuotationItem" ADD CONSTRAINT "ClinicalQuotationItem_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES "ClinicalQuotation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicalQuotationItem" ADD CONSTRAINT "ClinicalQuotationItem_testItemId_fkey" FOREIGN KEY ("testItemId") REFERENCES "ClinicalTestItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicalTestRequest" ADD CONSTRAINT "ClinicalTestRequest_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES "ClinicalQuotation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicalTestRequest" ADD CONSTRAINT "ClinicalTestRequest_testDirectorId_fkey" FOREIGN KEY ("testDirectorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicalTestRequest" ADD CONSTRAINT "ClinicalTestRequest_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicalTestRequest" ADD CONSTRAINT "ClinicalTestRequest_operationManagerId_fkey" FOREIGN KEY ("operationManagerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicalTestRequest" ADD CONSTRAINT "ClinicalTestRequest_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicalTestRequestItem" ADD CONSTRAINT "ClinicalTestRequestItem_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "ClinicalTestRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicalTestRequestItem" ADD CONSTRAINT "ClinicalTestRequestItem_testItemId_fkey" FOREIGN KEY ("testItemId") REFERENCES "ClinicalTestItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
