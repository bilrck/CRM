import prisma from "../config/prisma.js";
import fs from "fs";
import path from "path";
import {
  processAndStoreMedia,
  getEvolutionMediaBuffer,
} from "../services/s3.service.js";
import { request, ExternalApiError } from "../utils/api-client.js";
import { sendMessage } from "../services/evolution.service.js";

// Listar conversas (com filtros de status/responsável)
export const getConversations = async (req, res) => {
  try {
    const workspaceId = req.workspaceId;
    if (!workspaceId) return res.json([]);

    const { status, search, connectionId } = req.query;
    const where = { workspaceId }; // Enforce Workspace

    if (status) where.status = status;

    // Filter by connection if provided
    if (connectionId && connectionId !== "all") {
      where.connectionId = Number(connectionId);
    }

    // 🔥 Filtro de Rastreamento
    // Por padrão mostra somente rastreados, a menos que especificado 'all'
    const filter = req.query.filter || "tracked";
    if (filter === "tracked" && !search) {
      where.isTracked = true;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { remoteJid: { contains: search } },
      ];
    }

    const conversations = await prisma.whatsappConversation.findMany({
      where,
      orderBy: { lastMessageAt: "desc" }, // 🔥 Ordenar por última mensagem
      include: {
        user: { select: { name: true, id: true } },
        _count: { select: { messages: true } },
      },
    });

    return res.json(conversations);
  } catch (error) {
    console.error("Erro ao buscar conversas:", error);
    return res.status(500).json({ error: "Erro interno" });
  }
};

// Helper para Normalizar JID (remover sufixo :0, :1 etc)
const normalizeJid = (jid) => {
  if (!jid || typeof jid !== "string") return jid;
  const [idPart, domainPart] = jid.split("@");
  return `${idPart.split(":")[0]}@${domainPart || "s.whatsapp.net"}`;
};

// Helper para salvar mensagens e atualizar conversa (WhatsApp Web Style)
async function upsertMessage(
  conversationId,
  msgData,
  workspaceId = null,
  connection = null,
) {
  try {
    const pushName =
      msgData.pushName ||
      msgData?.key?.pushName ||
      msgData?.participantPushName ||
      "Desconhecido";

    const fromMe = msgData.key?.fromMe ?? msgData.fromMe ?? false;

    if (
      pushName &&
      !fromMe &&
      pushName.toLowerCase() !== "você" &&
      pushName !== "Desconhecido"
    ) {
      console.log(
        `[WhatsApp] Atualizando nome da conversa ${conversationId} para: ${pushName} (fromMe: ${fromMe})`,
      );
      await prisma.whatsappConversation.updateMany({
        where: {
          id: conversationId,
          OR: [
            { name: null },
            { name: "" },
            { name: { matches: "^[0-9]{8,15}$" } }, // nome é só número
          ],
        },
        data: {
          name: pushName,
        },
      });
    }
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

    // const fromMe moved up
    const messageTimestamp =
      msgData.messageTimestamp || Math.floor(Date.now() / 1000);

    if (!body && type === "text") return null;

    const tsMs =
      messageTimestamp > 10000000000
        ? messageTimestamp
        : messageTimestamp * 1000;
    const createdAtDate = new Date(tsMs);

    // Evitar duplicidade (Checagem mais flexível)
    let msg = await prisma.whatsappMessage.findFirst({
      where: {
        conversationId,
        createdAt: createdAtDate,
        fromMe,
      },
    });

    // 🔥 MEDIA HANDLING (On-Demand only)
    let mediaUrl = null;
    let mediaMimeType = null;

    // We no longer auto-download here. Media is downloaded when the conversation is opened (on-demand).

    if (!msg) {
      const whatsappId = msgData.key?.id || msgData.id;
      msg = await prisma.whatsappMessage.create({
        data: {
          conversationId,
          body: body.substring(0, 1000),
          fromMe,
          type,
          mediaUrl,
          mediaMimeType,
          whatsappId,
          createdAt: createdAtDate,
        },
      });

      console.log(
        `Mensagem salva p/ Conversa ${conversationId}: ${body.substring(0, 20)}...`,
      );

      // 🔥 Atualizar Cabeçalho da Conversa
      await prisma.whatsappConversation.update({
        where: { id: conversationId },
        data: {
          lastMessage: msg.body.substring(0, 100),
          lastMessageAt: createdAtDate,
          lastMessageFromMe: fromMe,
          updatedAt: new Date(),
        },
      });

      // 🔥 Emitir via Socket
      if (workspaceId) {
        try {
          const { getIO } = await import("../services/socket.service.js");
          const io = getIO();
          io.to(`workspace:${workspaceId}`).emit("message:new", {
            conversationId,
            message: msg,
            workspaceId,
          });
        } catch (err) {
          console.error("Socket emit error:", err.message);
        }
      }
    }
    return msg;
  } catch (err) {
    console.error("Erro no upsertMessage:", err);
    return null;
  }
}

