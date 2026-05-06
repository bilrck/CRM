import prisma from "../config/prisma.js";
import { sendMessage } from "./evolution.service.js";
import { createNotification } from "../controllers/notifications.controller.js";

export const startBillingWorker = () => {
    console.log("Billing reminder worker started");

    // Rodar a cada 1 hora (ou intervalo desejado)
    setInterval(async () => {
        try {
            const now = new Date();

            // 1. BUSCAR USUÁRIOS COM ASSINATURA PRÓXIMA DO VENCIMENTO
            const users = await prisma.user.findMany({
                where: {
                    subscriptionExpiresAt: {
                        not: null,
                        lte: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) // Próximos 7 dias
                    },
                    billingStatus: "ativo",
                    subscriptionStatus: "ACTIVE"
                }
            });

            for (const user of users) {
                const config = user.billingReminderConfig 
                    ? (typeof user.billingReminderConfig === 'string' ? JSON.parse(user.billingReminderConfig) : user.billingReminderConfig)
                    : {};
                
                const daysBefore = config.daysBefore || 3;
                const expirationDate = new Date(user.subscriptionExpiresAt);
                const reminderDate = new Date(expirationDate.getTime() - (daysBefore * 24 * 60 * 60 * 1000));

                // Se passou da data do lembrete e ainda não notificamos hoje (ou no intervalo)
                if (now >= reminderDate && (!user.lastBillingReminderAt || isDifferentDay(now, user.lastBillingReminderAt))) {
                    
                    console.log(`Enviando lembrete de cobrança para: ${user.email}`);

                    // Ação: Notificar no Painel
                    if (config.channel === "painel" || config.channel === "both") {
                        await createNotification(
                            user.id,
                            null, // Global notification or per workspace? null for global
                            "Lembrete de Assinatura",
                            config.message || "Sua assinatura vence em breve. Regularize para não perder o acesso.",
                            "WARNING"
                        );
                    }

                    // Ação: Enviar WhatsApp
                    if ((config.channel === "whatsapp" || config.channel === "both") && user.phone) {
                        // Buscar uma conexão ativa para enviar
                        const connection = await prisma.connection.findFirst({
                            where: { userId: user.id, status: "CONNECTED" }
                        });

                        if (connection) {
                            const cleanPhone = user.phone.replace(/\D/g, "");
                            try {
                                await sendMessage(
                                    connection.apiUrl,
                                    connection.apiKey,
                                    cleanPhone,
                                    config.message || "Olá! Seu plano Rastreia.ai expira em breve. Evite interrupções realizando o pagamento."
                                );
                            } catch (err) {
                                console.error(`Erro ao enviar WhatsApp de cobrança para ${user.email}:`, err.message);
                            }
                        }
                    }

                    // Atualizar data do último lembrete
                    await prisma.user.update({
                        where: { id: user.id },
                        data: { lastBillingReminderAt: now }
                    });
                }
            }
        } catch (error) {
            console.error("Erro no Billing Worker:", error);
        }
    }, 3600000); // 1 hora
};

function isDifferentDay(d1, d2) {
    const date1 = new Date(d1);
    const date2 = new Date(d2);
    return date1.toDateString() !== date2.toDateString();
}
