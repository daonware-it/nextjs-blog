-- AlterTable
ALTER TABLE "public"."BlockDraft" ADD COLUMN     "deleteAt" TIMESTAMP(3),
ADD COLUMN     "description" TEXT,
ADD COLUMN     "title" TEXT;
