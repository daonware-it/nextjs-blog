-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "public"."AuditAction" ADD VALUE 'POST_CREATE';
ALTER TYPE "public"."AuditAction" ADD VALUE 'POST_UPDATE';
ALTER TYPE "public"."AuditAction" ADD VALUE 'POST_DELETE';
ALTER TYPE "public"."AuditAction" ADD VALUE 'POST_PUBLISH';
ALTER TYPE "public"."AuditAction" ADD VALUE 'BLOCK_DRAFT_CREATE';
ALTER TYPE "public"."AuditAction" ADD VALUE 'BLOCK_DRAFT_UPDATE';
ALTER TYPE "public"."AuditAction" ADD VALUE 'BLOCK_DRAFT_DELETE';
ALTER TYPE "public"."AuditAction" ADD VALUE 'CATEGORY_CREATE';
ALTER TYPE "public"."AuditAction" ADD VALUE 'CATEGORY_UPDATE';
ALTER TYPE "public"."AuditAction" ADD VALUE 'CATEGORY_DELETE';

-- AlterTable
ALTER TABLE "public"."BlockDraft" ADD COLUMN     "categoryId" INTEGER;

-- AddForeignKey
ALTER TABLE "public"."BlockDraft" ADD CONSTRAINT "BlockDraft_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "public"."Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;
