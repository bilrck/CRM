import crypto from "crypto";
import prisma from "../config/prisma.js";
import * as metaService from "../services/meta.service.js";
import { sendMessage } from "../services/evolution.service.js";

/**
 * Validates Meta Webhook Signature (X-Hub-Signature-256)
 */
const verifySignature = (req) => {
  const signature = req.headers["x-hub-signature-256"];
  if (!signature) return false;

  const [algo, hash] = signature.split("=");
  if (algo !== "sha256") return false;

  const expectedHash = crypto
    .createHmac("sha256", process.env.META_APP_SECRET || "")
    .update(req.rawBody)
    .digest("hex");

  return hash === expectedHash;
};

/**
 * Verification of Meta Webhook (GET)
 */
export const verifyMetaWebhook = (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === process.env.META_WEBHOOK_VERIFY_TOKEN) {
    console.log("✅ Meta Webhook verificado com sucesso!");
    return res.status(200).send(challenge);
  }

  console.warn("❌ Falha na verificação do Webhook da Meta: Token incorreto.");
  return res.sendStatus(403);
};

/**
 * Handle Real-Time Updates from Meta (POST)
 */
export const receiveMetaWebhook = async (req, res) => {
  try {
    // 🔥 Signature verification in production
    if (process.env.NODE_ENV === "production") {
      if (!verifySignature(req)) {
        console.warn("❌ Falha na assinatura do Webhook da Meta.");
        return res.sendStatus(403);
      }
    }

    const payload = req.body;

    if (payload.object === "page") {
      for (const entry of payload.entry) {
        if (!entry.changes) continue;

        for (const change of entry.changes) {
          if (change.field === "leadgen") {
            const { leadgen_id, page_id, form_id } = change.value;
            
            // Check if lead already processed (Duplication prevention)
            const existing = await prisma.lead.findFirst({
              where: { 
                 source: { contains: leadgen_id }
              }
            });

            if (existing) {
              console.log(`ℹ️ Lead ${leadgen_id} já foi processado.`);
              continue;
            }

            console.log(`📣 Novo lead detectado: ${leadgen_id} na página ${page_id}`);

            processNewLead(leadgen_id, page_id, form_id).catch((err) => {
              console.error("Erro assíncrono ao processar lead da Meta:", err);
            });
          }
        }
      }
    }

    return res.sendStatus(200);
  } catch (error) {
    console.error("Meta Webhook Handler Error:", error);
    return res.sendStatus(500);
  }
};

/**
 * Background Task: Fetches lead details and saves to DB
 */
