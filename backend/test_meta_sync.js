import { PrismaClient } from '@prisma/client';
import { subscribePageToWebhooks, getPageForms } from './src/services/meta.service.js';

const prisma = new PrismaClient();

async function testSync() {
  try {
    const page = await prisma.metaPage.findUnique({ where: { id: 1 } });
    if (!page) return console.log('Page not found');

    console.log('Testing subscribePageToWebhooks for page', page.name);
    try {
      const subRes = await subscribePageToWebhooks(page.pageId, page.accessToken);
      console.log('Subscribe Result:', JSON.stringify(subRes, null, 2));
    } catch (e) {
      console.error('Subscribe Error:', e.message);
    }

    console.log('\nTesting getPageForms for page', page.name);
    try {
      const formsRes = await getPageForms(page.pageId, page.accessToken);
      console.log('Forms Result:', JSON.stringify(formsRes, null, 2));
    } catch (e) {
      console.error('Forms Error:', e.message);
    }

  } catch(e) {
    console.error('Test error:', e);
  } finally {
    await prisma.$disconnect();
  }
}

testSync();
