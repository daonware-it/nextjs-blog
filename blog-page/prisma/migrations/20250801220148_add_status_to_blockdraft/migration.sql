-- CreateEnum
CREATE TYPE "public"."BlockDraftStatus" AS ENUM ('ENTWURF', 'VEROEFFENTLICHT', 'GEPLANT', 'NICHT_OEFFENTLICH');

-- AlterTable
ALTER TABLE "public"."BlockDraft" ADD COLUMN     "status" "public"."BlockDraftStatus" NOT NULL DEFAULT 'ENTWURF';
