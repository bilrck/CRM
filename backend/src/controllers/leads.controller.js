import prisma from "../config/prisma.js";
import { logger } from "../utils/logger.js";
import { executeAutomations } from "./automations.controller.js";

export const createLead = async (req, res) => {
  try {
    const { name, email, phone, tags, value, status, source } = req.body;

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
        funnelId: req.body.funnelId ? Number(req.body.funnelId) : null,
        stageId: req.body.stageId ? Number(req.body.stageId) : null,
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
  const lead = await prisma.lead.findUnique({ where: { id } });

  if (!lead) return res.status(404).json({ error: "Lead não encontrado" });

  // Verifica Workspace
  if (lead.workspaceId !== req.workspaceId && req.user.role !== "ADMIN") {
    return res.status(403).json({ error: "Acesso negado" });
  }

  res.json(lead);
};

export const updateLead = async (req, res) => {
  const id = Number(req.params.id);
  const { name, email, phone, tags, status, value, source } = req.body;

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
      value: value !== undefined ? Number(value) : undefined,
      funnelId: req.body.funnelId ? Number(req.body.funnelId) : undefined,
      stageId: req.body.stageId ? Number(req.body.stageId) : undefined,
      nextFollowUpDate: req.body.nextFollowUpDate
        ? new Date(req.body.nextFollowUpDate)
        : undefined,
      reminderDate: req.body.reminderDate
        ? new Date(req.body.reminderDate)
        : undefined,
      followUpAction: req.body.followUpAction,
      followUpConfig: req.body.followUpConfig,
      followUpTriggered:
        req.body.nextFollowUpDate !== undefined ? false : undefined, // Reset if changing date
      reminderTriggered:
        req.body.reminderDate !== undefined ||
        req.body.nextFollowUpDate !== undefined
          ? false
          : undefined,
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
