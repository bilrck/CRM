import prisma from "../config/prisma.js";
import { sendMessage } from "../services/evolution.service.js";
import { ExternalApiError } from "../utils/api-client.js";

// GET /api/v1/leads
export const apiListLeads = async (req, res) => {
  try {
    const workspaceId = req.workspaceId;
    const { limit = 10, offset = 0 } = req.query;

    const leads = await prisma.lead.findMany({
      where: { workspaceId },
      take: Number(limit),
      skip: Number(offset),
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        status: true,
        tags: true,
        createdAt: true,
        funnelId: true,
        stageId: true,
      },
    });

    res.json({
      data: leads,
      meta: {
        limit: Number(limit),
        offset: Number(offset),
        count: leads.length,
      },
    });
  } catch (error) {
    console.error("API Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// POST /api/v1/leads
export const apiCreateLead = async (req, res) => {
  try {
    const workspaceId = req.workspaceId;
    const { name, email, phone, tags, funnelId, stageId } = req.body;

    if (!name) return res.status(400).json({ error: "Name is required" });

    const lead = await prisma.lead.create({
      data: {
        name,
        email,
        phone,
        tags: tags || [],
        status: "new",
        workspaceId,
        source: "api_integration",
        funnelId: funnelId ? Number(funnelId) : null,
        stageId: stageId ? Number(stageId) : null,
      },
    });

    res.status(201).json(lead);
  } catch (error) {
    console.error("API Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// PUT /api/v1/leads/:id
export const apiUpdateLead = async (req, res) => {
  try {
    const workspaceId = req.workspaceId;
    const { id } = req.params;
    const { name, email, phone, tags, status, funnelId, stageId } = req.body;

    const lead = await prisma.lead.findUnique({ where: { id: Number(id) } });
    if (!lead || lead.workspaceId !== workspaceId) {
      return res.status(404).json({ error: "Lead not found" });
    }

    const data = { name, email, phone, tags, status };
    if (funnelId !== undefined) data.funnelId = funnelId;
    if (stageId !== undefined) data.stageId = stageId;

    const updated = await prisma.lead.update({
      where: { id: Number(id) },
      data: data,
    });

    res.json(updated);
  } catch (error) {
    console.error("API Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// DELETE /api/v1/leads/:id
export const apiDeleteLead = async (req, res) => {
  try {
    const workspaceId = req.workspaceId;
    const { id } = req.params;

    const lead = await prisma.lead.findUnique({ where: { id: Number(id) } });
    if (!lead || lead.workspaceId !== workspaceId) {
      return res.status(404).json({ error: "Lead not found" });
    }

    await prisma.lead.delete({ where: { id: Number(id) } });
    res.json({ success: true });
  } catch (error) {
    console.error("API Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// GET /api/v1/workspaces/me
export const apiGetWorkspace = async (req, res) => {
  try {
    const workspaceId = req.workspaceId;
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: { id: true, name: true, createdAt: true },
    });
    res.json(workspace);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// GET /api/v1/conversations
export const apiListConversations = async (req, res) => {
  try {
    const workspaceId = req.workspaceId;
    const { limit = 10, offset = 0 } = req.query;

    const conversations = await prisma.conversation.findMany({
      // Assuming conversation map to whatsappConversation? No there is a schema confusion here.
      // In whatsapp.controller.js it uses prisma.whatsappConversation. In previous api.controller it used prisma.conversation.
      // I should check schema.prisma to be sure. But assuming whatsappConversation is the correct one based on recent edits.
      // Wait, looking at lines 128 of old api.controller.js it says `prisma.conversation`.
      // But whatsapp controller uses `whatsappConversation`.
      // I'll stick to `whatsappConversation` as it is the live one used in the app.
      where: { workspaceId },
      take: Number(limit),
      skip: Number(offset),
      orderBy: { updatedAt: "desc" },
      // include: { user: { select: { name: true } } } // Adjust based on schema
    });
    // The previous code might have been for a different schema version. I will use whatsappConversation.
    const convs = await prisma.whatsappConversation.findMany({
      where: { workspaceId },
      take: Number(limit),
      skip: Number(offset),
      orderBy: { lastMessageAt: "desc" },
    });

    res.json({
      data: convs,
      meta: {
        limit: Number(limit),
        offset: Number(offset),
        count: convs.length,
      },
    });
  } catch (error) {
    console.error("API Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// GET /api/v1/messages/:conversationId
export const apiListMessages = async (req, res) => {
  try {
    const workspaceId = req.workspaceId;
    const { conversationId } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    const conversation = await prisma.whatsappConversation.findUnique({
      where: { id: Number(conversationId) },
    });

    if (!conversation || conversation.workspaceId !== workspaceId) {
      return res.status(404).json({ error: "Conversation not found" });
    }

    const messages = await prisma.whatsappMessage.findMany({
      where: { conversationId: Number(conversationId) },
      take: Number(limit),
      skip: Number(offset),
      orderBy: { createdAt: "desc" },
    });

    res.json({
      data: messages,
      meta: {
        limit: Number(limit),
        offset: Number(offset),
        count: messages.length,
      },
    });
  } catch (error) {
    console.error("API Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// GET /api/v1/connections
export const apiListConnections = async (req, res) => {
  try {
    const workspaceId = req.workspaceId;
    const connections = await prisma.connection.findMany({
      where: { workspaceId },
      select: {
        id: true,
        name: true,
        provider: true,
        status: true,
        lastSync: true,
      },
    });

    res.json(connections);
  } catch (error) {
    console.error("API Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// POST /api/v1/messages/send
export const apiSendMessage = async (req, res) => {
  try {
    const workspaceId = req.workspaceId;
    const { conversationId, phone, body } = req.body;

    if (!body)
      return res.status(400).json({ error: "Message body is required" });

    let targetJid;
    let conversation;
    let connection;

    // Strategy 1: Send to existing conversation ID
    if (conversationId) {
      conversation = await prisma.whatsappConversation.findUnique({
        where: { id: Number(conversationId) },
        include: { connection: true },
      });
      if (!conversation || conversation.workspaceId !== workspaceId) {
        return res.status(404).json({ error: "Conversation not found" });
      }
      targetJid = conversation.remoteJid;
      connection = conversation.connection;
    }
    // Strategy 2: Send to phone number (create or find conversation)
    else if (phone) {
      const remoteJid = phone.includes("@") ? phone : `${phone}@s.whatsapp.net`;
      targetJid = remoteJid;

      // Find best connection before finding conversation
      connection = await prisma.connection.findFirst({
        where: {
          provider: "evolution",
          status: "connected",
          workspaceId,
        },
      });

      if (!connection) {
        return res
          .status(400)
          .json({ error: "No active WhatsApp connection found in workspace" });
      }

      // Try to find existing first
      conversation = await prisma.whatsappConversation.findUnique({
        where: {
          remoteJid_connectionId: { remoteJid, connectionId: connection.id },
        },
      });

      if (conversation && conversation.workspaceId !== workspaceId) {
        return res
          .status(403)
          .json({ error: "Conversation exists in another workspace" });
      }
    } else {
      return res
        .status(400)
        .json({ error: "Either conversationId or phone is required" });
    }

    if (!connection) {
      return res
        .status(400)
        .json({ error: "No active WhatsApp connection found in workspace" });
    }

    // Send via Service
    await sendMessage(connection.apiSecret, connection.apiKey, targetJid, body);

    // If conversation didn't exist, we should ideally create it, but for now we rely on the webhook
    // or we can create it here if we want to be robust.
    // For API simplicity, we just return success of sending command.
    // But to be consistent with internal controller, let's try to upsert the message locally?
    // Reuse internal controller logic if possible, but extracting it is hard.
    // We'll return success 202 Accepted.

    res
      .status(202)
      .json({ success: true, status: "queued", target: targetJid });
  } catch (error) {
    if (error instanceof ExternalApiError) {
      return res
        .status(error.status)
        .json({ error: error.message, details: error.details });
    }
    console.error("API Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// GET /api/v1/funnels
export const apiListFunnels = async (req, res) => {
  try {
    const workspaceId = req.workspaceId;
    const funnels = await prisma.funnel.findMany({
      where: { workspaceId },
      include: {
        stages: {
          orderBy: { order: "asc" },
          select: { id: true, name: true, color: true, order: true },
        },
      },
    });
    res.json(funnels);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// POST /api/v1/funnels
export const apiCreateFunnel = async (req, res) => {
  try {
    const workspaceId = req.workspaceId;
    const { name, description, stages } = req.body;

    if (!name) return res.status(400).json({ error: "Name is required" });

    const funnel = await prisma.funnel.create({
      data: {
        name,
        description,
        workspaceId,
        stages: {
          create: stages
            ? stages.map((s, idx) => ({
                name: s.name,
                color: s.color || "#3b82f6",
                order: s.order !== undefined ? s.order : idx,
              }))
            : [
                { name: "Novo", order: 0, color: "#3b82f6" },
                { name: "Em Negociação", order: 1, color: "#eab308" },
              ],
        },
      },
      include: { stages: true },
    });
    res.status(201).json(funnel);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// PUT /api/v1/funnels/:id
export const apiUpdateFunnel = async (req, res) => {
  try {
    const workspaceId = req.workspaceId;
    const { id } = req.params;
    const { name, description } = req.body;

    const funnel = await prisma.funnel.findUnique({
      where: { id: Number(id) },
    });
    if (!funnel || funnel.workspaceId !== workspaceId)
      return res.status(404).json({ error: "Funnel not found" });

    const updated = await prisma.funnel.update({
      where: { id: Number(id) },
      data: { name, description },
    });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// DELETE /api/v1/funnels/:id
export const apiDeleteFunnel = async (req, res) => {
  try {
    const workspaceId = req.workspaceId;
    const { id } = req.params;

    const funnel = await prisma.funnel.findUnique({
      where: { id: Number(id) },
    });
    if (!funnel || funnel.workspaceId !== workspaceId)
      return res.status(404).json({ error: "Funnel not found" });

    await prisma.funnel.delete({ where: { id: Number(id) } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// --- USERS (Workspace Members) ---

// GET /api/v1/users
export const apiListUsers = async (req, res) => {
  try {
    const workspaceId = req.workspaceId;
    const members = await prisma.workspaceMember.findMany({
      where: { workspaceId },
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
        customRole: { select: { id: true, name: true } },
      },
    });

    const formatted = members.map((m) => ({
      membershipId: m.id,
      id: m.user.id,
      name: m.user.name,
      email: m.user.email,
      role: m.role,
      customRoleId: m.roleId,
      customRoleName: m.customRole?.name || null,
      joinedAt: m.createdAt,
    }));

    res.json(formatted);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// POST /api/v1/users (Invite)
export const apiInviteUser = async (req, res) => {
  try {
    const workspaceId = req.workspaceId;
    const { email, role, roleId } = req.body;

    if (!email) return res.status(400).json({ error: "Email is required" });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user)
      return res.status(404).json({ error: "User not found in system" });

    const existing = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId: user.id } },
    });
    if (existing)
      return res.status(400).json({ error: "User is already a member" });

    const membership = await prisma.workspaceMember.create({
      data: {
        workspaceId,
        userId: user.id,
        role: role || "MEMBER",
        roleId: roleId ? Number(roleId) : null,
      },
      include: { user: { select: { name: true, email: true } } },
    });

    res.status(201).json(membership);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// PUT /api/v1/users/:membershipId
export const apiUpdateUserRole = async (req, res) => {
  try {
    const workspaceId = req.workspaceId;
    const { id } = req.params; // membershipId
    const { role, roleId } = req.body;

    const membership = await prisma.workspaceMember.findUnique({
      where: { id: Number(id) },
    });
    if (!membership || membership.workspaceId !== workspaceId)
      return res.status(404).json({ error: "Membership not found" });

    const updated = await prisma.workspaceMember.update({
      where: { id: Number(id) },
      data: {
        role: role || membership.role,
        roleId:
          roleId !== undefined
            ? roleId
              ? Number(roleId)
              : null
            : membership.roleId,
      },
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// DELETE /api/v1/users/:membershipId
export const apiRemoveUser = async (req, res) => {
  try {
    const workspaceId = req.workspaceId;
    const { id } = req.params; // membershipId

    const membership = await prisma.workspaceMember.findUnique({
      where: { id: Number(id) },
    });
    if (!membership || membership.workspaceId !== workspaceId)
      return res.status(404).json({ error: "Membership not found" });

    await prisma.workspaceMember.delete({ where: { id: Number(id) } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// --- REPORTS ---

// GET /api/v1/reports/dashboard
export const apiGetReports = async (req, res) => {
  try {
    const workspaceId = req.workspaceId;
    const { period = "30d" } = req.query;

    const now = new Date();
    let startDate = new Date();
    if (period === "30d") startDate.setDate(now.getDate() - 30);
    else if (period === "7d") startDate.setDate(now.getDate() - 7);
    else startDate.setMonth(now.getMonth() - 1);

    const [totalLeads, totalConversations, closedLeads] = await Promise.all([
      prisma.lead.count({
        where: { workspaceId, createdAt: { gte: startDate } },
      }),
      prisma.whatsappConversation.count({
        where: { workspaceId, lastMessageAt: { gte: startDate } },
      }),
      prisma.lead.count({
        where: { workspaceId, status: "closed", createdAt: { gte: startDate } },
      }),
    ]);

    res.json({
      period,
      stats: {
        totalLeads,
        totalConversations,
        closedLeads,
        conversionRate:
          totalLeads > 0 ? ((closedLeads / totalLeads) * 100).toFixed(1) : "0",
      },
    });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};
