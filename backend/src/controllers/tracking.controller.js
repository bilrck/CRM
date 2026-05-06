import prisma from "../config/prisma.js";

export const getRules = async (req, res) => {
  try {
    const workspaceId = req.workspaceId;
    const rules = await prisma.leadTrackingRule.findMany({
      where: { workspaceId },
      include: {
        funnel: true,
        stage: true,
      },
      orderBy: { createdAt: "desc" },
    });
    return res.json(rules);
  } catch (error) {
    return res.status(500).json({ error: "Erro ao buscar regras" });
  }
};

export const createRule = async (req, res) => {
  try {
    const workspaceId = req.workspaceId;
    const {
      keywords,
      targetStatus,
      funnelId,
      stageId,
      replyMessage,
      replyMediaUrl,
      replyMediaType,
      createLead, // 🔥 NEW: Destructure createLead from request
    } = req.body;

    const rule = await prisma.leadTrackingRule.create({
      data: {
        userId: req.user.id, // Legacy
        workspaceId,
        keywords,
        targetStatus: targetStatus || "interest", // Fallback
        funnelId: funnelId ? parseInt(funnelId) : null,
        stageId: stageId ? parseInt(stageId) : null,
        replyMessage,
        replyMediaUrl,
        replyMediaType,
        createLead: createLead !== undefined ? createLead : true, // 🔥 Default to true if not provided
      },
    });

    return res.json(rule);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Erro ao criar regra" });
  }
};

export const deleteRule = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.leadTrackingRule.delete({ where: { id: parseInt(id) } });
    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: "Erro ao deletar regra" });
  }
};
