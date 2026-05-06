
import prisma from './src/config/prisma.js';

async function listAll() {
  const conns = await prisma.connection.findMany();
  console.log(JSON.stringify(conns, null, 2));
}

listAll();
