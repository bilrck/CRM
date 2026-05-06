import prisma from "../config/prisma.js";
import fetch from "node-fetch";

// --- CRUD Controllers ---

export const listAutomations = async (req, res) => {
  try {
    const automations = await prisma.automation.findMany({
      where: { workspaceId: req.workspaceId },
      orderBy: { createdAt: 'desc' }
    });
    res.json(automations);
  } catch (error) {
    console.error("Error listing automations:", error);
    res.status(500).json({ error: "Erro ao listar automações" });
  }
};

export const createAutomation = async (req, res) => {
  try {
    const { name, triggerEvent, triggerConditions, actionType, actionConfig, isActive } = req.body;

    // Basic validation
    if (!name || !triggerEvent || !actionType) {
      return res.status(400).json({ error: "Nome, Evento e Ação são obrigatórios." });
    }
    
    // Webhook specific validation
    if (actionType === "WEBHOOK" && !actionConfig?.url) {
      return res.status(400).json({ error: "A URL do Webhook é obrigatória para este tipo de ação." });
    }

    const automation = await prisma.automation.create({
      data: {
        name,
        triggerEvent,
        triggerConditions: triggerConditions || {},
        actionType,
        actionConfig,
        isActive: isActive !== false,
        workspaceId: req.workspaceId
      }
    });

    res.status(201).json(automation);
  } catch (error) {
    console.error("Error creating automation:", error);
    res.status(500).json({ error: "Erro ao criar automação" });
  }
};

export const updateAutomation = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, triggerEvent, triggerConditions, actionType, actionConfig, isActive } = req.body;

    const existing = await prisma.automation.findUnique({ where: { id: parseInt(id) } });
    if (!existing || existing.workspaceId !== req.workspaceId) {
      return res.status(404).json({ error: "Automação não encontrada" });
    }

    if (actionType === "WEBHOOK" && !actionConfig?.url) {
      return res.status(400).json({ error: "A URL do Webhook é obrigatória para este tipo de ação." });
    }

    const automation = await prisma.automation.update({
      where: { id: parseInt(id) },
      data: {
        name,
        triggerEvent,
        triggerConditions,
        actionType,
        actionConfig,
        isActive
      }
    });

    res.json(automation);
  } catch (error) {
    console.error("Error updating automation:", error);
    res.status(500).json({ error: "Erro ao atualizar automação" });
  }
};

export const deleteAutomation = async (req, res) => {
  try {
    const { id } = req.params;
    
    const existing = await prisma.automation.findUnique({ where: { id: parseInt(id) } });
    if (!existing || existing.workspaceId !== req.workspaceId) {
      return res.status(404).json({ error: "Automação não encontrada" });
    }

    await prisma.automation.delete({ where: { id: parseInt(id) } });
    
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting automation:", error);
    res.status(500).json({ error: "Erro ao deletar automação" });
  }
};

export const toggleAutomation = async (req, res) => {
    try {
      const { id } = req.params;
      const { isActive } = req.body;
      
      const existing = await prisma.automation.findUnique({ where: { id: parseInt(id) } });
      if (!existing || existing.workspaceId !== req.workspaceId) {
        return res.status(404).json({ error: "Automação não encontrada" });
      }
  
      const automation = await prisma.automation.update({
        where: { id: parseInt(id) },
        data: { isActive }
      });
      
      res.json(automation);
    } catch (error) {
      console.error("Error toggling automation:", error);
      res.status(500).json({ error: "Erro ao alterar status da automação" });
    }
  };

// --- Execution Service ---

/**
 * Service to execute automations based on events.
 * Triggered from other controllers (e.g., leads.controller.js)
 */
export const executeAutomations = async (workspaceId, eventName, payload) => {
  try {
    // 1. Find active automations for this event in this workspace
    const automations = await prisma.automation.findMany({
      where: {
        workspaceId,
        triggerEvent: eventName,
        isActive: true
      }
    });

    if (automations.length === 0) return;

    console.log(`[Automations] Found ${automations.length} active automations for event '${eventName}' in workspace ${workspaceId}`);

    // 2. Loop through and execute
    for (const auto of automations) {
      // Optional: Check triggerConditions here (e.g., only trigger if lead is 'won')
      // For mvp, we trigger all matching the event name.
      
      if (auto.actionType === 'WEBHOOK') {
        const config = auto.actionConfig;
        if (config && config.url) {
          console.log(`[Automations] Dispatching Webhook to: ${config.url}`);
          
          // Fire and forget (don't await strictly to prevent slowing down the main request)
          fetch(config.url, {
            method: config.method || 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              event: eventName,
              timestamp: new Date().toISOString(),
              data: payload,
              automationName: auto.name
            })
          }).catch(err => {
            console.error(`[Automations] Webhook error for automation ${auto.id}:`, err.message);
          });
        }
      }
    }
  } catch (error) {
    console.error(`[Automations] Critical error executing automations for event '${eventName}':`, error);
  }
};
