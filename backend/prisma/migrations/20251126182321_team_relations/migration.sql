/*
  Warnings:

  - A unique constraint covering the columns `[inviteToken]` on the table `Invitations` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[equipeId,email]` on the table `Invitations` will be added. If there are existing duplicate values, this will fail.
  - Made the column `equipeId` on table `EquipeUser` required. This step will fail if there are existing NULL values in that column.
  - Made the column `userId` on table `EquipeUser` required. This step will fail if there are existing NULL values in that column.
  - Made the column `equipeId` on table `Invitations` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "EquipeUser" DROP CONSTRAINT "EquipeUser_equipeId_fkey";

-- DropForeignKey
ALTER TABLE "EquipeUser" DROP CONSTRAINT "EquipeUser_userId_fkey";

-- AlterTable
ALTER TABLE "EquipeUser" ALTER COLUMN "equipeId" SET NOT NULL,
ALTER COLUMN "userId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Invitations" ALTER COLUMN "equipeId" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Invitations_inviteToken_key" ON "Invitations"("inviteToken");

-- CreateIndex
CREATE UNIQUE INDEX "Invitations_equipeId_email_key" ON "Invitations"("equipeId", "email");

-- AddForeignKey
ALTER TABLE "EquipeUser" ADD CONSTRAINT "EquipeUser_equipeId_fkey" FOREIGN KEY ("equipeId") REFERENCES "Equipe"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EquipeUser" ADD CONSTRAINT "EquipeUser_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invitations" ADD CONSTRAINT "Invitations_equipeId_fkey" FOREIGN KEY ("equipeId") REFERENCES "Equipe"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
