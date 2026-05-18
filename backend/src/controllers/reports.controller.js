import prisma from "../config/prisma.js";

const formatReal = (val) => {
  return "R$ " + val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export const getDashboardStats = async (req, res) => {
  try {
    const workspaceId = req.workspaceId;
    const { period = "30d", startDate: queryStartDate, endDate: queryEndDate, source } = req.query;

    // 1. Date range calculation
    const now = new Date();
    let startDate = new Date();
    let endDate = new Date(); // now

    if (queryStartDate) {
      startDate = new Date(queryStartDate);
      if (queryEndDate) {
        endDate = new Date(queryEndDate);
      }
    } else {
      if (period === "7d") {
        startDate.setDate(now.getDate() - 7);
      } else if (period === "90d") {
        startDate.setDate(now.getDate() - 90);
      } else { // default "30d"
        startDate.setDate(now.getDate() - 30);
      }
    }

    // 2. Build filter object
    const leadWhere = {
      workspaceId,
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    };

    if (source && source !== "all") {
      leadWhere.source = source;
    }

    // 3. Fetch data
    const [leads, totalConversations, connectionsCount] = await Promise.all([
      prisma.lead.findMany({
        where: leadWhere,
        select: {
          id: true,
          status: true,
          source: true,
          value: true,
          actualValue: true,
          estimatedValue: true,
          createdAt: true,
        },
      }),
      prisma.whatsappConversation.count({
        where: { workspaceId, createdAt: { gte: startDate, lte: endDate } },
      }),
      prisma.connection.count({ where: { workspaceId } }),
    ]);

    // 4. Calculate metrics
    const totalLeads = leads.length;
    const closedLeads = leads.filter(l => l.status === "closed" || l.status === "fechado");
    const closedLeadsCount = closedLeads.length;

    let totalRevenue = 0;
    closedLeads.forEach(l => {
      const val = Number(l.actualValue) || Number(l.value) || Number(l.estimatedValue) || 0;
      totalRevenue += val;
    });

    const conversionRate = totalLeads > 0 ? ((closedLeadsCount / totalLeads) * 100).toFixed(1) : "0.0";
    const ticketMedio = closedLeadsCount > 0 ? (totalRevenue / closedLeadsCount) : 0;

    // 5. Aggregate sources
    const sourcesMap = {};
    leads.forEach(l => {
      const srcName = l.source || "Desconhecido";
      sourcesMap[srcName] = (sourcesMap[srcName] || 0) + 1;
    });

    const sources = Object.entries(sourcesMap)
      .map(([source, leadsCount]) => ({ source, leads: leadsCount }))
      .sort((a, b) => b.leads - a.leads);

    // 6. Timeline aggregation
    const diffDays = Math.ceil(Math.abs(endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const timelineMap = {};

    leads.forEach(lead => {
      const date = new Date(lead.createdAt);
      let key = "";
      if (diffDays <= 31) {
        key = date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
      } else {
        key = date.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });
      }

      if (!timelineMap[key]) {
        timelineMap[key] = { month: key, leads: 0, conversoes: 0, receita: 0 };
      }

      timelineMap[key].leads += 1;
      if (lead.status === "closed" || lead.status === "fechado") {
        timelineMap[key].conversoes += 1;
        const val = Number(lead.actualValue) || Number(lead.value) || Number(lead.estimatedValue) || 0;
        timelineMap[key].receita += val;
      }
    });

    const timeline = Object.values(timelineMap).sort((a, b) => {
      return a.month.localeCompare(b.month);
    });

    res.json({
      kpis: {
        totalLeads,
        conversionRate: `${conversionRate}%`,
        totalRevenue: formatReal(totalRevenue),
        ticketMedio: formatReal(ticketMedio),
      },
      sources,
      timeline: timeline.length > 0 ? timeline : [
        {
          month: "Este Período",
          leads: totalLeads,
          conversoes: closedLeadsCount,
          receita: totalRevenue,
        }
      ],
    });
  } catch (error) {
    console.error("Reports Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
