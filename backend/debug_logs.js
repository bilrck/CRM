import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function run() {
  try {
    const logs = await prisma.systemLog.findMany({
      take: 20,
      orderBy: { createdAt: 'desc' }
    });
    console.log('--- SYSTEM LOGS ---');
    console.log(JSON.stringify(logs, null, 2));
  } catch (err) {
    console.error('Error during DB debug:', err);
  } finally {
    await prisma.$disconnect();
  }
}

run();