// Obter mensagens de uma conversa
export const getMessages = async (req, res) => {
  try {
    const { id } = req.params;
    const conversation = await prisma.whatsappConversation.findUnique({
      where: { id: Number(id) },
      include: { connection: true },
    });

    if (!conversation)
      return res.status(404).json({ error: "Chat não encontrado" });

    // Verifica Workspace
    if (
      conversation.workspaceId !== req.workspaceId &&
      req.user.role !== "ADMIN"
    ) {
      return res.status(403).json({ error: "Acesso negado" });
    }

    // Buscar local primeiro
    const localMessages = await prisma.whatsappMessage.findMany({
      where: { conversationId: Number(id) },
      orderBy: { createdAt: "asc" },
    });

    // Silent Sync: Tentar buscar novas mensagens na API em background
    const connection = conversation.connection;
    console.log(
      `DEBUG: Chat=${id}, ConnID=${conversation.connectionId}, HasConn=${!!connection}, Provider=${connection?.provider}`,
    );

    if (
      connection &&
      (connection.provider === "evolution" ||
        connection.provider === "whatsapp") &&
      connection.config
    ) {
      const EVO_URL = process.env.EVOLUTION_API_URL;
      const EVO_GLOBAL_KEY = process.env.EVOLUTION_API_KEY;

      // Try to parse config if it's a string
      let config = connection.config;
      if (typeof config === "string") {
        try {
          config = JSON.parse(config);
        } catch (e) {
          console.error("Erro parse config string");
        }
      }

      const instanceName = config?.instanceName || connection.name;

      console.log(
        `Iniciando Silent Sync para Conversa ${id} [${conversation.remoteJid}] na instância "${instanceName}"`,
      );

      const requestBody = {
        where: { remoteJid: conversation.remoteJid },
        limit: 100,
      };

      fetch(`${EVO_URL}/chat/findMessages/${instanceName}`, {
        method: "POST",
        headers: {
          apikey: EVO_GLOBAL_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      })
        .then(async (r) => {
          const text = await r.text();
          if (r.ok) {
            let data;
            try {
              data = JSON.parse(text);
            } catch (e) {
              console.error("Erro parse JSON Silent Sync:", text);
              return;
            }

            const records = data.records || (Array.isArray(data) ? data : []);
            console.log(
              `Silent Sync OK: Encontrou ${records.length} mensagens.`,
            );

            for (const m of records) {
              await upsertMessage(
                conversation.id,
                m,
                conversation.workspaceId,
                connection,
              );
            }
          } else {
            console.error(`Silent Sync Erro API (${r.status}):`, text);
          }
        })
        .catch((e) => console.error("Silent Sync Network Error:", e));
    } else {
      console.log(
        `Silent Sync ignorado: Connection OK? ${!!connection}, Provider: ${connection?.provider}, Data: ${JSON.stringify(connection?.config)}`,
      );
    }

    // Zerar contador de não lidas
    await prisma.whatsappConversation.update({
      where: { id: Number(id) },
      data: { unreadCount: 0 },
    });

    // 🔥 ON-DEMAND MEDIA FETCH
    // Identify messages that are media but don't have a local/S3 URL yet
    const mediaMessagesToProcess = localMessages.filter(
      (m) =>
        ["image", "video", "audio", "document", "sticker"].includes(m.type) &&
        !m.mediaUrl &&
        m.whatsappId,
    );

    if (mediaMessagesToProcess.length > 0 && connection) {
      const instanceName =
        connection.config?.instanceName ||
        (typeof connection.config === "string"
          ? JSON.parse(connection.config).instanceName
          : null);

      if (instanceName) {
        console.log(
          `[On-Demand] Processando ${mediaMessagesToProcess.length} mídias para conversa ${id}`,
        );

        // Process in background to not block chat opening
        (async () => {
          for (const msg of mediaMessagesToProcess) {
            try {
              // We need the full message payload structure which might not be fully in 'localMessages'
              // but processAndStoreMedia can work with what we have if we craft it
              const result = await processAndStoreMedia(
                instanceName,
                msg.whatsappId,
                msg.type,
                {}, // messageContent - might need more info if available
                conversation.workspaceId,
              );

              if (result.url) {
                await prisma.whatsappMessage.update({
                  where: { id: msg.id },
                  data: {
                    mediaUrl: result.url,
                    mediaMimeType: result.mimeType,
                  },
                });
              }
            } catch (e) {
              console.error(`[On-Demand] Erro ao processar msg ${msg.id}:`, e);
            }
          }
        })();
      }
    }

    return res.json(localMessages);
  } catch (error) {
    console.error("Erro ao buscar mensagens:", error);
    return res.status(500).json({ error: "Erro interno" });
  }
};

// Enviar mensagem (Texto simples por enquanto)
export const sendWhatsappMessage = async (req, res) => {
  try {
    const { conversationId, body, phone, leadId, leadName } = req.body;
    const { id: userId } = req.user;

    let conversation = null;

    if (conversationId) {
      conversation = await prisma.whatsappConversation.findUnique({
        where: { id: Number(conversationId) },
      });

      if (!conversation)
        return res.status(404).json({ error: "Conversa não encontrada" });

      // Verificação de Workspace
      if (
        conversation.workspaceId !== req.workspaceId &&
        req.user.role !== "ADMIN"
      ) {
        return res
          .status(403)
          .json({ error: "Acesso negado: Conversa pertence a outro workspace" });
      }
    } else if (phone) {
      // Formatar JID
      const cleanPhone = phone.replace(/\D/g, "");
      if (!cleanPhone) {
        return res.status(400).json({ error: "Telefone inválido" });
      }
      const remoteJid = `${cleanPhone}@s.whatsapp.net`;

      // Buscar se já existe conversa no workspace
      conversation = await prisma.whatsappConversation.findFirst({
        where: { remoteJid, workspaceId: req.workspaceId },
      });

      if (!conversation) {
        // Obter primeira conexão ativa
        const connection = await prisma.connection.findFirst({
          where: {
            provider: "evolution",
            status: "connected",
            workspaceId: req.workspaceId,
          },
        });

        if (!connection) {
          return res.status(400).json({
            error: "Nenhuma conexão Evolution ativa encontrada para envio automático do sistema.",
          });
        }

        conversation = await prisma.whatsappConversation.create({
          data: {
            remoteJid,
            name: leadName || phone,
            status: "OPEN",
            connectionId: connection.id,
            userId,
            workspaceId: req.workspaceId,
            leadId: leadId ? Number(leadId) : null,
            lastMessage: body.substring(0, 100),
            lastMessageAt: new Date(),
          },
        });
      }
    } else {
      return res.status(400).json({ error: "Parâmetros insuficientes: informe conversationId ou phone." });
    }

    // Buscar Conexão Específica desta conversa
    let connection = null;
    if (conversation.connectionId) {
      connection = await prisma.connection.findUnique({
        where: { id: conversation.connectionId },
      });
    }

    // Fallback: Se não tiver connectionId (legado), pega a primeira do usuário no Workspace
    if (!connection) {
      connection = await prisma.connection.findFirst({
        where: {
          provider: "evolution",
          status: "connected",
          workspaceId: req.workspaceId,
        },
      });
    }

    if (!connection) {
      return res.status(400).json({
        error: "Nenhuma conexão Evolution ativa encontrada para envio.",
      });
    }

    // Enviar via Evolution
    const evoSent = await sendMessage(
      connection.apiSecret,
      connection.apiKey,
      conversation.remoteJid,
      body,
    );

    // Salvar mensagem no banco usando o helper para atualizar o cabeçalho
    const message = await upsertMessage(
      conversation.id,
      {
        key: { fromMe: true, remoteJid: conversation.remoteJid },
        message: { conversation: body },
        messageTimestamp: Math.floor(Date.now() / 1000),
      },
      conversation.workspaceId,
      connection,
    );

    // Garantir status OPEN e vincular leadId se houver
    await prisma.whatsappConversation.update({
      where: { id: conversation.id },
      data: {
        status:
          conversation.status === "PENDING" ? "OPEN" : conversation.status,
        leadId: leadId && !conversation.leadId ? Number(leadId) : undefined,
      },
    });

    return res.json(message);
  } catch (error) {
    console.error("Erro ao enviar mensagem:", error);
    return res.status(500).json({ error: "Erro ao enviar mensagem: " + error.message });
  }
};

// Atualizar status da conversa
export const updateConversationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, userId } = req.body;

    const conversation = await prisma.whatsappConversation.findUnique({
      where: { id: Number(id) },
    });
    if (!conversation)
      return res.status(404).json({ error: "Conversa não encontrada" });

    // Verificação de Workspace
    if (
      conversation.workspaceId !== req.workspaceId &&
      req.user.role !== "ADMIN"
    ) {
      return res.status(403).json({ error: "Acesso negado" });
    }

    const data = {};
    if (status) data.status = status;
    if (userId !== undefined) data.userId = userId; // pode ser null para desatribuir

    const updated = await prisma.whatsappConversation.update({
      where: { id: Number(id) },
      data,
    });

    return res.json(updated);
  } catch (error) {
    console.error("Erro ao atualizar conversa:", error);
    return res.status(500).json({ error: "Erro interno" });
  }
};

