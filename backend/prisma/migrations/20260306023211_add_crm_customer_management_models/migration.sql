-- CreateEnum
CREATE TYPE "SegmentType" AS ENUM ('PHARMACEUTICAL', 'COSMETICS', 'HEALTH_FOOD', 'MEDICAL_DEVICE', 'OTHER');

-- CreateEnum
CREATE TYPE "CustomFieldType" AS ENUM ('TEXT', 'NUMBER', 'DATE', 'DROPDOWN', 'CHECKBOX');

-- AlterTable
ALTER TABLE "Customer" ADD COLUMN     "segment" "SegmentType";

-- CreateTable
CREATE TABLE "ToxicityV2Item" (
    "id" TEXT NOT NULL,
    "itemId" INTEGER NOT NULL,
    "mode" TEXT NOT NULL,
    "num" INTEGER,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "species" TEXT,
    "duration" TEXT,
    "description" TEXT,
    "priceOral" DECIMAL(15,2),
    "routeOral" TEXT,
    "weeksOral" TEXT,
    "priceIv" DECIMAL(15,2),
    "routeIv" TEXT,
    "weeksIv" TEXT,
    "priceP2" DECIMAL(15,2),
    "priceP3" DECIMAL(15,2),
    "priceP4" DECIMAL(15,2),
    "priceSingle" DECIMAL(15,2),
    "formalName" TEXT,
    "guideline" JSONB,
    "note" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ToxicityV2Item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ToxicityV2Relation" (
    "id" TEXT NOT NULL,
    "mainTestId" INTEGER NOT NULL,
    "recoveryTestId" INTEGER,
    "tkOptions" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ToxicityV2Relation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ToxicityV2Overlay" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "itemId" INTEGER NOT NULL,
    "priceOop" DECIMAL(15,2),
    "priceOip" DECIMAL(15,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ToxicityV2Overlay_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ToxicityV2Metadata" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ToxicityV2Metadata_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerTag" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CustomerTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerNote" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "mentions" JSONB,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerDocument" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "uploadedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CustomerDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerAuditLog" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "fieldName" TEXT,
    "oldValue" TEXT,
    "newValue" TEXT,
    "metadata" JSONB,
    "changedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CustomerAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerHealthScore" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "activityScore" INTEGER NOT NULL,
    "dealScore" INTEGER NOT NULL,
    "meetingScore" INTEGER NOT NULL,
    "paymentScore" INTEGER NOT NULL,
    "contractScore" INTEGER NOT NULL,
    "churnRiskScore" INTEGER NOT NULL,
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CustomerHealthScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FilterPreset" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "filters" JSONB NOT NULL,
    "sortBy" TEXT,
    "sortOrder" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FilterPreset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LifecycleTransition" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "fromStage" TEXT NOT NULL,
    "toStage" TEXT NOT NULL,
    "reason" TEXT,
    "isAutomatic" BOOLEAN NOT NULL DEFAULT false,
    "triggeredBy" TEXT NOT NULL,
    "transitionAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LifecycleTransition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerCustomField" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "fieldType" "CustomFieldType" NOT NULL,
    "options" JSONB,
    "isRequired" BOOLEAN NOT NULL DEFAULT false,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerCustomField_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerCustomFieldValue" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "fieldId" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerCustomFieldValue_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ToxicityV2Item_mode_idx" ON "ToxicityV2Item"("mode");

-- CreateIndex
CREATE INDEX "ToxicityV2Item_category_idx" ON "ToxicityV2Item"("category");

-- CreateIndex
CREATE UNIQUE INDEX "ToxicityV2Item_mode_itemId_key" ON "ToxicityV2Item"("mode", "itemId");

-- CreateIndex
CREATE UNIQUE INDEX "ToxicityV2Relation_mainTestId_key" ON "ToxicityV2Relation"("mainTestId");

-- CreateIndex
CREATE UNIQUE INDEX "ToxicityV2Overlay_type_itemId_key" ON "ToxicityV2Overlay"("type", "itemId");

-- CreateIndex
CREATE UNIQUE INDEX "ToxicityV2Metadata_key_key" ON "ToxicityV2Metadata"("key");

-- CreateIndex
CREATE INDEX "CustomerTag_customerId_idx" ON "CustomerTag"("customerId");

-- CreateIndex
CREATE INDEX "CustomerTag_name_idx" ON "CustomerTag"("name");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerTag_customerId_name_key" ON "CustomerTag"("customerId", "name");

-- CreateIndex
CREATE INDEX "CustomerNote_customerId_idx" ON "CustomerNote"("customerId");

-- CreateIndex
CREATE INDEX "CustomerNote_isPinned_idx" ON "CustomerNote"("isPinned");

-- CreateIndex
CREATE INDEX "CustomerDocument_customerId_idx" ON "CustomerDocument"("customerId");

-- CreateIndex
CREATE INDEX "CustomerAuditLog_customerId_idx" ON "CustomerAuditLog"("customerId");

-- CreateIndex
CREATE INDEX "CustomerAuditLog_changedBy_idx" ON "CustomerAuditLog"("changedBy");

-- CreateIndex
CREATE INDEX "CustomerAuditLog_createdAt_idx" ON "CustomerAuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "CustomerAuditLog_fieldName_idx" ON "CustomerAuditLog"("fieldName");

-- CreateIndex
CREATE INDEX "CustomerHealthScore_customerId_idx" ON "CustomerHealthScore"("customerId");

-- CreateIndex
CREATE INDEX "CustomerHealthScore_calculatedAt_idx" ON "CustomerHealthScore"("calculatedAt");

-- CreateIndex
CREATE INDEX "FilterPreset_userId_idx" ON "FilterPreset"("userId");

-- CreateIndex
CREATE INDEX "LifecycleTransition_customerId_idx" ON "LifecycleTransition"("customerId");

-- CreateIndex
CREATE INDEX "LifecycleTransition_transitionAt_idx" ON "LifecycleTransition"("transitionAt");

-- CreateIndex
CREATE INDEX "LifecycleTransition_fromStage_toStage_idx" ON "LifecycleTransition"("fromStage", "toStage");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerCustomField_name_key" ON "CustomerCustomField"("name");

-- CreateIndex
CREATE INDEX "CustomerCustomFieldValue_customerId_idx" ON "CustomerCustomFieldValue"("customerId");

-- CreateIndex
CREATE INDEX "CustomerCustomFieldValue_fieldId_idx" ON "CustomerCustomFieldValue"("fieldId");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerCustomFieldValue_customerId_fieldId_key" ON "CustomerCustomFieldValue"("customerId", "fieldId");

-- CreateIndex
CREATE INDEX "Customer_segment_idx" ON "Customer"("segment");

-- AddForeignKey
ALTER TABLE "CustomerTag" ADD CONSTRAINT "CustomerTag_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerNote" ADD CONSTRAINT "CustomerNote_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerDocument" ADD CONSTRAINT "CustomerDocument_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerAuditLog" ADD CONSTRAINT "CustomerAuditLog_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerHealthScore" ADD CONSTRAINT "CustomerHealthScore_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LifecycleTransition" ADD CONSTRAINT "LifecycleTransition_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerCustomFieldValue" ADD CONSTRAINT "CustomerCustomFieldValue_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerCustomFieldValue" ADD CONSTRAINT "CustomerCustomFieldValue_fieldId_fkey" FOREIGN KEY ("fieldId") REFERENCES "CustomerCustomField"("id") ON DELETE CASCADE ON UPDATE CASCADE;
