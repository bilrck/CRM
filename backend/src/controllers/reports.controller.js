import prisma from "../config/prisma.js";

export const getDashboardStats = async (req, res) => {
  try {
    const workspaceId = req.workspaceId;
    const { period = "30d" } = req.query;

    // Date range calculation
    const now = new Date();
    let startDate = new Date();
    if (period === "30d") startDate.setDate(now.getDate() - 30);
    else if (period === "7d") startDate.setDate(now.getDate() - 7);
    else startDate.setMonth(now.getMonth() - 1); // Default to last month

    // Parallel queries for better performance
    const [
      totalLeads,
      totalConversations,
      connectionsCount,
      leadsBySource,
      leadsTimeline,
    ] = await Promise.all([
      prisma.lead.count({
        where: { workspaceId, createdAt: { gte: startDate } },
      }),
      prisma.whatsappConversation.count({
        where: { workspaceId, createdAt: { gte: startDate } },
      }),
      prisma.connection.count({ where: { workspaceId } }),
      prisma.lead.groupBy({
        by: ["source"],
        where: { workspaceId, createdAt: { gte: startDate } },
        _count: { id: true },
      }),
      prisma.lead.groupBy({
        by: ["status"], // Placeholder for timeline grouping as Prisma doesn't do date grouping well natively
        where: { workspaceId, createdAt: { gte: startDate } },
        _count: { id: true },
      }),
    ]);

    // Mocking revenue for now as there's no revenue model in schema yet,
    // but we'll base it on 'closed' leads
    const closedLeads = await prisma.lead.count({
      where: { workspaceId, status: "closed", createdAt: { gte: startDate } },
    });

    const conversionRate =
      totalLeads > 0 ? ((closedLeads / totalLeads) * 100).toFixed(1) : 0;
    const estimatedRevenue = closedLeads * 1500; // Mock average ticket

    res.json({
      kpis: {
        totalLeads,
        conversionRate: `${conversionRate}%`,
        totalRevenue: `R$ ${(estimatedRevenue / 1000).toFixed(1)}k`,
        ticketMedio: `R$ 1.500`,
      },
      sources: leadsBySource.map((s) => ({
        source: s.source || "Desconhecido",
        leads: s._count.id,
      })),
      timeline: [
        {
          month: "Este Período",
          leads: totalLeads,
          conversoes: closedLeads,
          receita: estimatedRevenue,
        },
      ],
    });
  } catch (error) {
    console.error("Reports Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
