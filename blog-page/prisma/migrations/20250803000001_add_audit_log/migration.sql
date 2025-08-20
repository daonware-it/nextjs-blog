-- CreateTable
CREATE TABLE "AuditLog" (
  "id" SERIAL NOT NULL,
  "userId" INTEGER NOT NULL,
  "adminId" INTEGER,
  "action" TEXT NOT NULL,
  "details" TEXT NOT NULL,
  "oldValue" TEXT,
  "newValue" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM (
  'TOKEN_UPDATE',
  'TOKEN_BLOCK',
  'TOKEN_UNBLOCK',
  'STATUS_CHANGE',
  'ROLE_CHANGE',
  'SUBSCRIPTION_CREATE',
  'SUBSCRIPTION_UPDATE',
  'SUBSCRIPTION_DELETE',
  'USER_UPDATE',
  'USER_CREATE',
  'USER_DELETE'
);

-- AlterTable
ALTER TABLE "AuditLog" ALTER COLUMN "action" TYPE "AuditAction" USING ("action"::"AuditAction");
