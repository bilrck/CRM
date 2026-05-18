import prisma from "../config/prisma.js";
import { logger } from "../utils/logger.js";
import { executeAutomations } from "./automations.controller.js";

export const createLead = async (req, res) => {
  try {
    const { name, email, phone, tags, value, status, source, customFields, street, number, complement, neighborhood, city, state, zipCode, country } = req.body;

    if (!req.workspaceId)
      return res.status(400).json({ error: "Workspace não identificado" });

    const lead = await prisma.lead.create({
      data: {
        name,
        email,
        phone,
        value: value ? Number(value) : 0,
        status: status || "new",
        source: source || "manual",
        tags: tags || [],
        ownerId: req.user.id,
        workspaceId: req.workspaceId,
        customFields: customFields || {},
        funnelId: req.body.funnelId ? Number(req.body.funnelId) : null,
        stageId: req.body.stageId ? Number(req.body.stageId) : null,
        street: street || null,
        number: number || null,
        complement: complement || null,
        neighborhood: neighborhood || null,
        city: city || null,
        state: state || null,
        zipCode: zipCode || null,
        country: country || "Brasil",
      },
    });

    await logger.info("LEAD", `Lead criado manualmente: ${name}`, {
      workspaceId: req.workspaceId,
      userId: req.user.id,
      data: { leadId: lead.id },
    });

    // 🔥 Dispara automação N8N
    await executeAutomations(req.workspaceId, "LEAD_CREATED", lead);

    res.json(lead);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const listLeads = async (req, res) => {
  if (!req.workspaceId) return res.json([]);

  const { hasFollowUp, source } = req.query;
  const where = { workspaceId: req.workspaceId };

  if (hasFollowUp === "true") {
    where.nextFollowUpDate = { not: null };
  }

  if (source) {
    where.source = source;
  }

  const leads = await prisma.lead.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      owner: { select: { name: true } },
      funnel: { select: { name: true } },
      stage: { select: { name: true } },
      metaLeadForm: { 
        select: { 
          name: true, 
          page: { select: { name: true } } 
        } 
      }
    },
  });
  res.json(leads);
};

export const getLead = async (req, res) => {
  const id = Number(req.params.id);
  const lead = await prisma.lead.findUnique({ 
    where: { id },
    include: {
      owner: { select: { name: true } },
      funnel: { select: { name: true } },
      stage: { select: { name: true } },
      documents: true,
      tasks: {
        orderBy: { dueDate: "asc" }
      },
      whatsappConversations: {
        take: 5,
        orderBy: { updatedAt: "desc" }
      }
    }
  });

  if (!lead) return res.status(404).json({ error: "Lead não encontrado" });

  // Verifica Workspace
  if (lead.workspaceId !== req.workspaceId && req.user.role !== "ADMIN") {
    return res.status(403).json({ error: "Acesso negado" });
  }

  res.json(lead);
};

export const addLeadDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, url, mimetype, size } = req.body;

    const doc = await prisma.leadDocument.create({
      data: {
        name,
        fileUrl: url,
        mimeType: mimetype,
        size: Number(size),
        leadId: Number(id),
        workspaceId: req.workspaceId
      }
    });

    res.status(201).json(doc);
  } catch (error) {
    res.status(500).json({ error: "Erro ao adicionar documento" });
  }
};

