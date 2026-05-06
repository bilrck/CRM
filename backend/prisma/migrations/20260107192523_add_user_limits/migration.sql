-- AlterTable
ALTER TABLE "User" ADD COLUMN     "maxMetaConnections" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "maxWhatsappConnections" INTEGER NOT NULL DEFAULT 1;
