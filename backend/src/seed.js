import dotenv from "dotenv";
dotenv.config();
import prisma from "./config/prisma.js";
import bcrypt from "bcrypt";

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL || "admin@rastreia.ai";
  const exists = await prisma.user.findUnique({ where: { email } });

  if (exists) {
    console.log("Admin já existe");
    return;
  }

  const hash = await bcrypt.hash(
    process.env.SEED_ADMIN_PASSWORD || "123456",
    10,
  );

  const user = await prisma.user.create({
    data: {
      name: "Admin",
      email,
      password: hash,
      role: "ADMIN",
    },
  });

  console.log("Admin criado:", user.email);

  // Criar Workspace padrão
  const workspace = await prisma.workspace.create({
    data: {
      name: "Meu Workspace",
      ownerId: user.id,
    },
  });

  // Associar o admin como membro do workspace
  await prisma.workspaceMember.create({
    data: {
      workspaceId: workspace.id,
      userId: user.id,
      role: "ADMIN",
    },
  });

  console.log("Workspace padrão criado:", workspace.name);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
