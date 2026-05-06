import prisma from "../config/prisma.js";
import { validateMetaToken, getMetaMetrics } from "../services/meta.service.js";
import { validateEvolutionInstance } from "../services/evolution.service.js";
import { v4 as uuidv4 } from "uuid";
import { request, ExternalApiError } from "../utils/api-client.js";

export const getConnections = async (req, res) => {
  try {
    const workspaceId = req.workspaceId;
    if (!workspaceId) return res.json([]);

    const connections = await prisma.connection.findMany({
      where: { workspaceId },
    });
    return res.json(connections);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao buscar conexões" });
  }
};

export const createConnection = async (req, res) => {
  try {
    const userId = req.user.id;
    const workspaceId = req.workspaceId;
    const {
      name,
      provider,
      apiKey: userApiKey,
      apiSecret: userApiSecret,
      webhookUrl,
      autoSync,
      config,
    } = req.body;

    if (!workspaceId)
      return res.status(400).json({ error: "Workspace não identificado" });
    if (!name || !provider) {
      return res
        .status(400)
        .json({ error: "Nome e provedor são obrigatórios" });
    }

    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: { connections: true, owner: true },
    });

    if (!workspace)
      return res.status(404).json({ error: "Workspace não encontrado" });

    // 1. Check Limits (usando limites do dono do workspace)
    const currentCount = workspace.connections.filter(
      (c) => c.provider === provider,
    ).length;
    // Fallback: se owner não tiver limite definido, usa 1
    const maxWhatsapp = workspace.owner.maxWhatsappConnections || 1;
    const maxMeta = workspace.owner.maxMetaConnections || 1;

    if (provider === "evolution" && currentCount >= maxWhatsapp) {
      return res
        .status(403)
        .json({
          error: `Limite de conexões WhatsApp excedido (${maxWhatsapp})`,
        });
    }
    if (provider === "facebook" && currentCount >= maxMeta) {
      return res
        .status(403)
        .json({ error: `Limite de conexões Meta excedido (${maxMeta})` });
    }

    let status = "connected";
    let finalWebhookUrl = webhookUrl;
    let finalApiKey = userApiKey;
    let finalApiSecret = userApiSecret;
    let finalConfig = config || {};
    let initialQrCode = null;

    // 2. Provider Logic
    if (provider === "facebook") {
      if (userApiSecret) {
        const isValid = await validateMetaToken(userApiSecret);
        if (!isValid) status = "error";
      }
    } else if (provider === "evolution") {
      // SaaS Mode: Auto-provisioning
      const EVO_URL = process.env.EVOLUTION_API_URL;
      const EVO_GLOBAL_KEY = process.env.EVOLUTION_API_KEY;

      if (!EVO_URL || !EVO_GLOBAL_KEY) {
        // Fallback Legacy
        if (userApiKey && userApiSecret) {
          const isValid = await validateEvolutionInstance(
            userApiSecret,
            userApiKey,
          );
          if (!isValid) status = "error";
        } else {
          return res
            .status(500)
            .json({ error: "Servidor WhatsApp não configurado no sistema." });
        }
      } else {
        // Gerar nome único para a instância
        const cleanName = name.replace(/[^a-zA-Z0-9]/g, "");
        const instanceName = `ws_${workspaceId}_${cleanName}_${Date.now()}`;

        // Webhook Setup - Override com porta correta se necessário
        const backendUrl = process.env.API_URL || "http://localhost:3001";
        finalWebhookUrl = `${backendUrl}/webhooks/${instanceName}`;

        // If local dev and evolution is in docker, use host.docker.internal
        let evolutionWebhookUrl = finalWebhookUrl;
        if (
          evolutionWebhookUrl.includes("localhost") ||
          evolutionWebhookUrl.includes("127.0.0.1")
        ) {
          evolutionWebhookUrl = evolutionWebhookUrl
            .replace("localhost", "host.docker.internal")
            .replace("127.0.0.1", "host.docker.internal");
        }

        console.log(
          `Configurando Webhook URL: ${finalWebhookUrl} (Para a API: ${evolutionWebhookUrl})`,
        );

        try {
          const createData = await request(`${EVO_URL}/instance/create`, {
            method: "POST",
            body: JSON.stringify({
              instanceName,
              token: uuidv4(),
              qrcode: true,
              integration: "WHATSAPP-BAILEYS",
              webhook: {
                url: evolutionWebhookUrl,
                enabled: true,
                byEvents: false,
                base64: false,
                events: [
                  "CONNECTION_UPDATE",
                  "MESSAGES_UPSERT",
                  "MESSAGES_UPDATE",
                  "SEND_MESSAGE",
                ],
              },
            }),
            headers: {
              apikey: EVO_GLOBAL_KEY,
            },
          });
          // Sucesso
          finalApiSecret = `${EVO_URL}/instance/${instanceName}`;
          finalApiKey = createData.hash?.apikey || EVO_GLOBAL_KEY;

          finalConfig = {
            ...finalConfig,
            instanceName,
            instanceId: createData.instance?.id,
          };
          status = "created";

          if (createData.qrcode && createData.qrcode.base64) {
            initialQrCode = createData.qrcode.base64;
          }

          // 🔥 OTIMIZAÇÃO: Auto-configuração (Reject Call, Ignore Groups, Always Online)
          console.log("Aplicando configurações automáticas na instância...");
          await request(`${EVO_URL}/instance/settings/${instanceName}`, {
            method: "POST",
            headers: { apikey: EVO_GLOBAL_KEY },
            body: JSON.stringify({
              reject_call: true,
              groups_ignore: true,
              always_online: true,
              read_messages: false,
              read_status: false,
            }),
          }).catch((e) => console.error("Erro ao aplicar configs auto:", e));
        } catch (evoErr) {
          if (evoErr instanceof ExternalApiError) {
            return res
              .status(evoErr.status)
              .json({ error: evoErr.message, details: evoErr.details });
          }
          console.error("Erro fetch Evolution:", evoErr);
          return res
            .status(500)
            .json({ error: "Erro de comunicação com servidor WhatsApp" });
        }
      }
    } else if (provider === "webhook" || provider === "custom") {
      const uniqueId = uuidv4();
      finalWebhookUrl = `${process.env.API_URL || "http://localhost:3001"}/webhooks/${uniqueId}`;
    }

    const connection = await prisma.connection.create({
      data: {
        userId, // Mantemos log de quem criou
        workspaceId, // 🔥 Vinculado ao Workspace
        name,
        provider,
        apiKey: finalApiKey,
        apiSecret: finalApiSecret,
        webhookUrl: finalWebhookUrl,
        autoSync: autoSync !== undefined ? autoSync : true,
        config: finalConfig,
        status: status,
      },
    });

    // Se conectou com sucesso, tenta syncar já na criação
    if (status === "connected") {
      syncMetrics(connection.id);
    }

    // Hack: retornar qrcode junto com a connection se disponível
    return res.status(201).json({ ...connection, qrcode: initialQrCode });
  } catch (err) {
    console.error("Erro ao criar conexão:", err);
    return res.status(500).json({ error: "Erro ao criar conexão" });
  }
};

