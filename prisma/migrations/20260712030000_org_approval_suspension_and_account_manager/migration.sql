-- Organization approval + suspension fields.
-- New orgs default to approved=false (pending admin approval).
-- Existing orgs are backfilled to approved=true so they keep working.
ALTER TABLE "Organization" ADD COLUMN "approved" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Organization" ADD COLUMN "approvedAt" TIMESTAMP(3);
ALTER TABLE "Organization" ADD COLUMN "approvedById" TEXT;
ALTER TABLE "Organization" ADD COLUMN "suspendedAt" TIMESTAMP(3);
ALTER TABLE "Organization" ADD COLUMN "suspensionReason" TEXT;
ALTER TABLE "Organization" ADD COLUMN "suspendedById" TEXT;

-- Backfill existing orgs as approved (they were created before this gate).
UPDATE "Organization" SET "approved" = true, "approvedAt" = NOW() WHERE "approved" = false;

-- Add ACCOUNT_MANAGER to the Role enum.
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'ACCOUNT_MANAGER';
