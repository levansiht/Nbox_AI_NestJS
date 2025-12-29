-- AlterTable
ALTER TABLE "PaymentTransaction" ALTER COLUMN "paymentId" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "PaymentTransaction_paymentId_idx" ON "PaymentTransaction"("paymentId");