export const updateConnection = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { apiKey, apiSecret, webhookUrl, autoSync, config, status } =
      req.body;

    const connection = await prisma.connection.findUnique({
      where: { id: Number(id) },
    });

    if (!connection)
      return res.status(404).json({ error: "Conexão não encontrada" });
    if (connection.userId !== userId)
      return res.status(403).json({ error: "Sem permissão" });

    // Proteção SaaS: Não editar chaves Evolution
    let data = { autoSync, config, status };
    if (connection.provider !== "evolution") {
      data = { ...data, apiKey, apiSecret, webhookUrl };
    }

    const updated = await prisma.connection.update({
      where: { id: Number(id) },
      data,
    });

    return res.json(updated);
  } catch (err) {
    console.error("Erro ao atualizar conexão:", err);
    res.status(500).json({ error: "Erro ao atualizar conexão" });
  }
};

export const deleteConnection = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const connection = await prisma.connection.findUnique({
      where: { id: Number(id) },
    });

    if (!connection) {
      return res.status(404).json({ error: "Conexão não encontrada" });
    }

    if (connection.userId !== userId) {
      return res.status(403).json({ error: "Sem permissão" });
    }

    // Se for Evolution SaaS, deletar na API
    if (
      connection.provider === "evolution" &&
      connection.config?.instanceName
    ) {
      const EVO_URL = process.env.EVOLUTION_API_URL;
      const EVO_GLOBAL_KEY = process.env.EVOLUTION_API_KEY;

      if (EVO_URL && EVO_GLOBAL_KEY) {
        try {
          // Tenta deletar a instância remota
          await request(
            `${EVO_URL}/instance/delete/${connection.config.instanceName}`,
            {
              method: "DELETE",
              headers: { apikey: EVO_GLOBAL_KEY },
            },
          );
        } catch (e) {
          console.error("Erro ao deletar instância remota:", e);
        }
      }
    }

    await prisma.connection.delete({
      where: { id: Number(id) },
    });

    return res.json({ message: "Conexão removida com sucesso" });
  } catch (err) {
    console.error("Erro ao remover conexão:", err);
    return res.status(500).json({ error: "Erro ao remover conexão" });
  }
};

