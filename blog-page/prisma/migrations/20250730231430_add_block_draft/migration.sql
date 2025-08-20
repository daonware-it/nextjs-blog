-- CreateTable
CREATE TABLE "public"."BlockDraft" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "blocks" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BlockDraft_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BlockDraft_userId_key" ON "public"."BlockDraft"("userId");

-- AddForeignKey
ALTER TABLE "public"."BlockDraft" ADD CONSTRAINT "BlockDraft_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
