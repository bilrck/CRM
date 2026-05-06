import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function run() {
  try {
    const connections = await prisma.connection.findMany();
    console.log('--- CONNECTIONS ---');
    console.log(JSON.stringify(connections, null, 2));

    const rules = await prisma.leadTrackingRule.findMany();
    console.log('--- RULES ---');
    console.log(JSON.stringify(rules, null, 2));
  } catch (err) {
    console.error('Error during DB debug:', err);
  } finally {
    await prisma.$disconnect();
  }
}

run();
