-- CreateTable
CREATE TABLE "Administration" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "note" TEXT,

    CONSTRAINT "Administration_pkey" PRIMARY KEY ("id")
);

-- Add administrationId to Department
ALTER TABLE "Department" ADD COLUMN "administrationId" INTEGER;

-- Create default administration and link existing departments
INSERT INTO "Administration" ("name", "note") VALUES ('الإدارة العامة', 'إدارة افتراضية');
UPDATE "Department" SET "administrationId" = 1 WHERE "administrationId" IS NULL;

-- Make administrationId required
ALTER TABLE "Department" ALTER COLUMN "administrationId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "Department" ADD CONSTRAINT "Department_administrationId_fkey" FOREIGN KEY ("administrationId") REFERENCES "Administration"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
