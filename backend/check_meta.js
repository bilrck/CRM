import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function run() {
  try {
    const pages = await prisma.metaPage.findMany();
    const forms = await prisma.metaLeadForm.findMany();
    console.log("Pages:", JSON.stringify(pages, null, 2));
    console.log("Forms:", JSON.stringify(forms, null, 2));
  } catch(e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}
run();