// 🔥 Função auxiliar de sync (pode ser chamada internamente ou via rota)
const syncMetrics = async (connectionId) => {
  try {
    const connection = await prisma.connection.findUnique({
      where: { id: connectionId },
    });
    if (!connection) return;

    let metrics = null;
    if (
      connection.provider === "facebook" ||
      connection.provider === "instagram"
    ) {
      metrics = await getMetaMetrics(connection.apiSecret, connection.apiKey);
    }

    if (metrics) {
      await prisma.connection.update({
        where: { id: connectionId },
        data: {
          metrics: metrics,
          lastSync: new Date(),
        },
      });
    }
  } catch (error) {
    console.error("Sync error:", error);
  }
};

export const syncConnection = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const connection = await prisma.connection.findUnique({
      where: { id: Number(id) },
    });

    if (!connection)
      return res.status(404).json({ error: "Conexão não encontrada" });
    if (connection.userId !== userId)
      return res.status(403).json({ error: "Sem permissão" });

    await syncMetrics(Number(id));

    // Retorna a conexão atualizada
    const updated = await prisma.connection.findUnique({
      where: { id: Number(id) },
    });
    return res.json(updated);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro ao sincronizar" });
  }
};

export const getQrCode = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const connection = await prisma.connection.findUnique({
      where: { id: Number(id) },
    });

    if (!connection)
      return res.status(404).json({ error: "Conexão não encontrada" });
    if (connection.userId !== userId)
      return res.status(403).json({ error: "Sem permissão" });

    if (
      connection.provider !== "evolution" ||
      !connection.config?.instanceName
    ) {
      return res
        .status(400)
        .json({ error: "Conexão não é do tipo Evolution ou sem instância" });
    }

    const EVO_URL = process.env.EVOLUTION_API_URL;
    const EVO_GLOBAL_KEY = process.env.EVOLUTION_API_KEY;

    if (!EVO_URL || !EVO_GLOBAL_KEY) {
      return res
        .status(500)
        .json({ error: "Servidor Evolution não configurado" });
    }

    const data = await request(
      `${EVO_URL}/instance/connect/${connection.config.instanceName}`,
      {
        method: "GET",
        headers: {
          apikey: EVO_GLOBAL_KEY,
        },
      },
    );
    return res.json(data);
  } catch (error) {
    console.error("Erro ao buscar QR Code:", error);
    return res.status(500).json({ error: "Erro ao buscar QR Code" });
  }
};

export const refreshStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const connection = await prisma.connection.findUnique({
      where: { id: Number(id) },
    });
    if (!connection)
      return res.status(404).json({ error: "Conexão não encontrada" });

    const EVO_URL = process.env.EVOLUTION_API_URL;
    const EVO_GLOBAL_KEY = process.env.EVOLUTION_API_KEY;

    if (
      connection.provider === "evolution" &&
      connection.config?.instanceName
    ) {
      try {
        const checkData = await request(
          `${EVO_URL}/instance/connectionState/${connection.config.instanceName}`,
          {
            headers: { apikey: EVO_GLOBAL_KEY },
          },
        );

        // data.instance.state = 'open', 'close', 'connecting'
        const state = checkData.instance?.state || "disconnected";
        let newStatus = "disconnected";

        if (state === "open") newStatus = "connected";
        else if (state === "connecting") newStatus = "connecting";

        await prisma.connection.update({
          where: { id: Number(id) },
          data: { status: newStatus },
        });

        return res.json({ status: newStatus });
      } catch (e) {
        console.error("Erro check status:", e);
        return res.status(500).json({ error: "Erro ao checar status na API" });
      }
    }

    return res.json({ status: connection.status });
  } catch (error) {
    return res.status(500).json({ error: "Erro interno" });
  }
};