async function processNewLead(leadId, fbPageId, fbFormId) {
  try {
    // 1. Find the page settings in our DB
    const page = await prisma.metaPage.findUnique({
      where: { pageId: fbPageId },
      include: { metaConnection: true },
    });

    if (!page || !page.isConnected) {
      console.log(
        `⚠️ Página ${fbPageId} não está conectada ou ativa no sistema.`,
      );
      return;
    }

    // 2. Find the form mapping
    const form = await prisma.metaLeadForm.findUnique({
      where: { formId: fbFormId },
    });

    if (!form) {
      console.log(`⚠️ Formulário ${fbFormId} não mapeado no sistema.`);
      return;
    }

    // 3. Get Lead Details from Meta using Page Access Token
    const rawLead = await metaService.getLeadData(leadId, page.accessToken);

    if (!rawLead || !rawLead.field_data) {
      console.error("Dados do lead vazios ou inválidos recebidos da Meta API.");
      return;
    }

    let name = "Lead Meta";
    let email = null;
    let phone = null;
    const metaFields = {};

    for (const field of rawLead.field_data) {
      const fieldName = field.name.toLowerCase();
      const value = field.values[0];
      
      metaFields[field.name] = value; // Store original field names and values

      if (fieldName === "full_name" || fieldName === "name") name = value;
      if (fieldName === "email") email = value;
      if (fieldName === "phone_number" || fieldName === "phone") phone = value;
    }

    const cleanPhone = phone ? phone.replace(/\D/g, "") : null;

    // 4.1 Advanced Configuration: Deduplication
    const config = page.metaConnection.config || {};
    if (config.ignoreDuplicates) {
      const windowHours = config.duplicateWindowHours || 24;
      const startTime = new Date(Date.now() - windowHours * 60 * 60 * 1000);

      const duplicate = await prisma.lead.findFirst({
        where: {
          workspaceId: page.metaConnection.workspaceId,
          createdAt: { gte: startTime },
          OR: [
            email ? { email } : undefined,
            cleanPhone ? { phone: cleanPhone } : undefined,
          ].filter(Boolean),
        },
      });

      if (duplicate) {
        console.log(`ℹ️ Lead duplicado (mesmo email/fone) detectado e ignorado: ${name}`);
        return;
      }
    }

    // 5. Build Base Lead Data
    let funnelId = form.funnelId || null;
    let stageId = form.stageId || null;

    // 6. Check for META_LEAD_RECEIVED Automations
    const automations = await prisma.automation.findMany({
      where: {
        workspaceId: page.metaConnection.workspaceId,
        isActive: true,
        triggerEvent: "META_LEAD_RECEIVED",
      }
    });

    let whatsappConfig = null;

    for (const auto of automations) {
      const conditions = typeof auto.triggerConditions === "string" ? JSON.parse(auto.triggerConditions) : auto.triggerConditions;
      
      const isPageMatch = conditions?.pageId === "ALL" || conditions?.pageId === page.id;
      const isFormMatch = conditions?.formId === "ALL" || conditions?.formId === fbFormId;
      
      if (isPageMatch && isFormMatch) {
        const action = typeof auto.actionConfig === "string" ? JSON.parse(auto.actionConfig) : auto.actionConfig;
        
        if (auto.actionType === "META_LEAD_ROUTING") {
           // Mover Funil
           if (action.moveFunnel && action.funnelId && action.stageId) {
             funnelId = action.funnelId;
             stageId = action.stageId;
           }
           // WhatsApp Msg
           if (action.sendWhatsapp && action.connectionId && action.whatsappMessage) {
             whatsappConfig = {
               connectionId: action.connectionId,
               message: action.whatsappMessage
             };
           }
        }
      }
    }

    // 7. Create Lead in CRM
    const createdLead = await prisma.lead.create({
      data: {
        name,
        email,
        phone: cleanPhone,
        source: `Meta Ads: ${page.name} (ID: ${leadId})`,
        workspaceId: page.metaConnection.workspaceId,
        metaLeadFormId: form.id,
        funnelId,
        stageId,
        status: funnelId ? undefined : "new",
        metadata: {
          fbLeadId: leadId,
          fbFormId,
          fbPageId,
          fields: metaFields,
          raw: rawLead
        }
      },
    });

    console.log(
      `✅ Lead ${name} importado com sucesso do formulário ${form.name}`,
    );

    // 8. Execute WhatsApp Automation Action
    if (whatsappConfig && createdLead.phone) {
      try {
        const conn = await prisma.connection.findUnique({ where: { id: whatsappConfig.connectionId } });
        if (conn && conn.status === "connected" && conn.apiSecret) {
          const number = createdLead.phone;
          // Apply basic variables
          let finalMsg = whatsappConfig.message
                .replace(/{nome_user}/g, name)
                .replace(/{telefone}/g, number);
          
          console.log(`[MetaAutomation] Enviando WhatsApp automático para ${number}`);
          await sendMessage(conn.apiSecret, conn.apiKey, number, finalMsg);
        }
      } catch (waErr) {
        console.error("Erro ao disparar WhatsApp automático (Meta Automation):", waErr.message);
      }
    }

    // Optional: Trigger notifications or socket events here
  } catch (err) {
    console.error("processNewLead Critical Error:", err);
    throw err;
  }
}
