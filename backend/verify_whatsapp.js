import prisma from './src/config/prisma.js';
import fetch from 'node-fetch';

async function main() {
    console.log("Iniciando verificação...");

    // 1. Garantir que existe um usuário
    let user = await prisma.user.findFirst();
    if (!user) {
        console.log("Criando usuário de teste...");
        user = await prisma.user.create({
            data: {
                name: "Test User",
                email: "test@example.com",
                password: "hashedpassword",
                role: "ADMIN"
            }
        });
    }

    // 2. Garantir que existe uma conexão com webhookUrl
    let connection = await prisma.connection.findFirst({
        where: { provider: 'custom' } // ou evolution, se configurado
    });

    if (!connection) {
        console.log("Criando conexão de teste...");
        connection = await prisma.connection.create({
            data: {
                userId: user.id,
                name: "Webhook Test",
                provider: "custom", // ou evolution
                webhookUrl: `http://localhost:3001/webhooks/test-uuid-${Date.now()}`
            }
        });
    }

    const webhookId = connection.webhookUrl.split('/').pop();
    const url = `http://localhost:3001/webhooks/${webhookId}`;

    console.log(`Enviando POST para ${url}...`);

    // 3. Simular payload da Evolution API
    const payload = {
        type: "messages.upsert",
        data: {
            key: {
                remoteJid: "551199999999@s.whatsapp.net",
                fromMe: false
            },
            pushName: "João Teste",
            message: {
                conversation: "Olá, gostaria de saber mais sobre o produto."
            }
        }
    };

    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const json = await res.json();
        console.log("Resposta do Webhook:", json);

        // 4. Verificar se criou a conversa
        const conversation = await prisma.whatsappConversation.findUnique({
            where: { remoteJid: "551199999999@s.whatsapp.net" },
            include: { messages: true }
        });

        if (conversation) {
            console.log("✅ Conversa criada com sucesso:", conversation.id);
            console.log("✅ Mensagens:", conversation.messages.length);
            console.log("✅ Última msg:", conversation.messages[0].body);
        } else {
            console.error("❌ Erro: Conversa não encontrada no banco.");
        }

    } catch (error) {
        console.error("Erro na requisição:", error);
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