// Importar Chats da API (Manual Sync)
export const importChats = async (req, res) => {
  try {
    const { connectionId } = req.body;

    const connection = await prisma.connection.findUnique({
      where: { id: Number(connectionId) },
    });

    // Check permissions (se connection pertence ao workspace)
    if (
      !connection ||
      (connection.workspaceId !== req.workspaceId && req.user.role !== "ADMIN")
    ) {
      return res
        .status(403)
        .json({ error: "Acesso negado ou conexão inválida" });
    }

    if (
      connection.provider !== "evolution" ||
      !connection.config?.instanceName
    ) {
      return res
        .status(400)
        .json({ error: "Conexão inválida para importação" });
    }

    const EVO_URL = process.env.EVOLUTION_API_URL;
    const EVO_GLOBAL_KEY = process.env.EVOLUTION_API_KEY;

    // Fetch Chats from Evolution
    const chats = await request(
      `${EVO_URL}/chat/findChats/${connection.config.instanceName}`,
      {
        method: "POST",
        headers: {
          apikey: EVO_GLOBAL_KEY,
        },
        body: JSON.stringify({}), // Payload vazio
      },
    );
    console.log(
      "Conversas retornadas pela API:",
      Array.isArray(chats) ? chats.length : chats,
    );

    if (!Array.isArray(chats)) {
      console.error("Formato inválido recebido:", chats);
      return res
        .status(500)
        .json({ error: "Formato inválido da Evolution API", received: chats });
    }

    let count = 0;
    for (const chat of chats) {
      // ... (Lógica de importação mantida, com correções de workspace)

      // 🔥 Normalizar remoteJid
      const normalizeJid = (jid) => {
        if (!jid || typeof jid !== "string") return jid;
        const [idPart, domainPart] = jid.split("@");
        return `${idPart.split(":")[0]}@${domainPart || "s.whatsapp.net"}`;
      };

      let remoteJid = normalizeJid(chat.remoteJid || chat.jid || chat.id);

      if (remoteJid?.includes("@lid") && chat.lastMessage?.key?.remoteJidAlt) {
        remoteJid = normalizeJid(chat.lastMessage.key.remoteJidAlt);
      }
      if (!remoteJid || !remoteJid.includes("@")) continue;

      let bestName =
        chat.name ||
        chat.contact?.name ||
        chat.pushName ||
        chat.lastMessage?.pushName ||
        (remoteJid.includes("@") ? remoteJid.split("@")[0] : remoteJid);

      // Filter out "você"
      if (bestName && bestName.toLowerCase() === "você") {
        bestName = remoteJid.split("@")[0];
      }

      const finalName = bestName || "WhatsApp User";

      // 🔥 Verificar regras (Agora com Workspace)
      let isTracked = false;
      const rules = await prisma.leadTrackingRule.findMany({
        where: { workspaceId: req.workspaceId, isActive: true },
      });

      const lastMsgBody =
        chat.lastMessage?.message?.conversation ||
        chat.lastMessage?.message?.extendedTextMessage?.text ||
        "";
      if (lastMsgBody) {
        const lowerBody = lastMsgBody.toLowerCase();
        for (const rule of rules) {
          const keywords = rule.keywords
            .split(",")
            .map((k) => k.trim().toLowerCase());
          if (keywords.some((k) => lowerBody.includes(k))) {
            isTracked = true;
            break;
          }
        }
      }

      const existing = await prisma.whatsappConversation.findUnique({
        where: {
          remoteJid_connectionId: { remoteJid, connectionId: connection.id },
        },
      });

      if (!existing) {
        await prisma.whatsappConversation.create({
          data: {
            remoteJid,
            name: finalName,
            unreadCount: chat.unreadCount || 0,
            status: "OPEN",
            connectionId: connection.id,
            userId: req.user.id,
            workspaceId: req.workspaceId, // NEW
            isTracked,
            lastMessage:
              chat.lastMessage?.message?.conversation ||
              chat.lastMessage?.message?.extendedTextMessage?.text ||
              "",
            lastMessageAt: chat.lastMessage?.messageTimestamp
              ? new Date(chat.lastMessage.messageTimestamp * 1000)
              : new Date(),
          },
        });
        count++;
      } else {
        const currentName = existing.name || "";
        const isPhoneLike = (name) => /^d{8,15}$/.test(name);
        const needsUpdate =
          !existing.name ||
          isPhoneLike(existing.name) ||
          existing.name.includes("@") ||
          existing.name.length > 25 ||
          !existing.connectionId ||
          (isTracked && !existing.isTracked);

        if (needsUpdate) {
          await prisma.whatsappConversation.update({
            where: { id: existing.id },
            data: {
              name: finalName,
              connectionId: connection.id,
              isTracked: isTracked ? true : existing.isTracked,
              lastMessage:
                chat.lastMessage?.message?.conversation ||
                chat.lastMessage?.message?.extendedTextMessage?.text ||
                existing.lastMessage,
              lastMessageAt: chat.lastMessage?.messageTimestamp
                ? new Date(chat.lastMessage.messageTimestamp * 1000)
                : existing.lastMessageAt,
            },
          });
        }
      }
    }

    return res.json({ imported: count, total: chats.length });
  } catch (error) {
    if (error instanceof ExternalApiError) {
      return res
        .status(error.status)
        .json({ error: error.message, details: error.details });
    }
    console.error("Erro importar chats:", error);
    return res.status(500).json({ error: "Erro ao importar chats" });
  }
};

