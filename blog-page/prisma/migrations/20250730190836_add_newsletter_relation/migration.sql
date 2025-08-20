-- CreateTable
CREATE TABLE "public"."Newsletter" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,

    CONSTRAINT "Newsletter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."_NewsletterToUser" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_NewsletterToUser_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_NewsletterToUser_B_index" ON "public"."_NewsletterToUser"("B");

-- AddForeignKey
ALTER TABLE "public"."_NewsletterToUser" ADD CONSTRAINT "_NewsletterToUser_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."Newsletter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_NewsletterToUser" ADD CONSTRAINT "_NewsletterToUser_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
