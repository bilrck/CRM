import prisma from "../config/prisma.js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";

export const getAiSettings = async (req, res) => {
  try {
    let settings = await prisma.aiSetting.findUnique({
      where: { userId: req.user.id }
    });

    if (!settings) {
      settings = await prisma.aiSetting.create({
        data: { userId: req.user.id }
      });
    }

    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: "Erro ao buscar configurações de IA" });
  }
};

export const updateAiSettings = async (req, res) => {
  try {
    const { provider, apiKey, modelName, isEnabled, temperature, systemPrompt } = req.body;

    const settings = await prisma.aiSetting.upsert({
      where: { userId: req.user.id },
      update: { provider, apiKey, modelName, isEnabled, temperature, systemPrompt },
      create: { userId: req.user.id, provider, apiKey, modelName, isEnabled, temperature, systemPrompt }
    });

    res.json(settings);
  } catch (error) {
    console.error("Erro ao atualizar AI settings:", error);
    res.status(500).json({ error: "Erro ao atualizar configurações de IA" });
  }
};

export const getChatHistory = async (req, res) => {
  try {
    const history = await prisma.aiChatHistory.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'asc' },
      take: 50
    });
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: "Erro ao buscar histórico" });
  }
};

export const chat = async (req, res) => {
  try {
    const { message } = req.body;
    const userId = req.user.id;

    const settings = await prisma.aiSetting.findUnique({ where: { userId } });

    if (!settings) {
      return res.status(400).json({ error: "Configurações de IA não encontradas para este usuário." });
    }
    if (!settings.isEnabled) {
      return res.status(400).json({ error: "A Inteligência Artificial está desativada no painel." });
    }
    if (!settings.apiKey) {
      return res.status(400).json({ error: "API Key não configurada. Por favor, insira uma chave válida." });
    }

    // 1. Get User Context (Enriched)
    let leads = [];
    let connections = [];
    let user = null;
    let metrics = {
      totalLeads: 0,
      totalValue: 0,
      leadsByStatus: {}
    };

    try {
      const [allLeads, userConnections, userData] = await Promise.all([
        prisma.lead.findMany({ where: { ownerId: userId } }),
        prisma.connection.findMany({ where: { userId } }),
        prisma.user.findUnique({ where: { id: userId } })
      ]);

      leads = allLeads.slice(0, 15);
      connections = userConnections;
      user = userData;

      metrics.totalLeads = allLeads.length;
      metrics.totalValue = allLeads.reduce((acc, l) => acc + Number(l.value || 0), 0);
      allLeads.forEach(l => {
        metrics.leadsByStatus[l.status] = (metrics.leadsByStatus[l.status] || 0) + 1;
      });
    } catch (dbError) {
      console.error("Erro ao buscar contexto para IA:", dbError);
    }

    const context = `
      DADOS DO SISTEMA (USUÁRIO ${user?.name}):
      - Total de Leads: ${metrics.totalLeads}
      - Valor Acumulado (Budget): R$ ${metrics.totalValue.toFixed(2)}
      - Leads por Status: ${JSON.stringify(metrics.leadsByStatus)}
      - Conexões Ativas: ${connections.length}

      DETALHES RECENTES (Últimos 15 leads):
      ${leads.map(l => `- ${l.name} (R$ ${Number(l.value || 0).toFixed(2)}) - Status: ${l.status}`).join('\n')}

      INSTRUÇÃO: Você é o Assistente Rastreia AI.
      1. Se o usuário apenas te cumprimentar (olá, bom dia, etc), responda de forma natural e amigável, sem listar todos os dados de uma vez.
      2. Use os dados de "DADOS DO SISTEMA" e "DETALHES RECENTES" APENAS se o usuário fizer perguntas específicas sobre leads, valores, status ou desempenho.
      3. Seja conciso e direto. Não repita informações que não foram solicitadas.
      4. Responda como um consultor estratégico que conhece os dados, mas não é um robô de relatórios.
    `;

    // 2. Save User Message
    await prisma.aiChatHistory.create({
      data: { userId, role: 'user', content: message }
    });

    let aiResponse = "";

    try {
      if (settings.provider === 'google') {
        const genAI = new GoogleGenerativeAI(settings.apiKey);
        
        // Garantir que o nome do modelo não tenha o prefixo 'models/' duplicado
        const modelName = settings.modelName?.replace('models/', '') || "gemini-1.5-pro";
        
        const model = genAI.getGenerativeModel({ 
          model: modelName,
          safetySettings: [
            { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
          ],
          generationConfig: {
            temperature: settings.temperature || 0.7,
            topP: 0.95,
            topK: 40,
            maxOutputTokens: 8192,
          }
        });
        
        const prompt = `${settings.systemPrompt || "Você é um assistente de CRM."}\n\nCONTEXTO DO USUÁRIO:\n${context}\n\nMensagem do usuário: ${message}`;
        
        const result = await model.generateContent(prompt);
        const response = await result.response;
        aiResponse = response.text();
      } 
      else if (settings.provider === 'openai') {
        const openai = new OpenAI({ apiKey: settings.apiKey });
        const completion = await openai.chat.completions.create({
          model: settings.modelName || "gpt-4",
          messages: [
            { role: "system", content: (settings.systemPrompt || "") + "\n\nCONTEXTO DO USUÁRIO:\n" + context },
            { role: "user", content: message }
          ],
          temperature: settings.temperature
        });
        aiResponse = completion.choices[0].message.content;
      }
      else {
        return res.status(400).json({ error: "Provedor de IA não suportado no momento." });
      }
    } catch (apiError) {
      console.error(`Erro detalhado na API de IA (${settings.provider}):`, {
        message: apiError.message,
        stack: apiError.stack,
        response: apiError.response?.data || apiError.response
      });
      return res.status(500).json({ 
        error: `Erro na API da ${settings.provider}. Verifique sua API Key e cotas.`,
        details: apiError.message 
      });
    }

    // 3. Save AI Response
    const savedResponse = await prisma.aiChatHistory.create({
      data: { userId, role: 'assistant', content: aiResponse }
    });

    res.json(savedResponse);

  } catch (error) {
    console.error("Erro AI Chat:", error);
    res.status(500).json({ error: "Erro ao processar mensagem da IA" });
  }
};
