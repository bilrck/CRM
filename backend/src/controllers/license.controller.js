import prisma from "../config/prisma.js";
import crypto from "crypto";

export const listKeys = async (req, res) => {
    try {
        if (req.user.role !== "ADMIN") return res.status(403).json({ error: "Acesso negado" });
        
        const keys = await prisma.licenseKey.findMany({
            include: { plan: true },
            orderBy: { createdAt: "desc" }
        });
        res.json(keys);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const createKey = async (req, res) => {
    try {
        if (req.user.role !== "ADMIN") return res.status(403).json({ error: "Acesso negado" });
        
        const { planId, usageLimit, reminderEnabled } = req.body;
        
        let daysValid = 30;
        let priceGestor = 0;
        let priceCliente = 0;

        if (planId) {
            const plan = await prisma.plan.findUnique({ where: { id: Number(planId) } });
            if (plan) {
                daysValid = plan.daysValid;
                // If the plan is for MANAGER, set priceGestor, etc.
                if (plan.role === "MANAGER") priceGestor = Number(plan.price);
                else priceCliente = Number(plan.price);
            }
        }
        
        const key = crypto.randomBytes(8).toString("hex").toUpperCase();
        
        const newKey = await prisma.licenseKey.create({
            data: {
                key,
                daysValid,
                usageLimit: Number(usageLimit),
                priceGestor,
                priceCliente,
                reminderEnabled: Boolean(reminderEnabled),
                planId: planId ? Number(planId) : null
            },
            include: { plan: true }
        });
        
        res.status(201).json(newKey);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const updateKey = async (req, res) => {
    try {
        if (req.user.role !== "ADMIN") return res.status(403).json({ error: "Acesso negado" });
        const { id } = req.params;
        let { isActive, reminderEnabled } = req.body;
        
        // Ensure isActive is boolean
        if (typeof isActive === "string") isActive = isActive === "true";
        
        const updated = await prisma.licenseKey.update({
            where: { id: Number(id) },
            data: { isActive, reminderEnabled }
        });

        // 🛡️ Logic: Handle side-effects on users
        if (isActive === false) {
            console.log(`[License] Revogando chave ID ${id}. Buscando ativações...`);
            const activations = await prisma.licenseActivation.findMany({
                where: { keyId: Number(id) },
                select: { userId: true }
            });
            
            const userIds = activations.map(a => a.userId);
            if (userIds.length > 0) {
                await prisma.user.updateMany({
                    where: { 
                        id: { in: userIds },
                        role: { not: "ADMIN" }
                    },
                    data: { subscriptionStatus: "EXPIRED" }
                });
                console.log(`[License] ${userIds.length} usuários marcados como EXPIRED.`);
            }
        } else if (isActive === true) {
            console.log(`[License] Reativando chave ID ${id}. Restaurando usuários...`);
            const activations = await prisma.licenseActivation.findMany({
                where: { keyId: Number(id) },
                select: { userId: true }
            });
            
            const userIds = activations.map(a => a.userId);
            if (userIds.length > 0) {
                // Restore to ACTIVE only if they haven't passed their expiration date
                const now = new Date();
                await prisma.user.updateMany({
                    where: { 
                        id: { in: userIds },
                        role: { not: "ADMIN" },
                        subscriptionExpiresAt: { gt: now } // Only if still valid
                    },
                    data: { subscriptionStatus: "ACTIVE" }
                });
                console.log(`[License] Usuários da chave ${id} restaurados para ACTIVE (se válidos).`);
            }
        }
        
        res.json(updated);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const deleteKey = async (req, res) => {
    try {
        if (req.user.role !== "ADMIN") return res.status(403).json({ error: "Acesso negado" });
        const { id } = req.params;
        
        // Before deleting, we might want to expire users too? 
        // User didn't specify for delete, but it makes sense.
        await prisma.licenseKey.delete({ where: { id: Number(id) } });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const activateKey = async (req, res) => {
    try {
        const { key } = req.body;
        const userId = req.user.id;
        
        const license = await prisma.licenseKey.findUnique({
            where: { key }
        });
        
        if (!license || !license.isActive) {
            return res.status(404).json({ error: "Chave inválida ou inativa" });
        }
        
        if (license.currentUsage >= license.usageLimit) {
            return res.status(400).json({ error: "Limite de uso da chave atingido" });
        }

        // Check if user already used THIS specific key
        const alreadyUsed = await prisma.licenseActivation.findFirst({
            where: { keyId: license.id, userId }
        });
        if (alreadyUsed) return res.status(400).json({ error: "Você já ativou esta chave anteriormente" });
        
        // Update user subscription
        const user = await prisma.user.findUnique({ where: { id: userId } });
        
        let newExpiry = new Date();
        const now = new Date();
        
        if (user.subscriptionExpiresAt && user.subscriptionExpiresAt > now) {
            newExpiry = new Date(user.subscriptionExpiresAt.getTime() + (license.daysValid * 24 * 60 * 60 * 1000));
        } else {
            newExpiry.setDate(now.getDate() + license.daysValid);
        }
        
        await prisma.user.update({
            where: { id: userId },
            data: {
                subscriptionStatus: "ACTIVE",
                subscriptionExpiresAt: newExpiry,
                billingStatus: "ativo",
                billingReminderConfig: {
                    ...(user.billingReminderConfig || {}),
                    enabled: license.reminderEnabled
                }
            }
        });
        
        // Record activation
        await prisma.licenseActivation.create({
            data: {
                keyId: license.id,
                userId
            }
        });

        // Update key usage
        await prisma.licenseKey.update({
            where: { id: license.id },
            data: { currentUsage: { increment: 1 } }
        });
        
        res.json({ success: true, newExpiry });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

export const generateExternal = async (req, res) => {
    try {
        const masterKey = process.env.MASTER_ADMIN_KEY || "RASTREIA_MASTER_2026";
        const clientKey = req.headers["x-api-key"];

        if (!clientKey || clientKey !== masterKey) {
            return res.status(401).json({ error: "Não autorizado" });
        }

        const { daysValid, usageLimit, priceGestor, priceCliente, reminderEnabled } = req.body;
        
        const key = crypto.randomBytes(8).toString("hex").toUpperCase();
        
        const newKey = await prisma.licenseKey.create({
            data: {
                key,
                daysValid: Number(daysValid || 30),
                usageLimit: Number(usageLimit || 1),
                priceGestor: Number(priceGestor || 0),
                priceCliente: Number(priceCliente || 0),
                reminderEnabled: reminderEnabled !== undefined ? Boolean(reminderEnabled) : true
            }
        });
        
        res.status(201).json({ key: newKey.key, id: newKey.id });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
