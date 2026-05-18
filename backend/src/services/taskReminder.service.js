import cron from "node-cron";
import prisma from "../config/prisma.js";
import { sendMessage } from "./evolution.service.js";
import { sendWhatsAppNotification } from "./notifications.service.js";
import { createNotification } from "../controllers/notifications.controller.js";
import { logger } from "../utils/logger.js";

export const startTaskReminderWorker = () => {
  console.log("Task reminder worker started (every minute)");
  
  // Runs every minute
  cron.schedule("* * * * *", async () => {
    const now = new Date();
    
    try {
      // Find tasks that need reminder, not sent yet, and reminderAt <= now
      const tasks = await prisma.task.findMany({
        where: {
          reminderAt: { lte: now },
          reminderSent: false,
          status: "PENDING",
        },
        include: {
          user: true,
          workspace: true,
          lead: true
        }
      });

      for (const task of tasks) {
        try {
          const { reminderType, user, lead, title } = task;
          
          let notificationSent = false;

          // 1. WhatsApp Reminder using configured notification channel
          if (reminderType === "WHATSAPP" || reminderType === "BOTH") {
            const message = `🚨 *LEMBRETE DE TAREFA*\n\n📌 *Tarefa:* ${title}\n📅 *Vencimento:* ${task.dueDate ? new Date(task.dueDate).toLocaleString('pt-BR') : 'Sem data'}\n${lead ? `👤 *Lead:* ${lead.name}` : ''}\n\n_Enviado automaticamente por Rastreia.ai_`;
            
            try {
              const sent = await sendWhatsAppNotification(user.id, task.workspaceId, "LEMBRETE DE TAREFA", message);
              if (sent) {
                notificationSent = true;
                await logger.info("TASK_REMINDER", `Lembrete WhatsApp enviado para ${user.name}`, { taskId: task.id });
              } else {
                await logger.warn("TASK_REMINDER", `Falha ao enviar WhatsApp: Sem conexões ativas ou destino não configurado`, { taskId: task.id });
              }
            } catch (err) {
              await logger.error("TASK_REMINDER", `Erro ao enviar WhatsApp: ${err.message}`, { taskId: task.id });
            }
          }

          // 2. System Notification
          if (reminderType === "SYSTEM" || reminderType === "BOTH") {
             try {
               await createNotification(
                 user.id,
                 task.workspaceId,
                 "Lembrete de Tarefa",
                 `Tarefa: ${title}`,
                 "INFO",
                 "taskReminder"
               );
               notificationSent = true;
               await logger.info("TASK_REMINDER", `Lembrete de sistema disparado para ${user.name}`, { taskId: task.id });
             } catch (err) {
               await logger.error("TASK_REMINDER", `Erro ao criar notificação de sistema: ${err.message}`, { taskId: task.id });
             }
          }

          // Marcar como processado para evitar loops infinitos caso a API externa falhe
          await prisma.task.update({
            where: { id: task.id },
            data: { reminderSent: true }
          });

        } catch (error) {
          console.error(`Erro ao processar lembrete da tarefa ${task.id}:`, error);
        }
      }
    } catch (error) {
      console.error("Erro no worker de lembrete de tarefas:", error);
    }
  });
};
