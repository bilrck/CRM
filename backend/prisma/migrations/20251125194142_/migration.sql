-- CreateTable
CREATE TABLE "Equipe" (
    "id" SERIAL NOT NULL,
    "ownerId" INTEGER,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Equipe_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EquipeUser" (
    "id" SERIAL NOT NULL,
    "equipeId" INTEGER,
    "userId" INTEGER,
    "role" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EquipeUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invitations" (
    "id" SERIAL NOT NULL,
    "equipeId" INTEGER,
    "email" TEXT NOT NULL,
    "inviteToken" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiredAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Invitations_pkey" PRIMARY KEY ("id")
);