// Create Lead from Conversation
export const createLeadFromConversation = async (req, res) => {
  try {
    const { id } = req.params;
    const { status = "new", funnelId, stageId } = req.body;
    const workspaceId = req.workspaceId;

    // Find the conversation
    const conversation = await prisma.whatsappConversation.findUnique({
      where: { id: Number(id) },
    });

    if (!conversation || conversation.workspaceId !== workspaceId) {
      return res.status(404).json({ error: "Conversa não encontrada" });
    }

    // Check if lead already exists for this conversation
    if (conversation.leadId) {
      const existingLead = await prisma.lead.findUnique({
        where: { id: conversation.leadId },
      });
      return res.status(400).json({
        error: "Lead já existe para esta conversa",
        lead: existingLead,
      });
    }

    // Create lead from conversation
    const lead = await prisma.lead.create({
      data: {
        name: conversation.name || conversation.remoteJid,
        phone: conversation.remoteJid.split("@")[0],
        source: "whatsapp",
        status: status,
        workspaceId: workspaceId,
        funnelId: funnelId ? parseInt(funnelId) : null,
        stageId: stageId ? parseInt(stageId) : null,
      },
    });

    // Link conversation to lead and mark as tracked
    await prisma.whatsappConversation.update({
      where: { id: Number(id) },
      data: {
        leadId: lead.id,
        isTracked: true, // Mark as tracked since it now has a lead
      },
    });

    return res.json(lead);
  } catch (error) {
    console.error("Erro ao criar lead:", error);
    return res.status(500).json({ error: "Erro ao criar lead" });
  }
};

