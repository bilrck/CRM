import prisma from "../config/prisma.js";

export const listLogs = async (req, res) => {
    try {
        // Apenas ADMINGlobal ou Admin do Workspace (se aplicável, mas aqui o user pediu admin geral)
        if (req.user.role !== "ADMIN") {
            return res.status(403).json({ error: "Acesso negado." });
        }

        const { category, level, limit = 50, offset = 0 } = req.query;

        const where = {};
        if (category) where.category = category;
        if (level) where.level = level;

        const logs = await prisma.systemLog.findMany({
            where,
            orderBy: { createdAt: "desc" },
            take: Number(limit),
            skip: Number(offset),
            include: {
                user: {
                    select: { name: true, email: true }
                },
                workspace: {
                    select: { name: true }
                }
            }
        });

        const total = await prisma.systemLog.count({ where });

        res.json({ logs, total });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
