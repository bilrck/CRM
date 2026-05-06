import prisma from "../config/prisma.js";

export const listPlans = async (req, res) => {
    try {
        const plans = await prisma.plan.findMany({
            where: { isActive: true },
            orderBy: { price: "asc" }
        });
        res.json(plans);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const createPlan = async (req, res) => {
    try {
        if (req.user.role !== "ADMIN") return res.status(403).json({ error: "Acesso negado" });
        const { name, description, daysValid, price, role, features } = req.body;
        
        const plan = await prisma.plan.create({
            data: {
                name,
                description,
                daysValid: Number(daysValid),
                price: Number(price),
                role,
                features: Array.isArray(features) ? features : []
            }
        });
        res.status(201).json(plan);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const updatePlan = async (req, res) => {
    try {
        if (req.user.role !== "ADMIN") return res.status(403).json({ error: "Acesso negado" });
        const { id } = req.params;
        const data = req.body;
        
        const updated = await prisma.plan.update({
            where: { id: Number(id) },
            data
        });
        res.json(updated);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const deletePlan = async (req, res) => {
    try {
        if (req.user.role !== "ADMIN") return res.status(403).json({ error: "Acesso negado" });
        const { id } = req.params;
        await prisma.plan.delete({ where: { id: Number(id) } });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
