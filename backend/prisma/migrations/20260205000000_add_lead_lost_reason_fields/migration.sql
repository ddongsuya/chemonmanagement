-- AlterTable: Add lostReasonDetail and lostAt fields to Lead model
-- These fields support the CRM workflow enhancement for tracking lost lead reasons

-- Add lostReasonDetail column (nullable String for detailed reason when lostReason is 'OTHER')
ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "lostReasonDetail" TEXT;

-- Add lostAt column (nullable DateTime for when the lead was marked as lost)
ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "lostAt" TIMESTAMP(3);
