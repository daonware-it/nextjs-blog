-- CreateEnum
CREATE TYPE "public"."UserStatus" AS ENUM ('ACTIVE', 'PENDING', 'BANNED');

-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'ACTIVE';
