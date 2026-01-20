-- CreateTable
CREATE TABLE "Requester" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "position" TEXT,
    "department" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Requester_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MeetingRecord" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "requesterId" TEXT,
    "type" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "time" TEXT,
    "duration" INTEGER,
    "title" TEXT NOT NULL,
    "attendees" JSONB NOT NULL DEFAULT '[]',
    "content" TEXT NOT NULL,
    "followUpActions" TEXT,
    "attachments" JSONB,
    "isRequest" BOOLEAN NOT NULL DEFAULT false,
    "requestStatus" TEXT,
    "requestCompletedAt" TIMESTAMP(3),
    "requestResponse" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MeetingRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TestReception" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "requesterId" TEXT,
    "contractId" TEXT,
    "quotationId" TEXT,
    "substanceCode" TEXT,
    "projectCode" TEXT,
    "substanceName" TEXT,
    "institutionName" TEXT,
    "testNumber" TEXT,
    "testTitle" TEXT,
    "testDirector" TEXT,
    "totalAmount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "paidAmount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "remainingAmount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'received',
    "receptionDate" TIMESTAMP(3),
    "expectedCompletionDate" TIMESTAMP(3),
    "actualCompletionDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TestReception_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvoiceSchedule" (
    "id" TEXT NOT NULL,
    "testReceptionId" TEXT,
    "customerId" TEXT NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "scheduledDate" TIMESTAMP(3) NOT NULL,
    "issuedDate" TIMESTAMP(3),
    "invoiceNumber" TEXT,
    "paymentType" TEXT NOT NULL DEFAULT 'full',
    "installmentNumber" INTEGER,
    "totalInstallments" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InvoiceSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CalendarEvent" (
    "id" TEXT NOT NULL,
    "customerId" TEXT,
    "testReceptionId" TEXT,
    "invoiceScheduleId" TEXT,
    "meetingRecordId" TEXT,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "allDay" BOOLEAN NOT NULL DEFAULT false,
    "color" TEXT,
    "reminderBefore" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CalendarEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerProgressStage" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "quotationId" TEXT,
    "contractId" TEXT,
    "currentStage" TEXT NOT NULL DEFAULT 'inquiry',
    "checklist" JSONB NOT NULL DEFAULT '[]',
    "stageHistory" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerProgressStage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TestReception_testNumber_key" ON "TestReception"("testNumber");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerProgressStage_customerId_key" ON "CustomerProgressStage"("customerId");

-- AddForeignKey
ALTER TABLE "Requester" ADD CONSTRAINT "Requester_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingRecord" ADD CONSTRAINT "MeetingRecord_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingRecord" ADD CONSTRAINT "MeetingRecord_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "Requester"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestReception" ADD CONSTRAINT "TestReception_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestReception" ADD CONSTRAINT "TestReception_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "Requester"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceSchedule" ADD CONSTRAINT "InvoiceSchedule_testReceptionId_fkey" FOREIGN KEY ("testReceptionId") REFERENCES "TestReception"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceSchedule" ADD CONSTRAINT "InvoiceSchedule_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendarEvent" ADD CONSTRAINT "CalendarEvent_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendarEvent" ADD CONSTRAINT "CalendarEvent_testReceptionId_fkey" FOREIGN KEY ("testReceptionId") REFERENCES "TestReception"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendarEvent" ADD CONSTRAINT "CalendarEvent_invoiceScheduleId_fkey" FOREIGN KEY ("invoiceScheduleId") REFERENCES "InvoiceSchedule"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendarEvent" ADD CONSTRAINT "CalendarEvent_meetingRecordId_fkey" FOREIGN KEY ("meetingRecordId") REFERENCES "MeetingRecord"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerProgressStage" ADD CONSTRAINT "CustomerProgressStage_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
