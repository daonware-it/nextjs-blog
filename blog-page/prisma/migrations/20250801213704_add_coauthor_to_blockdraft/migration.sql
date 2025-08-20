-- AlterTable
ALTER TABLE "public"."BlockDraft" ADD COLUMN     "coAuthorId" INTEGER;

-- AddForeignKey
ALTER TABLE "public"."BlockDraft" ADD CONSTRAINT "BlockDraft_coAuthorId_fkey" FOREIGN KEY ("coAuthorId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
