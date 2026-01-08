/*
  Warnings:

  - You are about to drop the column `gateway` on the `Payment` table. All the data in the column will be lost.
  - You are about to drop the `PaymentTransaction` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[orderCode]` on the table `Payment` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `orderCode` to the `Payment` table without a default value. This is not possible if the table is not empty.

*/

-- Step 1: Rename enum value SUCCESS to PAID
ALTER TYPE "PaymentStatus" RENAME VALUE 'SUCCESS' TO 'PAID';

-- DropForeignKey
ALTER TABLE "PaymentTransaction" DROP CONSTRAINT "PaymentTransaction_paymentId_fkey";

-- AlterTable
ALTER TABLE "Payment" DROP COLUMN "gateway",
ADD COLUMN     "description" TEXT,
ADD COLUMN     "orderCode" VARCHAR(255) NOT NULL,
ADD COLUMN     "paidAt" TIMESTAMP(3),
ALTER COLUMN "status" SET DEFAULT 'PENDING';

-- DropTable
DROP TABLE "PaymentTransaction";

-- CreateTable
CREATE TABLE "IpnNotification" (
    "id" SERIAL NOT NULL,
    "paymentId" INTEGER,
    "notificationType" VARCHAR(100) NOT NULL,
    "timestamp" BIGINT NOT NULL,
    "orderId" VARCHAR(255) NOT NULL,
    "orderStatus" VARCHAR(50) NOT NULL,
    "orderAmount" VARCHAR(50) NOT NULL,
    "orderInvoiceNumber" VARCHAR(255) NOT NULL,
    "transactionId" VARCHAR(255),
    "paymentMethod" VARCHAR(100),
    "transactionStatus" VARCHAR(50),
    "transactionAmount" VARCHAR(50),
    "transactionDate" VARCHAR(100),
    "rawData" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IpnNotification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "IpnNotification_paymentId_idx" ON "IpnNotification"("paymentId");

-- CreateIndex
CREATE INDEX "IpnNotification_orderInvoiceNumber_idx" ON "IpnNotification"("orderInvoiceNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_orderCode_key" ON "Payment"("orderCode");

-- CreateIndex
CREATE INDEX "Payment_userId_idx" ON "Payment"("userId");

-- CreateIndex
CREATE INDEX "Payment_status_idx" ON "Payment"("status");

-- CreateIndex
CREATE INDEX "Payment_orderCode_idx" ON "Payment"("orderCode");

-- AddForeignKey
ALTER TABLE "IpnNotification" ADD CONSTRAINT "IpnNotification_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
