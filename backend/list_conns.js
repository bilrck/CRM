import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function list() {
    try {
        const conns = await prisma.connection.findMany();
        console.log('--- ALL CONNECTIONS ---');
        conns.forEach(c => {
            console.log(`ID: ${c.id}, Name: ${c.name}, Provider: ${c.provider}, Status: ${c.status}`);
            console.log(`Config: ${JSON.stringify(c.config)}`);
            console.log('---');
        });
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

list();
