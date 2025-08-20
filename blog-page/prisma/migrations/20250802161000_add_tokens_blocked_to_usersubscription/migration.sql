-- AlterTable
ALTER TABLE "UserSubscription" ADD COLUMN IF NOT EXISTS "tokensBlocked" BOOLEAN NOT NULL DEFAULT false;
