-- CreateTable
CREATE TABLE "SystemLog" (
    "id" SERIAL NOT NULL,
    "level" TEXT NOT NULL DEFAULT 'INFO',
    "category" TEXT NOT NULL DEFAULT 'SYSTEM',
    "message" TEXT NOT NULL,
    "data" JSONB,
    "userId" INTEGER,
    "workspaceId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SystemLog_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "SystemLog" ADD CONSTRAINT "SystemLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SystemLog" ADD CONSTRAINT "SystemLog_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE SET NULL ON UPDATE CASCADE;
