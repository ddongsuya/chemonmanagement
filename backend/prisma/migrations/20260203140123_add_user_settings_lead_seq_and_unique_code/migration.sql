-- AlterTable: Add nextQuotationSeq and nextLeadSeq fields to UserSettings
-- Also add unique constraint to userCode and index on userCode

-- Add new columns with default values
ALTER TABLE "UserSettings" ADD COLUMN IF NOT EXISTS "nextQuotationSeq" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "UserSettings" ADD COLUMN IF NOT EXISTS "nextLeadSeq" INTEGER NOT NULL DEFAULT 1;

-- Add unique constraint to userCode (if not exists)
-- Note: This will fail if there are duplicate userCode values
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'UserSettings_userCode_key'
    ) THEN
        ALTER TABLE "UserSettings" ADD CONSTRAINT "UserSettings_userCode_key" UNIQUE ("userCode");
    END IF;
END $$;

-- Create index on userCode (if not exists)
CREATE INDEX IF NOT EXISTS "UserSettings_userCode_idx" ON "UserSettings"("userCode");
