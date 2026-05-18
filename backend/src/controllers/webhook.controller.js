import prisma from "../config/prisma.js";
import { logger } from "../utils/logger.js";
import { sendMessage, sendMedia } from "../services/evolution.service.js";

export const receiveWebhook = async (req, res) => {
  try {
    const { uniqueId } = req.params;
    const payload = req.body;

    console.log(`Webhook recebido [${uniqueId}]:`, payload);

    // Buscar conexão pela instância (Evolution)
    const connection = await prisma.connection.findFirst({
      where: {
        OR: [
          { config: { path: ["instanceName"], equals: uniqueId } },
          { webhookUrl: { contains: uniqueId } }, // Fallback legacy
        ],
      },
    });

    if (!connection) {
      return res.status(404).json({ error: "Webhook endpoint not found" });
    }

    // 🔥 Evento de Status da Conexão (Evolution)
    if (payload.type === "connection.update") {
      const { state } = payload.data;
      // state: close, connecting, open, refused
      let newStatus = connection.status;

      if (state === "open") newStatus = "connected";
      else if (state === "close") newStatus = "disconnected";
      else if (state === "connecting") newStatus = "connecting";

      if (newStatus !== connection.status) {
        await prisma.connection.update({
          where: { id: connection.id },
          data: { status: newStatus },
        });
        console.log(
          `Status da Conexão [${connection.name}] atualizado: ${newStatus}`,
        );
      }
      return res.json({ success: true });
    }

    // 🔥 Evento de Sincronização de Chats (Evolution)
    if (payload.type === "chats.upsert" || payload.type === "chats.set") {
      const chats = Array.isArray(payload.data) ? payload.data : [payload.data];
      console.log(`Sincronizando ${chats.length} chats via Webhook.`);

      for (const chat of chats) {
        const remoteJid = chat.id || chat.remoteJid;
        if (!remoteJid) continue;

        await prisma.whatsappConversation.upsert({
          where: {
            remoteJid_connectionId: { remoteJid, connectionId: connection.id },
          },
          update: {
            name: chat.name || undefined,
            workspaceId: connection.workspaceId,
            connectionId: connection.id,
          },
          create: {
            remoteJid,
            name: chat.name || remoteJid.split("@")[0],
            status: "OPEN",
            workspaceId: connection.workspaceId,
            connectionId: connection.id,
          },
        });
      }
      return res.json({ success: true });
    }

    const eventType = payload.type || payload.event;
    console.log(`[Webhook] Evento: ${eventType}, UniqueId: ${uniqueId}`);

    if (
      eventType === "messages.upsert" ||
      eventType === "MESSAGES_UPSERT" ||
      (payload.data && (payload.data.key || (Array.isArray(payload.data) && payload.data[0]?.key)))
    ) {
      // Evolution pode mandar objeto ou array em messages.upsert
      const messagesArr = Array.isArray(payload.data) ? payload.data : (payload.data.messages || [payload.data]);
      
      for (const msgData of messagesArr) {
        if (!msgData || !msgData.key) continue;

        let remoteJid = msgData.key.remoteJid;
        const fromMe = msgData.key.fromMe || false;

        // 🔥 Normalizar JID (remover sufixo :0, :1 etc)
        const normalizeJid = (jid) => {
          if (!jid || typeof jid !== "string") return jid;
          const [idPart, domainPart] = jid.split("@");
          return `${idPart.split(":")[0]}@${domainPart || "s.whatsapp.net"}`;
        };

        remoteJid = normalizeJid(remoteJid);
        console.log(`[Webhook] Processando mensagem de ${remoteJid} (fromMe: ${fromMe})`);

        // Ignorar status update (broadcast)
        if (remoteJid === "status@broadcast") continue;

      // 1. Localizar ou Criar Conversa
      let conversation = await prisma.whatsappConversation.findUnique({
        where: {
          remoteJid_connectionId: { remoteJid, connectionId: connection.id },
        },
      });

      if (!conversation) {
        console.log("Criando nova conversa via Webhook para:", remoteJid);
        conversation = await prisma.whatsappConversation.create({
          data: {
            remoteJid,
            name: msgData.pushName || remoteJid.split("@")[0],
            status: "OPEN",
            userId: connection.userId,
            workspaceId: connection.workspaceId,
            connectionId: connection.id,
          },
        });
      } else if (
        !conversation.userId ||
        !conversation.connectionId ||
        !conversation.workspaceId
      ) {
        // Vincular conversas órfãs ou legadas
        conversation = await prisma.whatsappConversation.update({
          where: { id: conversation.id },
          data: {
            userId: connection.userId,
            workspaceId: connection.workspaceId,
            connectionId: connection.id,
          },
        });
      }

      // 2. Extrair conteúdo e tipo
      const pushName =
        msgData.pushName ||
        msgData?.key?.pushName ||
        msgData?.participantPushName;
      const jid =
        msgData.key?.remoteJidAlt || msgData.key?.remoteJid || remoteJid;
      const isGroup = jid.endsWith("@g.us");
      const isPhoneLike = (name) => /^\d{8,15}$/.test(name || "");
      const messageContent = msgData.message || msgData;
      let body = "";
      let type = "text";

      if (typeof messageContent === "string") {
        body = messageContent;
      } else if (messageContent) {
        if (messageContent.imageMessage) {
          type = "image";
          body = messageContent.imageMessage.caption || "[Foto]";
        } else if (messageContent.videoMessage) {
          type = "video";
          body = messageContent.videoMessage.caption || "[Vídeo]";
        } else if (messageContent.audioMessage) {
          type = "audio";
          body = "[Áudio]";
        } else if (messageContent.documentMessage) {
          type = "document";
          body = messageContent.documentMessage.fileName || "[Documento]";
        } else if (messageContent.stickerMessage) {
          type = "sticker";
          body = "[Figurinha]";
        } else if (messageContent.locationMessage) {
          type = "location";
          body = "[Localização]";
        } else if (messageContent.contactMessage) {
          type = "contact";
          body = `[Contato: ${messageContent.contactMessage.displayName || "Desconhecido"}]`;
        } else {
          body =
            messageContent.conversation ||
            messageContent.extendedTextMessage?.text ||
            "";
        }
      }

      // Evitar duplicidade (pelo timestamp and fromMe)
      const messageTimestamp =
        msgData.messageTimestamp || Math.floor(Date.now() / 1000);
      const tsMs =
        messageTimestamp > 10000000000
          ? messageTimestamp
          : messageTimestamp * 1000;
      const createdAtDate = new Date(tsMs);

      const exists = await prisma.whatsappMessage.findFirst({
        where: {
          conversationId: conversation.id,
          createdAt: createdAtDate,
          fromMe,
        },
      });

      if (!exists) {
        // 🔥 MEDIA HANDLING (On-Demand)
        // We no longer auto-download media on webhook.
        // It will be fetched when the conversation is opened in the front-end.
        let mediaUrl = null;
        let mediaMimeType = null;

        const senderName = isGroup ? pushName : null;
        const whatsappId = msgData.key?.id;

        const newMsg = await prisma.whatsappMessage.create({
          data: {
            conversationId: conversation.id,
            body: body.substring(0, 1000),
            fromMe,
            type,
            mediaUrl,
            mediaMimeType,
            senderName,
            whatsappId,
            createdAt: createdAtDate,
          },
        });

        const updateConversationData = {
          lastMessage: newMsg.body.substring(0, 100),
          lastMessageAt: createdAtDate,
          lastMessageFromMe: fromMe,
          unreadCount: fromMe
            ? conversation.unreadCount
            : conversation.unreadCount + 1,
          updatedAt: new Date(),
        };

        if (
          pushName &&
          !fromMe &&
          !isGroup &&
          pushName.toLowerCase() !== "você" &&
          pushName !== "Desconhecido" &&
          (!conversation.name || isPhoneLike(conversation.name))
        ) {
          updateConversationData.name = pushName;
        }

        // Atualizar conversa (lastMessage e Unread)
        await prisma.whatsappConversation.update({
          where: { id: conversation.id },
          data: updateConversationData,
        });

        // Registrar Log do Sistema
        await logger.info(
          "WHATSAPP",
          `Nova mensagem de ${remoteJid}: ${body.substring(0, 50)}`,
          {
            workspaceId: connection.workspaceId,
            userId: connection.userId,
            data: { conversationId: conversation.id, fromMe, type },
          },
        );

        try {
          const { getIO } = await import("../services/socket.service.js");
          const io = getIO();
          const room = `workspace:${connection.workspaceId}`;

          // Pre-check if this message makes the conversation tracked
          let isTracked = conversation.isTracked;
          if (!isTracked && !fromMe && !isGroup) {
            try {
              const rules = await prisma.leadTrackingRule.findMany({
                where: { workspaceId: connection.workspaceId, isActive: true },
              });
              const messageBody = body.toLowerCase();
              const matched = rules.some((rule) => {
                const keywords = rule.keywords.split(",").map((k) => k.trim().toLowerCase());
                return keywords.some((k) => messageBody.includes(k));
              });
              if (matched) {
                isTracked = true;
              }
            } catch (err) {
              console.error("Error pre-checking tracking rules:", err);
            }
          }

          // Standardized Payload for real-time
          const realTimePayload = {
            conversationId: conversation.id,
            jid: remoteJid,
            fromMe,
            body: newMsg.body,
            type: newMsg.type,
            message: newMsg, // Full message object for safety
            workspaceId: connection.workspaceId,
            timestamp: messageTimestamp,
            isTracked
          };

          io.to(room).emit("message:new", realTimePayload);

          console.log(
            `🚀 Emitindo message:new para sala ${room}, conversa ${conversation.id}`,
          );
        } catch (socketError) {
          console.error("Erro ao emitir socket:", socketError);
        }
      }

        // 🔥 Rastreamento de Leads por Palavras-Chave
        if (fromMe || isGroup) continue; // Ignorar mensagens enviadas por mim ou em grupos para o rastreamento

      try {
        const rules = await prisma.leadTrackingRule.findMany({
          where: { workspaceId: connection.workspaceId, isActive: true },
        });

        console.log(`[Tracking] Buscando regras para workspace ${connection.workspaceId}. Encontradas: ${rules.length}`);

        for (const rule of rules) {
          const keywords = rule.keywords
            .split(",")
            .map((k) => k.trim().toLowerCase());
          const messageBody = body.toLowerCase();

          const matched = keywords.some((k) => messageBody.includes(k));

          if (matched) {
            console.log(`[Tracking] Match encontrado! Regra ID: ${rule.id}, Keywords: ${rule.keywords}`);
            
            // Achar o Lead
            let lead = await prisma.lead.findFirst({
              where: {
                OR: [{ phone: remoteJid.split("@")[0] }, { phone: remoteJid }],
                workspaceId: connection.workspaceId,
              },
            });

            if (lead) {
              console.log(`[Tracking] Atualizando lead existente: ${lead.id}`);
              const upgradeData = {};
              if (rule.funnelId && rule.stageId) {
                if (
                  lead.funnelId !== rule.funnelId ||
                  lead.stageId !== rule.stageId
                ) {
                  upgradeData.funnelId = rule.funnelId;
                  upgradeData.stageId = rule.stageId;
                }
              } else if (rule.targetStatus && lead.status !== rule.targetStatus) {
                upgradeData.status = rule.targetStatus;
              }

              if (Object.keys(upgradeData).length > 0) {
                await prisma.lead.update({
                  where: { id: lead.id },
                  data: upgradeData,
                });
              }
            } else if (rule.createLead) {
              console.log(`[Tracking] Criando novo lead para: ${remoteJid}`);
              lead = await prisma.lead.create({
                data: {
                  name: pushName || "Lead WhatsApp",
                  phone: remoteJid.split("@")[0],
                  status: rule.targetStatus || "new",
                  funnelId: rule.funnelId || undefined,
                  stageId: rule.stageId || undefined,
                  ownerId: connection.userId,
                  workspaceId: connection.workspaceId,
                  source: "whatsapp_tracking",
                },
              });
            }

            await prisma.whatsappConversation.update({
              where: { id: conversation.id },
              data: { isTracked: true, leadId: lead?.id || undefined },
            });

            // 🔥 Auto Reply Logic
            if (rule.replyMessage || rule.replyMediaUrl) {
              try {
                // Determine base URL: force it to handle /instance/ if present in apiSecret
                let baseUrl = connection.apiSecret || ""; 
                const apiKey = connection.apiKey;
                const number = remoteJid.split("@")[0];

                // Replace Variables
                let msg = rule.replyMessage || "";
                if (msg) {
                  const hour = new Date().getHours();
                  let greeting = "Olá";
                  if (hour >= 5 && hour < 12) greeting = "Bom dia";
                  else if (hour >= 12 && hour < 18) greeting = "Boa tarde";
                  else greeting = "Boa noite";

                  // Fetch owner name if requested
                  let ownerName = "Consultor";
                  if (msg.includes("{nome_user}") && connection.userId) {
                    const owner = await prisma.user.findUnique({
                      where: { id: connection.userId },
                    });
                    if (owner) ownerName = owner.name;
                  }

                  msg = msg
                    .replace(/{pushname}/g, pushName || "")
                    .replace(/{telefone}/g, number)
                    .replace(/{saudacao}/g, greeting)
                    .replace(/{empresa}/g, connection.name || "Nossa Empresa")
                    .replace(/{nome_user}/g, ownerName);
                }

                const finalMediaType = rule.replyMediaType || (rule.replyMessage ? "text" : "image");

                console.log(`[AutoReply] Tentando enviar (${finalMediaType}) para ${number}`);

                if (finalMediaType === "text" && msg) {
                  await sendMessage(baseUrl, apiKey, number, msg);
                } else if (
                  ["image", "document", "video"].includes(finalMediaType)
                ) {
                  await sendMedia(
                    baseUrl,
                    apiKey,
                    number,
                    rule.replyMediaUrl,
                    finalMediaType,
                    msg,
                  );
                }
                console.log(
                  `[AutoReply] Enviado com sucesso para ${number} (Regra ID: ${rule.id})`,
                );
              } catch (replyError) {
                console.error("Erro ao enviar auto-reply:", replyError.message);
              }
            }

            await logger.info(
              "LEAD",
              `Lead ${lead ? "atualizado/criado" : "not found"} via rastreamento de palavra-chave: ${remoteJid}`,
              {
                workspaceId: connection.workspaceId,
                userId: connection.userId,
                data: {
                  ruleId: rule.id,
                  keywords: rule.keywords,
                  status: rule.targetStatus,
                },
              },
            );
            break;
          }
          }
        } catch (trackError) {
          console.error("Erro rastreamento lead:", trackError);
        }
      }
      return res.json({ success: true });
    }

    // Lógica genérica de Lead (Webhook genérico)
    const email = payload.email || payload.contact?.email;
    const phone = payload.phone || payload.contact?.phone || payload.whatsapp;
    const name = payload.name || payload.contact?.name || "Lead Webhook";

    if (email || phone) {
      const value = payload.value || payload.valor || 0;
      await prisma.lead.create({
        data: {
          name,
          email,
          phone,
          value: Number(value),
          status: "new",
          source: "webhook",
          workspaceId: connection.workspaceId,
        },
      });
      console.log("Lead criado via Webhook");
    }

    return res.json({ received: true });
  } catch (error) {
    console.error("Erro ao processar webhook:", error);
    return res.status(500).json({ error: "Internal Error" });
  }
};
