// Add this to whatsapp.controller.js

export const createLeadFromConversation = async (req, res) => {
    try {
        const { id } = req.params;
        const { status = 'new' } = req.body;
        const workspaceId = req.workspaceId;

        // Find the conversation
        const conversation = await prisma.whatsappConversation.findUnique({
            where: { id: Number(id) }
        });

        if (!conversation || conversation.workspaceId !== workspaceId) {
            return res.status(404).json({ error: "Conversa não encontrada" });
        }

        // Check if lead already exists for this conversation
        if (conversation.leadId) {
            const existingLead = await prisma.lead.findUnique({
                where: { id: conversation.leadId }
            });
            return res.status(400).json({ error: "Lead já existe para esta conversa", lead: existingLead });
        }

        // Create lead from conversation
        const lead = await prisma.lead.create({
            data: {
                name: conversation.name || conversation.remoteJid,
                phone: conversation.remoteJid.split('@')[0],
                source: 'whatsapp',
                status: status,
                workspaceId: workspaceId
            }
        });

        // Link conversation to lead
        await prisma.whatsappConversation.update({
            where: { id: Number(id) },
            data: { leadId: lead.id }
        });

        return res.json(lead);
    } catch (error) {
        console.error("Erro ao criar lead:", error);
        return res.status(500).json({ error: "Erro ao criar lead" });
    }
};
