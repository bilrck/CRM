import prisma from "../config/prisma.js";
import { sendMessage } from "./evolution.service.js";
import { createNotification } from "../controllers/notifications.controller.js";

export const startFollowUpWorker = () => {
  console.log("Follow-up worker started");

  // Rodar a cada 1 minuto
  setInterval(async () => {
    try {
      const now = new Date();

      // 1. PROCESSAR LEMBRETES ANTECIPADOS
      const leadsForReminder = await prisma.lead.findMany({
        where: {
          reminderDate: { lte: now },
          reminderTriggered: false,
          NOT: { reminderDate: null },
        },
      });

      for (const lead of leadsForReminder) {
        const config = lead.followUpConfig
          ? typeof lead.followUpConfig === "string"
            ? JSON.parse(lead.followUpConfig)
            : lead.followUpConfig
          : {};
        const actions = lead.followUpAction
          ? lead.followUpAction.split(",")
          : [];

        // Ação: Notificar no Painel
        if (actions.includes("NOTIFY") && lead.ownerId) {
          await createNotification(
            lead.ownerId,
            lead.workspaceId,
            "Lembrete de Follow-up",
            `Atenção: Follow-up com ${lead.name} em breve!`,
            "WARNING",
            "message"
          );
        }

        // Ação: Enviar WhatsApp (Lembrete)
        if (actions.includes("REMINDER") && config.message) {
          const connection = await prisma.connection.findFirst({
            where: { workspaceId: lead.workspaceId, status: "CONNECTED" },
          });

          if (connection && lead.phone) {
            const cleanPhone = lead.phone.replace(/\D/g, "");
            try {
              await sendMessage(
                connection.apiUrl,
                connection.apiKey,
                cleanPhone,
                config.message,
              );
            } catch (err) {
              console.error(
                `Erro no lembrete WhatsApp p/ ${lead.name}:`,
                err.message,
              );
            }
          }
        }

        // Marcar lembrete como disparado
        await prisma.lead.update({
          where: { id: lead.id },
          data: { reminderTriggered: true },
        });
      }

      // 2. PROCESSAR AÇÕES PRINCIPAIS (NO HORÁRIO DO FOLLOW-UP)
      const pendingLeads = await prisma.lead.findMany({
        where: {
          nextFollowUpDate: { lte: now },
          followUpTriggered: false,
          NOT: { nextFollowUpDate: null },
        },
      });

      for (const lead of pendingLeads) {
        const config = lead.followUpConfig
          ? typeof lead.followUpConfig === "string"
            ? JSON.parse(lead.followUpConfig)
            : lead.followUpConfig
          : {};
        const actions = lead.followUpAction
          ? lead.followUpAction.split(",")
          : [];

        // Se o lembrete não foi disparado ainda (ex: timing era "na hora"), dispara agora
        if (!lead.reminderTriggered) {
          // (Opcional: Mesma lógica de NOTIFY/REMINDER do bloco acima se desejar redundância)
        }

        // Ação: Mover Funil
        if (actions.includes("MOVE_FUNNEL") && config.stageId) {
          await prisma.lead.update({
            where: { id: lead.id },
            data: { stageId: Number(config.stageId) },
          });
        }

        // Marcar follow-up principal como disparado
        await prisma.lead.update({
          where: { id: lead.id },
          data: { followUpTriggered: true },
        });
      }
    } catch (error) {
      console.error("Erro no Follow-up Worker:", error);
    }
  }, 60000);
};
