-- CreateEnum
CREATE TYPE "Department" AS ENUM ('BD1', 'BD2', 'SUPPORT');

-- AlterTable: Convert department from String to Enum
ALTER TABLE "User" ADD COLUMN "department_new" "Department";

-- Copy existing data (map common values)
UPDATE "User" SET "department_new" = 
  CASE 
    WHEN "department" ILIKE '%1센터%' OR "department" ILIKE '%1%센터%' THEN 'BD1'::"Department"
    WHEN "department" ILIKE '%2센터%' OR "department" ILIKE '%2%센터%' THEN 'BD2'::"Department"
    WHEN "department" ILIKE '%지원%' THEN 'SUPPORT'::"Department"
    ELSE NULL
  END;

-- Drop old column and rename new
ALTER TABLE "User" DROP COLUMN "department";
ALTER TABLE "User" RENAME COLUMN "department_new" TO "department";

-- Add canViewAllSales column
ALTER TABLE "User" ADD COLUMN "canViewAllSales" BOOLEAN NOT NULL DEFAULT false;

-- Set canViewAllSales for ADMIN users and SUPPORT department
UPDATE "User" SET "canViewAllSales" = true WHERE "role" = 'ADMIN' OR "department" = 'SUPPORT';
