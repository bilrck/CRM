import prisma from "../config/prisma.js";

export const getDashboardStats = async (req, res) => {
    try {
        const workspaceId = req.workspaceId;
        if (!workspaceId) return res.status(400).json({ error: "Workspace não identificado" });

        const leads = await prisma.lead.findMany({
            where: { workspaceId }
        });

        const totalLeads = leads.length;
        const totalValue = leads.reduce((acc, l) => acc + (Number(l.value) || 0), 0);
        
        // Count by status
        const statusDistribution = [
            { name: "Novos", value: leads.filter(l => l.status === 'new' || l.status === 'Novo').length, color: "#2563eb" },
            { name: "Convertidos", value: leads.filter(l => l.status === 'closed' || l.status === 'Fechado').length, color: "#10b981" },
            { name: "Em Negociação", value: leads.filter(l => ['qualified', 'proposal', 'negotiation', 'Qualificado', 'Proposta', 'Negociação'].includes(l.status)).length, color: "#fbbf24" }
        ];

        // Group by Source
        const sourceMap = leads.reduce((acc, l) => {
            const source = l.source || "Direto";
            acc[source] = (acc[source] || 0) + 1;
            return acc;
        }, {});

        const sourceData = Object.entries(sourceMap).map(([name, count]) => ({ name, count }));

        // Recent Leads
        const recentLeads = await prisma.lead.findMany({
            where: { workspaceId },
            take: 5,
            orderBy: { createdAt: 'desc' }
        });

        res.json({
            totalLeads,
            totalValue,
            statusDistribution,
            sourceData,
            recentLeads
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
