import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function getApiKey() {
  const keyMatch = await prisma.apiKey.findFirst({
    where: { isActive: true },
    select: { key: true }
  });
  if (keyMatch) {
    console.log(`API_KEY=${keyMatch.key}`);
  } else {
    console.log('No active API keys found.');
  }
  await prisma.$disconnect();
}

getApiKey();
