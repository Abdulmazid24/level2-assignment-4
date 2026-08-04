/*
  Warnings:

  - A unique constraint covering the columns `[bookingId]` on the table `Payment` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Payment" ALTER COLUMN "paymentMethod" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Payment_bookingId_key" ON "Payment"("bookingId");
