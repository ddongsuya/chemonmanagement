-- CreateEnum
CREATE TYPE "Position" AS ENUM ('STAFF', 'SENIOR', 'ASSISTANT', 'MANAGER', 'DEPUTY', 'GENERAL', 'DIRECTOR', 'CEO', 'CHAIRMAN');

-- AlterTable: Add canViewAllData column
ALTER TABLE "User" ADD COLUMN "canViewAllData" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable: Change position from String to Position enum
-- First, drop the old column and add new one with enum type
ALTER TABLE "User" DROP COLUMN IF EXISTS "position";
ALTER TABLE "User" ADD COLUMN "position" "Position";
