/*
  Warnings:

  - You are about to drop the column `amount` on the `PaymentTransaction` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `PaymentTransaction` table. All the data in the column will be lost.
  - You are about to alter the column `referenceNumber` on the `PaymentTransaction` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(255)`.
  - You are about to drop the `TopUpPackage` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `gateway` to the `PaymentTransaction` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "PaymentTransaction" DROP COLUMN "amount",
DROP COLUMN "type",
ADD COLUMN     "accountNumber" VARCHAR(100),
ADD COLUMN     "accumulated" DECIMAL(20,2) NOT NULL DEFAULT 0.00,
ADD COLUMN     "amountIn" DECIMAL(20,2) NOT NULL DEFAULT 0.00,
ADD COLUMN     "amountOut" DECIMAL(20,2) NOT NULL DEFAULT 0.00,
ADD COLUMN     "body" TEXT,
ADD COLUMN     "code" VARCHAR(250),
ADD COLUMN     "gateway" VARCHAR(100) NOT NULL,
ADD COLUMN     "subAccount" VARCHAR(250),
ADD COLUMN     "transactionContent" TEXT,
ADD COLUMN     "transactionDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "referenceNumber" SET DATA TYPE VARCHAR(255);

-- AlterTable
ALTER TABLE "Wallet" ADD COLUMN     "totalSpent" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "totalTopUp" INTEGER NOT NULL DEFAULT 0;

-- DropTable
DROP TABLE "TopUpPackage";

-- CreateTable
CREATE TABLE "TopUp" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "amount" INTEGER NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "gateway" VARCHAR(100) NOT NULL,
    "transactionId" VARCHAR(255),
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TopUp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CreditLog" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "amount" INTEGER NOT NULL,
    "action" VARCHAR(100) NOT NULL,
    "requestId" VARCHAR(255),
    "description" VARCHAR(500),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CreditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServicePricing" (
    "id" SERIAL NOT NULL,
    "action" VARCHAR(100) NOT NULL,
    "costAmount" INTEGER NOT NULL,
    "description" VARCHAR(500),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServicePricing_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TopUp_transactionId_key" ON "TopUp"("transactionId");

-- CreateIndex
CREATE INDEX "TopUp_userId_idx" ON "TopUp"("userId");

-- CreateIndex
CREATE INDEX "TopUp_status_idx" ON "TopUp"("status");

-- CreateIndex
CREATE INDEX "CreditLog_userId_idx" ON "CreditLog"("userId");

-- CreateIndex
CREATE INDEX "CreditLog_createdAt_idx" ON "CreditLog"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ServicePricing_action_key" ON "ServicePricing"("action");

-- AddForeignKey
ALTER TABLE "TopUp" ADD CONSTRAINT "TopUp_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TopUp" ADD CONSTRAINT "TopUp_userId_wallet_fkey" FOREIGN KEY ("userId") REFERENCES "Wallet"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditLog" ADD CONSTRAINT "CreditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditLog" ADD CONSTRAINT "CreditLog_userId_wallet_fkey" FOREIGN KEY ("userId") REFERENCES "Wallet"("userId") ON DELETE CASCADE ON UPDATE CASCADE;
