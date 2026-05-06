import prisma from "../config/prisma.js";
import { v4 as uuidv4 } from "uuid";

export const listApiKeys = async (req, res) => {
    try {
        const workspaceId = req.workspaceId;
        const keys = await prisma.apiKey.findMany({
            where: { workspaceId },
            orderBy: { createdAt: 'desc' }
        });
        res.json(keys);
    } catch (error) {
        res.status(500).json({ error: "Erro ao listar chaves" });
    }
};

export const createApiKey = async (req, res) => {
    try {
        const workspaceId = req.workspaceId;
        const { name, scopes } = req.body;

        const key = `sk_${uuidv4().replace(/-/g, '')}`;

        const newKey = await prisma.apiKey.create({
            data: {
                name: name || "Nova Chave",
                key,
                workspaceId,
                scopes: scopes || []
            }
        });

        res.json(newKey);
    } catch (error) {
        res.status(500).json({ error: "Erro ao criar chave" });
    }
};

export const revokeApiKey = async (req, res) => {
    try {
        const { id } = req.params;
        const workspaceId = req.workspaceId;

        await prisma.apiKey.update({
            where: { id: Number(id), workspaceId }, // Garante que pertence ao workspace
            data: { isActive: false }
        });

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: "Erro ao revogar chave" });
    }
};
