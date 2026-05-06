import prisma from "../config/prisma.js";

// === FUNNELS ===

export const getFunnels = async (req, res) => {
  try {
    const workspaceId = req.workspaceId;
    const funnels = await prisma.funnel.findMany({
      where: { workspaceId },
      include: {
        stages: {
          orderBy: { order: "asc" },
          include: { leads: true },
        },
      },
      orderBy: { createdAt: "asc" },
    });
    return res.json(funnels);
  } catch (error) {
    console.error("Error getting funnels:", error);
    return res.status(500).json({ error: "Erro ao buscar funis" });
  }
};

export const createFunnel = async (req, res) => {
  try {
    const workspaceId = req.workspaceId;
    const { name, description, stages } = req.body;

    const funnel = await prisma.funnel.create({
      data: {
        name,
        description,
        workspaceId,
        stages: {
          create: stages
            ? stages.map((s, idx) => ({
                name: s.name,
                color: s.color,
                order: idx,
              }))
            : [
                { name: "Novo", order: 0, color: "#3b82f6" },
                { name: "Em Negociação", order: 1, color: "#eab308" },
                { name: "Ganho", order: 2, color: "#22c55e" },
              ],
        },
      },
      include: { stages: true },
    });

    return res.json(funnel);
  } catch (error) {
    console.error("Error creating funnel:", error);
    return res.status(500).json({ error: "Erro ao criar funil" });
  }
};

export const updateFunnel = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    const workspaceId = req.workspaceId;

    const existing = await prisma.funnel.findFirst({
      where: { id: parseInt(id), workspaceId },
    });
    if (!existing)
      return res
        .status(404)
        .json({ error: "Funil não encontrado ou sem permissão" });

    const funnel = await prisma.funnel.update({
      where: { id: parseInt(id) },
      data: { name, description },
    });

    return res.json(funnel);
  } catch (error) {
    return res.status(500).json({ error: "Erro ao atualizar funil" });
  }
};

export const deleteFunnel = async (req, res) => {
  try {
    const { id } = req.params;
    const workspaceId = req.workspaceId;

    const existing = await prisma.funnel.findFirst({
      where: { id: parseInt(id), workspaceId },
    });
    if (!existing)
      return res
        .status(404)
        .json({ error: "Funil não encontrado ou sem permissão" });

    await prisma.funnel.delete({ where: { id: parseInt(id) } });
    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: "Erro ao deletar funil" });
  }
};

// === STAGES ===

export const createStage = async (req, res) => {
  try {
    const { funnelId } = req.params;
    const { name, color, order } = req.body;
    const workspaceId = req.workspaceId;

    const funnel = await prisma.funnel.findFirst({
      where: { id: parseInt(funnelId), workspaceId },
    });
    if (!funnel)
      return res
        .status(404)
        .json({ error: "Funil não encontrado ou sem permissão" });

    const stage = await prisma.funnelStage.create({
      data: {
        funnelId: parseInt(funnelId),
        name,
        color,
        order: order || 0,
      },
    });

    return res.json(stage);
  } catch (error) {
    return res.status(500).json({ error: "Erro ao criar estágio" });
  }
};

export const updateStage = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, color, order } = req.body;
    const workspaceId = req.workspaceId;

    const existingStage = await prisma.funnelStage.findUnique({
      where: { id: parseInt(id) },
      include: { funnel: true },
    });
    if (!existingStage || existingStage.funnel.workspaceId !== workspaceId) {
      return res
        .status(404)
        .json({ error: "Estágio não encontrado ou sem permissão" });
    }

    const stage = await prisma.funnelStage.update({
      where: { id: parseInt(id) },
      data: { name, color, order },
    });

    return res.json(stage);
  } catch (error) {
    return res.status(500).json({ error: "Erro ao atualizar estágio" });
  }
};

export const deleteStage = async (req, res) => {
  try {
    const { id } = req.params;
    const workspaceId = req.workspaceId;

    const existingStage = await prisma.funnelStage.findUnique({
      where: { id: parseInt(id) },
      include: { funnel: true },
    });
    if (!existingStage || existingStage.funnel.workspaceId !== workspaceId) {
      return res
        .status(404)
        .json({ error: "Estágio não encontrado ou sem permissão" });
    }

    await prisma.funnelStage.delete({ where: { id: parseInt(id) } });
    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: "Erro ao deletar estágio" });
  }
};

export const reorderStages = async (req, res) => {
  try {
    const { funnelId } = req.params;
    const { stages } = req.body; // Array of { id, order }
    const workspaceId = req.workspaceId;

    const funnel = await prisma.funnel.findFirst({
      where: { id: parseInt(funnelId), workspaceId },
    });
    if (!funnel)
      return res
        .status(404)
        .json({ error: "Funil não encontrado ou sem permissão" });

    for (const item of stages) {
      await prisma.funnelStage.update({
        where: { id: item.id },
        data: { order: item.order },
      });
    }
    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: "Erro ao reordenar estágios" });
  }
};

// === LEADS ===

export const updateLeadStage = async (req, res) => {
  try {
    const { leadId } = req.params;
    const { funnelId, stageId } = req.body;
    const workspaceId = req.workspaceId;

    const existingLead = await prisma.lead.findFirst({
      where: { id: parseInt(leadId), workspaceId },
    });
    if (!existingLead)
      return res
        .status(404)
        .json({ error: "Lead não encontrado ou sem permissão" });

    if (funnelId) {
      const funnel = await prisma.funnel.findFirst({
        where: { id: parseInt(funnelId), workspaceId },
      });
      if (!funnel)
        return res
          .status(403)
          .json({ error: "Funil destino inválido ou sem permissão" });
    }

    const lead = await prisma.lead.update({
      where: { id: parseInt(leadId) },
      data: {
        funnelId: funnelId ? parseInt(funnelId) : undefined,
        stageId: stageId ? parseInt(stageId) : undefined,
        // Optionally map legacy/string status
      },
    });

    return res.json(lead);
  } catch (error) {
    return res.status(500).json({ error: "Erro ao mover lead" });
  }
};
