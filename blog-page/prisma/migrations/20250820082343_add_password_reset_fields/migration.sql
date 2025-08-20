-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "passwordResetCode" TEXT,
ADD COLUMN     "passwordResetCodeExpires" TIMESTAMP(3);
