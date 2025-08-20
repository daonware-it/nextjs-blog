-- CreateTable
CREATE TABLE "public"."BlockDraftLike" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "blockDraftId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BlockDraftLike_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."BlockDraftComment" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "blockDraftId" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BlockDraftComment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BlockDraftLike_userId_blockDraftId_key" ON "public"."BlockDraftLike"("userId", "blockDraftId");

-- AddForeignKey
ALTER TABLE "public"."BlockDraftLike" ADD CONSTRAINT "BlockDraftLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BlockDraftLike" ADD CONSTRAINT "BlockDraftLike_blockDraftId_fkey" FOREIGN KEY ("blockDraftId") REFERENCES "public"."BlockDraft"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BlockDraftComment" ADD CONSTRAINT "BlockDraftComment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BlockDraftComment" ADD CONSTRAINT "BlockDraftComment_blockDraftId_fkey" FOREIGN KEY ("blockDraftId") REFERENCES "public"."BlockDraft"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
