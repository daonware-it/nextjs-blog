-- AlterTable
ALTER TABLE "public"."BlockDraftComment" ADD COLUMN     "parentCommentId" INTEGER;

-- AddForeignKey
ALTER TABLE "public"."BlockDraftComment" ADD CONSTRAINT "BlockDraftComment_parentCommentId_fkey" FOREIGN KEY ("parentCommentId") REFERENCES "public"."BlockDraftComment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
