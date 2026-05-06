import prisma from "../config/prisma.js";

export default async function apiAuthMiddleware(req, res, next) {
    try {
        const apiKey = req.headers['x-api-key'];

        if (!apiKey) {
            return res.status(401).json({ error: "API Key não fornecida (Header: x-api-key)" });
        }

        const keyRecord = await prisma.apiKey.findUnique({
            where: { key: apiKey },
            include: { workspace: true }
        });

        if (!keyRecord || !keyRecord.isActive) {
            return res.status(401).json({ error: "API Key inválida ou inativa" });
        }

        // Attach Context
        req.workspaceId = keyRecord.workspaceId;
        req.apiKey = keyRecord;
        req.isApiRequest = true; // Flag para controllers saberem que é API externa

        next();

    } catch (error) {
        console.error("API Auth Error:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}
