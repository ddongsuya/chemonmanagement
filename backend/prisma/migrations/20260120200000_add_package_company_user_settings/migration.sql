-- CreateTable
CREATE TABLE "PackageTemplate" (
    "id" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "packageName" TEXT NOT NULL,
    "description" TEXT,
    "modality" TEXT,
    "clinicalPhase" TEXT,
    "tests" JSONB NOT NULL DEFAULT '[]',
    "optionalTests" JSONB NOT NULL DEFAULT '[]',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PackageTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompanyInfo" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameEn" TEXT,
    "businessNumber" TEXT,
    "ceoName" TEXT,
    "address" TEXT,
    "addressEn" TEXT,
    "tel" TEXT,
    "fax" TEXT,
    "email" TEXT,
    "website" TEXT,
    "logo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompanyInfo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserSettings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userCode" TEXT,
    "defaultValidityDays" INTEGER NOT NULL DEFAULT 30,
    "defaultDiscountRate" INTEGER NOT NULL DEFAULT 0,
    "autoAnalysisCalculation" BOOLEAN NOT NULL DEFAULT true,
    "validationInvivoCost" INTEGER NOT NULL DEFAULT 10000000,
    "validationInvitroCost" INTEGER NOT NULL DEFAULT 10000000,
    "analysisUnitCost" INTEGER NOT NULL DEFAULT 1000000,
    "emailNotification" BOOLEAN NOT NULL DEFAULT true,
    "browserNotification" BOOLEAN NOT NULL DEFAULT false,
    "notifyOnExpiry" BOOLEAN NOT NULL DEFAULT true,
    "expiryReminderDays" INTEGER NOT NULL DEFAULT 7,
    "currencyUnit" TEXT NOT NULL DEFAULT 'KRW',
    "dateFormat" TEXT NOT NULL DEFAULT 'YYYY.MM.DD',
    "showVatNotice" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PackageTemplate_packageId_key" ON "PackageTemplate"("packageId");

-- CreateIndex
CREATE UNIQUE INDEX "UserSettings_userId_key" ON "UserSettings"("userId");
