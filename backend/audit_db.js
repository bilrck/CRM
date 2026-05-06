import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function check() {
    try {
        const msgCount = await prisma.whatsappMessage.count();
        const convs = await prisma.whatsappConversation.findMany({
            include: { _count: { select: { messages: true } } },
            take: 10
        });
        console.log('--- DATABASE AUDIT ---');
        console.log('Total Messages:', msgCount);
        console.log('Conversations:', JSON.stringify(convs, null, 2));
    } catch (e) {
        console.error('Audit Error:', e);
    } finally {
        await prisma.$disconnect();
    }
}

check();
