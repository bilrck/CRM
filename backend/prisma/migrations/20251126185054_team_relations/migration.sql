/*
  Warnings:

  - You are about to drop the column `empresa` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `telefone` on the `User` table. All the data in the column will be lost.
  - Made the column `ownerId` on table `Equipe` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "Equipe" DROP CONSTRAINT "Equipe_ownerId_fkey";

-- AlterTable
ALTER TABLE "Equipe" ALTER COLUMN "ownerId" SET NOT NULL;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "empresa",
DROP COLUMN "telefone";

-- AddForeignKey
ALTER TABLE "Equipe" ADD CONSTRAINT "Equipe_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
