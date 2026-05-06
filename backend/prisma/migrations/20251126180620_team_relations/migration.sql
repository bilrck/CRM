/*
  Warnings:

  - A unique constraint covering the columns `[equipeId,userId]` on the table `EquipeUser` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updatedAt` to the `Equipe` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `EquipeUser` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Equipe" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "EquipeUser" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "EquipeUser_equipeId_userId_key" ON "EquipeUser"("equipeId", "userId");

-- AddForeignKey
ALTER TABLE "Equipe" ADD CONSTRAINT "Equipe_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EquipeUser" ADD CONSTRAINT "EquipeUser_equipeId_fkey" FOREIGN KEY ("equipeId") REFERENCES "Equipe"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EquipeUser" ADD CONSTRAINT "EquipeUser_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
