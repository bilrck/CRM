import prisma from "../config/prisma.js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";
import * as metaService from "../services/meta.service.js";

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
      const [allLeads, userConnections, userData, metaConnection, funnels] = await Promise.all([
        prisma.lead.findMany({ 
          where: { workspaceId: req.workspaceId },
          include: { stage: { select: { name: true } } }
        }),
        prisma.connection.findMany({ where: { userId } }),
        prisma.user.findUnique({ where: { id: userId } }),
        prisma.metaConnection.findFirst({
          where: { workspaceId: req.workspaceId },
          include: {
            pages: {
              include: {
                forms: { include: { _count: { select: { leads: true } } } }
              }
            }
          }
        }),
        prisma.funnel.findMany({
          where: { workspaceId: req.workspaceId },
          include: { stages: { select: { id: true, name: true } } }
        })
      ]);

      leads = allLeads.slice(0, 15);
      connections = userConnections;
      user = userData;

      metrics.totalLeads = allLeads.length;
      metrics.totalValue = allLeads.reduce((acc, l) => acc + Number(l.value || 0), 0);
      
      const leadsByStage = {};
      allLeads.forEach(l => {
        const stageName = l.stage?.name || l.status || "Sem Estágio";
        leadsByStage[stageName] = (leadsByStage[stageName] || 0) + 1;
      });
      metrics.leadsByStage = leadsByStage;

      // Build Meta context string
      let metaContext = "";
      if (metaConnection) {
        const pagesInfo = metaConnection.pages.map(p => {
          const formsSummary = p.forms.map(f =>
            `    - Formulário "${f.name}": ${f._count?.leads || 0} leads`
          ).join("\n");
          return `  - Página: ${p.name} (${p.isConnected ? "sincronizada" : "não sincronizada"})\n${formsSummary}`;
        }).join("\n");

        const totalMetaLeads = metaConnection.pages.reduce((sum, p) =>
          sum + p.forms.reduce((s, f) => s + (f._count?.leads || 0), 0), 0
        );

        metaContext = `
      META ADS (Conta: ${metaConnection.name}):
      - Total de leads capturados via formulários Meta: ${totalMetaLeads}
      - Páginas conectadas: ${metaConnection.pages.length}
${pagesInfo}`;

        // 🔥 Dynamic Context: Fetch live report summary ONLY if user asks about Ads/Finance
        const adKeywords = ["anúncio", "campanha", "gasto", "meta", "facebook", "ads", "performance", "ctr", "investimento", "dinheiro", "valor"];
        if (adKeywords.some(k => message.toLowerCase().includes(k)) || message.length > 50) {
          try {
            const liveReport = await metaService.getMetaReport(metaConnection.accessToken, "this_month");
            const activeCampaigns = liveReport.campaigns.filter(c => c.status === "ACTIVE");
            
            metaContext += `
      LIVE REPORT (Métricas de Anúncios deste mês):
      - Gasto Total (Spend): R$ ${liveReport.totalSpend.toFixed(2)}
      - Leads Reportados pela Meta (On-Facebook): ${liveReport.totalLeads}
      - CPM Médio: R$ ${(liveReport.totalImpressions > 0 ? (liveReport.totalSpend / liveReport.totalImpressions) * 1000 : 0).toFixed(2)}
      - CTR Médio: ${(liveReport.totalImpressions > 0 ? (liveReport.totalClicks / liveReport.totalImpressions) * 100 : 0).toFixed(2)}%
      - Campanhas Ativas (${activeCampaigns.length}):
        ${activeCampaigns.slice(0, 5).map(c => `  * ${c.name}: R$ ${parseFloat(c.insights?.spend || 0).toFixed(2)} gasto, ${c.insights?.clicks || 0} cliques`).join("\n")}
      
      CONTAS DE ANÚNCIOS:
      ${liveReport.adAccounts.map(acc => `  - ${acc.name}: R$ ${parseFloat(acc.amount_spent || 0).toFixed(2)} total gasto histórico, Status: ${acc.account_status === 1 ? 'Ativa' : 'Problema'}`).join("\n")}
      `;
          } catch (liveError) {
            console.warn("Could not fetch live report for AI context:", liveError.message);
          }
        } else {
          metaContext += `\n      - Para dados financeiros detalhados e gráficos, o usuário pode acessar /relatorios/meta`;
        }
      }

      // Store metaContext in metrics for use below
      metrics.metaContext = metaContext;
    } catch (dbError) {
      console.error("Erro ao buscar contexto para IA:", dbError);
    }

    const context = `
      DADOS DO SISTEMA (USUÁRIO ${user?.name}):
      - Total de Leads no CRM: ${metrics.totalLeads}
      - Valor Acumulado (Budget): R$ ${metrics.totalValue.toFixed(2)}
      - Distribuição por Estágio do Funil: ${JSON.stringify(metrics.leadsByStage)}
      - Conexões WhatsApp Ativas: ${connections.length}
${metrics.metaContext || "      - Meta Ads: não conectado ou erro na sincronização"}

      DETALHES DOS LEADS RECENTES (Últimos 15):
      ${leads.map(l => `- ${l.name} (${l.phone || 'Sem tel'}) - Valor: R$ ${Number(l.value || 0).toFixed(2)} - Estágio: ${l.stage?.name || l.status}`).join('\n')}

      INSTRUÇÃO PARA O ASSISTENTE RASTREIA AI:
      1. Você é um analista de performance e consultor de vendas. Seja amigável e profissional.
      2. Priorize responder com os dados numéricos presentes no contexto acima.
      3. Se o usuário perguntar sobre gastos ou anúncios e os dados de "LIVE REPORT" estiverem disponíveis, responda diretamente com os valores.
      4. Somente sugira acessar "/relatorios/meta" ou "/dashboard" se o usuário pedir gráficos complexos ou se os dados específicos não estiverem no contexto.
      5. Se houver discrepância entre leads no CRM (${metrics.totalLeads}) e leads na Meta, explique que isso pode ser devido a filtros ou leads manuais.
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