export const deleteLeadDocument = async (req, res) => {
  try {
    const { docId } = req.params;
    await prisma.leadDocument.delete({ where: { id: Number(docId) } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Erro ao remover documento" });
  }
};

export const updateLead = async (req, res) => {
  const id = Number(req.params.id);
  const { name, email, phone, tags, status, value, source, customFields, street, number, complement, neighborhood, city, state, zipCode, country } = req.body;

  // Verifica permissão antes de update
  const existing = await prisma.lead.findUnique({ where: { id } });
  if (
    !existing ||
    (existing.workspaceId !== req.workspaceId && req.user.role !== "ADMIN")
  ) {
    return res.status(403).json({ error: "Acesso negado" });
  }

  const lead = await prisma.lead.update({
    where: { id },
    data: {
      name,
      email,
      phone,
      tags,
      status,
      source,
      customFields: customFields !== undefined ? customFields : undefined,
      value: value !== undefined ? Number(value) : undefined,
      funnelId: req.body.funnelId ? Number(req.body.funnelId) : undefined,
      stageId: req.body.stageId ? Number(req.body.stageId) : undefined,
      street: street !== undefined ? street : undefined,
      number: number !== undefined ? number : undefined,
      complement: complement !== undefined ? complement : undefined,
      neighborhood: neighborhood !== undefined ? neighborhood : undefined,
      city: city !== undefined ? city : undefined,
      state: state !== undefined ? state : undefined,
      zipCode: zipCode !== undefined ? zipCode : undefined,
      country: country !== undefined ? country : undefined,
      nextFollowUpDate: req.body.nextFollowUpDate !== undefined
        ? (req.body.nextFollowUpDate === null ? null : new Date(req.body.nextFollowUpDate))
        : undefined,
      reminderDate: req.body.reminderDate !== undefined
        ? (req.body.reminderDate === null ? null : new Date(req.body.reminderDate))
        : undefined,
      followUpAction: req.body.followUpAction !== undefined ? req.body.followUpAction : undefined,
      followUpConfig: req.body.followUpConfig !== undefined ? req.body.followUpConfig : undefined,
      followUpTriggered:
        req.body.followUpTriggered !== undefined 
          ? req.body.followUpTriggered 
          : (req.body.nextFollowUpDate !== undefined ? false : undefined),
      reminderTriggered:
        req.body.reminderTriggered !== undefined
          ? req.body.reminderTriggered
          : (req.body.reminderDate !== undefined || req.body.nextFollowUpDate !== undefined ? false : undefined),
    },
  });

  await logger.info("LEAD", `Lead atualizado: ${name || lead.name}`, {
    workspaceId: req.workspaceId,
    userId: req.user.id,
    data: { leadId: lead.id, status, value },
  });

  // 🔥 Dispara automação N8N
  await executeAutomations(req.workspaceId, "LEAD_UPDATED", lead);

  res.json(lead);
};

export const deleteLead = async (req, res) => {
  const id = Number(req.params.id);

  // Verifica permissão antes de delete
  const existing = await prisma.lead.findUnique({ where: { id } });
  if (
    !existing ||
    (existing.workspaceId !== req.workspaceId && req.user.role !== "ADMIN")
  ) {
    return res.status(403).json({ error: "Acesso negado" });
  }

  await prisma.lead.delete({ where: { id } });

  await logger.warn("LEAD", `Lead deletado (ID: ${id}) por ${req.user.name}`, {
    workspaceId: req.workspaceId,
    userId: req.user.id,
    data: { leadId: id },
  });

  res.json({ success: true });
};

export const bulkCreateLeads = async (req, res) => {
  try {
    const { leads } = req.body;

    if (!req.workspaceId)
      return res.status(400).json({ error: "Workspace não identificado" });

    if (!Array.isArray(leads) || leads.length === 0) {
      return res.status(400).json({ error: "Lista de leads inválida" });
    }

    const createdLeads = [];
    
    for (const leadData of leads) {
      const { name, email, phone, tags, value, status, source, customFields, funnelId, stageId } = leadData;
      
      if (!name) continue;

      const lead = await prisma.lead.create({
        data: {
          name,
          email: email || null,
          phone: phone || null,
          value: value ? Number(value) : 0,
          status: status || "new",
          source: source || "manual_import",
          tags: tags || [],
          ownerId: req.user.id,
          workspaceId: req.workspaceId,
          customFields: customFields || {},
          funnelId: funnelId ? Number(funnelId) : null,
          stageId: stageId ? Number(stageId) : null,
        },
      });

      try {
        await executeAutomations(req.workspaceId, "LEAD_CREATED", lead);
      } catch (automationErr) {
        console.warn("Bulk Automation failed for lead:", lead.id, automationErr.message);
      }

      createdLeads.push(lead);
    }

    await logger.info("LEAD", `Importação em massa concluída: ${createdLeads.length} leads importados`, {
      workspaceId: req.workspaceId,
      userId: req.user.id,
      data: { count: createdLeads.length },
    });

    res.json({ success: true, count: createdLeads.length, leads: createdLeads });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
