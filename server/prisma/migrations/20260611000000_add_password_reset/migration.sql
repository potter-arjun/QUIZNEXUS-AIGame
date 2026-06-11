-- AlterTable
ALTER TABLE "User" ADD COLUMN "resetExpiry" TIMESTAMP(3),
ADD COLUMN "resetToken" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_resetToken_key" ON "User"("resetToken");
