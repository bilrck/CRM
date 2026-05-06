import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function fix() {
    try {
        const update1 = await prisma.connection.updateMany({
            where: { id: 2 },
            data: { config: { instanceName: 'teste' } }
        });
        const update2 = await prisma.connection.updateMany({
            where: { id: 3 },
            data: { config: { instanceName: 'teste' } }
        });
        console.log('--- FIX APPLIED ---');
        console.log('Update Result ID 2:', update1);
        console.log('Update Result ID 3:', update2);
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

fix();
