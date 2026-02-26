-- CreateTable
CREATE TABLE "Referential" (
    "id" SERIAL NOT NULL,
    "referenceNumber" TEXT NOT NULL,
    "recipient" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "senderName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Referential_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Referential_referenceNumber_key" ON "Referential"("referenceNumber");
