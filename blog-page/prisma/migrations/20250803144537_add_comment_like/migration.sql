-- CreateTable
CREATE TABLE "public"."BlockDraftReport" (
    "id" SERIAL NOT NULL,
    "blockDraftId" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BlockDraftReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."BlockDraftCommentReport" (
    "id" SERIAL NOT NULL,
    "commentId" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BlockDraftCommentReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."BlockDraftCommentLike" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "commentId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ip" VARCHAR(64),

    CONSTRAINT "BlockDraftCommentLike_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BlockDraftCommentLike_userId_commentId_key" ON "public"."BlockDraftCommentLike"("userId", "commentId");

-- AddForeignKey
ALTER TABLE "public"."BlockDraftReport" ADD CONSTRAINT "BlockDraftReport_blockDraftId_fkey" FOREIGN KEY ("blockDraftId") REFERENCES "public"."BlockDraft"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BlockDraftCommentReport" ADD CONSTRAINT "BlockDraftCommentReport_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "public"."BlockDraftComment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BlockDraftCommentLike" ADD CONSTRAINT "BlockDraftCommentLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BlockDraftCommentLike" ADD CONSTRAINT "BlockDraftCommentLike_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "public"."BlockDraftComment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