export const getMessageMedia = async (req, res) => {
  try {
    const { id } = req.params;
    const message = await prisma.whatsappMessage.findUnique({
      where: { id: Number(id) },
      include: {
        conversation: {
          include: { connection: true },
        },
      },
    });

    if (!message) {
      return res.status(404).json({ error: "Mensagem não encontrada" });
    }

    const { conversation, whatsappId, type } = message;
    const { connection } = conversation;

    if (!connection) {
      return res.status(400).json({ error: "Conexão não encontrada" });
    }

    if (!whatsappId) {
      return res.status(400).json({
        error: "ID do WhatsApp não disponível para esta mensagem",
      });
    }

    const EVO_URL = process.env.EVOLUTION_API_URL;
    const EVO_GLOBAL_KEY = process.env.EVOLUTION_API_KEY;

    let instanceName = connection.config?.instanceName;
    if (!instanceName && typeof connection.config === "string") {
      try {
        instanceName = JSON.parse(connection.config).instanceName;
      } catch (e) {}
    }

    if (!instanceName || !EVO_URL || !EVO_GLOBAL_KEY) {
      return res
        .status(400)
        .json({ error: "Configuração da instância ou API incompleta" });
    }

    console.log(
      `[Proxy Media] Buscando mídia para msg ${whatsappId} na instância ${instanceName}`,
    );

    // 🔥 SAVE LOCALLY ON-DEMAND if not already saved
    // Use the existing helper which also handles S3 if configured
    const mediaResult = await processAndStoreMedia(
      instanceName,
      whatsappId,
      type,
      {}, // content
      conversation.workspaceId,
    );

    if (!mediaResult.url) {
      // Fallback to just getting the buffer if storage fails for some reason
      const buffer = await getEvolutionMediaBuffer(
        instanceName,
        whatsappId,
        EVO_URL,
        EVO_GLOBAL_KEY,
      );

      if (!buffer) {
        return res
          .status(404)
          .json({ error: "Mídia não encontrada na Evolution API" });
      }

      let contentType = message.mediaMimeType || "application/octet-stream";
      if (contentType === "application/octet-stream") {
        if (type === "image") contentType = "image/jpeg";
        else if (type === "audio") contentType = "audio/ogg";
        else if (type === "video") contentType = "video/mp4";
      }

      res.setHeader("Content-Type", contentType);
      return res.send(buffer);
    }

    // Update DB with the new local/S3 URL
    await prisma.whatsappMessage.update({
      where: { id: Number(id) },
      data: { mediaUrl: mediaResult.url, mediaMimeType: mediaResult.mimeType },
    });

    // Resolve local path to serve the file
    if (mediaResult.url.startsWith("/uploads/")) {
      const filePath = path.join(process.cwd(), mediaResult.url);
      if (fs.existsSync(filePath)) {
        return res.sendFile(filePath);
      }
    }

    // Fallback redirect or send buffer
    return res.redirect(mediaResult.url);
  } catch (error) {
    console.error("Erro no proxy de mídia:", error);
    return res.status(500).json({ error: "Erro interno ao processar mídia" });
  }
};
