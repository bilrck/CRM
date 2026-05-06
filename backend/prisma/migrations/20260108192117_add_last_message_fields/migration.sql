-- AlterTable
ALTER TABLE "WhatsappConversation" ADD COLUMN     "connectionId" INTEGER,
ADD COLUMN     "isTracked" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lastMessage" TEXT,
ADD COLUMN     "lastMessageAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "lastMessageFromMe" BOOLEAN;

-- CreateTable
CREATE TABLE "LeadTrackingRule" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "keywords" TEXT NOT NULL,
    "targetStatus" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeadTrackingRule_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "LeadTrackingRule" ADD CONSTRAINT "LeadTrackingRule_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WhatsappConversation" ADD CONSTRAINT "WhatsappConversation_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "Connection"("id") ON DELETE SET NULL ON UPDATE CASCADE;
