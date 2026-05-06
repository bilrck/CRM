import prisma from './src/config/prisma.js';

async function main() {
    console.log("Iniciando verificação de Admin Features...");

    // 1. Criar um Admin (se não existir)
    const adminEmail = "admin@teste.com";
    let admin = await prisma.user.findUnique({ where: { email: adminEmail } });
    
    if (!admin) {
        console.log("Criando admin...");
        admin = await prisma.user.create({
            data: {
                name: "Admin Verify",
                email: adminEmail,
                password: "hash",
                role: "ADMIN"
            }
        });
    }

    console.log("✅ Admin verificado:", admin.email);

    // 2. Criar um usuário comum via script (simulando a ação da API, mas direto no banco por enquanto p/ garantir schema)
    // Na API seria POST /admin/users
    console.log("Testando limites no Schema...");
    
    const userEmail = "limit_test@teste.com";
    let user = await prisma.user.findUnique({ where: { email: userEmail } });
    if(user) await prisma.user.delete({ where: { id: user.id } });

    user = await prisma.user.create({
        data: {
            name: "User Limits",
            email: userEmail,
            password: "hash",
            role: "CLIENTE",
            maxMetaConnections: 5,
            maxWhatsappConnections: 3
        }
    });

    console.log("✅ Usuário criado com limites:");
    console.log(`   - Meta: ${user.maxMetaConnections}`);
    console.log(`   - Whats: ${user.maxWhatsappConnections}`);

    if(user.maxMetaConnections === 5 && user.maxWhatsappConnections === 3) {
        console.log("✅ Schema migration validada com sucesso!");
    } else {
        console.error("❌ Erro: Limites não salvos corretamente.");
    }

    // Limpeza
    await prisma.user.delete({ where: { id: user.id } });
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
