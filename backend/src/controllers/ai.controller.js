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

    // 1. Fetch Conversational History for Memory BEFORE saving current message
    const recentHistory = await prisma.aiChatHistory.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 12
    });
    const sortedHistory = recentHistory.reverse();

    // 2. Save current User Message to DB
    await prisma.aiChatHistory.create({
      data: { userId, role: 'user', content: message }
    });

    // 3. Get User Context (Enriched)
    let leads = [];
    let connections = [];
    let user = null;
    let metrics = {
      totalLeads: 0,
      totalValue: 0,
      leadsByStage: {}
    };

    try {
      const [allLeads, userConnections, userData, metaConnection, funnels, unifiedLeadsCount] = await Promise.all([
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
        }),
        prisma.metaUnifiedLead.count({ where: { workspaceId: req.workspaceId } })
      ]);

      leads = allLeads.slice(0, 15);
      connections = userConnections;
      user = userData;
      metrics.totalUnifiedLeads = unifiedLeadsCount;

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

        const adKeywords = ["anúncio", "campanha", "gasto", "meta", "facebook", "ads", "performance", "ctr", "investimento", "dinheiro", "valor", "portfólio", "business", "empresa", "conta", "gerenciador"];
        if (adKeywords.some(k => message.toLowerCase().includes(k)) || message.length > 50) {
          try {
            const [liveReport, businesses] = await Promise.all([
              metaService.getMetaReport(metaConnection.accessToken, "this_month"),
              metaService.getBusinesses(metaConnection.accessToken)
            ]);

            const businessesWithAssets = await Promise.all(businesses.map(async (b) => {
              try {
                const assets = await metaService.getBusinessAssets(b.id, metaConnection.accessToken);
                return { ...b, assets };
              } catch {
                return { ...b, assets: null };
              }
            }));

            const activeCampaigns = liveReport.campaigns.filter(c => c.status === "ACTIVE");
            
            metaContext += `
      LIVE PERFORMANCE (Este mês):
      - Gasto Total: R$ ${liveReport.totalSpend.toFixed(2)}
      - Leads Reportados (On-Facebook): ${liveReport.totalLeads}
      - CPM Médio: R$ ${(liveReport.totalImpressions > 0 ? (liveReport.totalSpend / liveReport.totalImpressions) * 1000 : 0).toFixed(2)}
      - CTR Médio: ${(liveReport.totalImpressions > 0 ? (liveReport.totalClicks / liveReport.totalImpressions) * 100 : 0).toFixed(2)}%
      
      PORTFÓLIOS / BUSINESS ACCOUNTS (${businessesWithAssets.length}):
      ${businessesWithAssets.map(b => {
        const adAccs = b.assets?.adAccounts?.map(a => `${a.name} (${a.currency} ${parseFloat(a.amount_spent || 0)/100})`).join(", ");
        const pages = b.assets?.pages?.map(p => p.name).join(", ");
        return `  - ${b.name} (ID: ${b.id}):
            * Contas de Anúncios: ${adAccs || "Nenhuma"}
            * Páginas: ${pages || "Nenhuma"}`;
      }).join("\n")}

      CAMPANHAS EM VEICULAÇÃO (${activeCampaigns.length}):
      ${activeCampaigns.slice(0, 10).map(c => `  * ${c.name}: R$ ${parseFloat(c.insights?.spend || 0).toFixed(2)} gasto, ${c.insights?.clicks || 0} cliques, ${c.insights?.actions?.find(a => a.action_type === "lead")?.value || 0} leads`).join("\n")}
      `;
          } catch (liveError) {
            console.warn("Could not fetch live report for AI context:", liveError.message);
          }
        } else {
          metaContext += `\n      - Para dados financeiros detalhados e portfólios, o usuário pode acessar /relatorios/meta ou /conexoes/meta`;
        }
      }

      metrics.metaContext = metaContext;
    } catch (dbError) {
      console.error("Erro ao buscar contexto para IA:", dbError);
    }

    // 4. Construct Highly Human-centric System Instructions & Context
    const systemInstruction = `
Você é a **Rastreia AI**, a copiloto e colega de equipe virtual inteligente do usuário no Rastreia.ai CRM.

### DIRETRIZES DE PERSONALIDADE E TOM (AJA COMO UMA HUMANA):
1. **Calorosa, Empática e Amigável**: Converse de maneira natural, simpática e profissional. Use parágrafos limpos, listas organizadas e evite soar fria ou puramente estatística.
2. **Alta Conversação**: Se o usuário fizer perguntas cotidianas, dúvidas gerais, ou quiser debater estratégias de negócios/vendas/marketing, responda com criatividade, profundidade e carisma em vez de apenas repetir números de CRM.
3. **Didática de Suporte**: Se o usuário perguntar como fazer algo no sistema, guie-o com explicações passo a passo detalhadas e fáceis de seguir.
4. **Comportamento com Saudações**: Se o usuário disser apenas "Olá", "Oi" ou similar, dê boas-vindas calorosas e pergunte como pode ajudar hoje, sem jogar um resumo massivo de dados de cara (a não ser que ele peça).

### CONHECIMENTO DO CRM RASTREIA.AI:
1. **Workspaces**: Ambientes multilocatários 100% isolados. O usuário pode alternar de workspace facilmente no topo do painel.
2. **Leads e Funis (Kanban)**: Os leads fluem por colunas visuais de etapas de funil (/funis). Cada lead possui tags, anotações, e valores financeiros (valor estimado, valor real ganho).
3. **Integração WhatsApp**: Gerida em /conexoes. Sincroniza com a Evolution API para ler conversas, importar chats e trocar mensagens diretamente.
4. **Meta Ads & Central de Leads Meta**: Captura leads de formulários de anúncios de forma automatizada. Todos caem primeiro na "Central de Leads Meta" (/relatorios/meta/leads-center) para que o usuário possa revisá-los e qualificá-los antes de enviá-los ao funil ativo.
5. **Assinaturas & Cancelamento**: Painel de faturamento em /assinatura. Em caso de cancelamento da recorrência, o usuário **NÃO** perde o acesso imediatamente; ele continua ativo com todos os recursos liberados até a data final de validade da assinatura (subscriptionExpiresAt), garantindo total respeito ao consumidor.
6. **Administração de Usuários**: Painel administrativo (/admin/sistema) onde exclusões de usuários são feitas de forma transacional e segura em cascata (limpando pivot tables e logs sem falhas de banco).
    `;

    const context = `
DADOS ATUAIS DO WORKSPACE (USUÁRIO: ${user?.name || "N/A"}):
- Total de Leads no CRM: ${metrics.totalLeads}
- Valor Acumulado no Funil: R$ ${metrics.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
- Distribuição por Estágio: ${JSON.stringify(metrics.leadsByStage)}
- Conexões WhatsApp Ativas: ${connections.length}
- Leads Unificados na Central Meta: ${metrics.totalUnifiedLeads || 0}
${metrics.metaContext || "- Meta Ads: não conectado"}

DETALHES DE LEADS RECENTES:
${leads.map(l => `- ${l.name} (${l.phone || 'Sem tel'}) - Valor: R$ ${Number(l.value || 0).toFixed(2)} - Status/Estágio: ${l.stage?.name || l.status}`).join('\n')}

LINKS ÚTEIS DO SISTEMA:
- Central de Leads: /relatorios/meta/leads-center
- Relatórios Meta: /relatorios/meta
- Funil / Kanban: /funis
- Gestão de Assinatura: /assinatura
    `;

    let aiResponse = "";

    try {
      if (settings.provider === 'google') {
        const genAI = new GoogleGenerativeAI(settings.apiKey);
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
          },
          systemInstruction: systemInstruction + "\n\n" + (settings.systemPrompt || "") + "\n\nCONTEXTO DO CRM DO USUÁRIO:\n" + context
        });

        // Map conversational memory to Gemini history format
        const geminiHistory = sortedHistory.map(h => ({
          role: h.role === 'user' ? 'user' : 'model',
          parts: [{ text: h.content }]
        }));

        const chatSession = model.startChat({
          history: geminiHistory,
        });

        const result = await chatSession.sendMessage(message);
        const response = await result.response;
        aiResponse = response.text();
      } 
      else if (settings.provider === 'openai') {
        const openai = new OpenAI({ apiKey: settings.apiKey });
        const messagesToSend = [
          { role: "system", content: systemInstruction + "\n\n" + (settings.systemPrompt || "") + "\n\nCONTEXTO DO CRM DO USUÁRIO:\n" + context },
          ...sortedHistory.map(h => ({
            role: h.role === 'user' ? 'user' : 'assistant',
            content: h.content
          })),
          { role: "user", content: message }
        ];

        const completion = await openai.chat.completions.create({
          model: settings.modelName || "gpt-4",
          messages: messagesToSend,
          temperature: settings.temperature || 0.7
        });
        aiResponse = completion.choices[0].message.content;
      }
      else {
        return res.status(400).json({ error: "Provedor de IA não suportado no momento." });
      }
    } catch (apiError) {
      console.error(`Erro detalhado na API de IA (${settings.provider}):`, apiError);
      return res.status(500).json({ 
        error: `Erro na API da ${settings.provider}. Verifique sua API Key e cotas.`,
        details: apiError.message 
      });
    }

    // 5. Save AI Response to DB
    const savedResponse = await prisma.aiChatHistory.create({
      data: { userId, role: 'assistant', content: aiResponse }
    });

    res.json(savedResponse);

  } catch (error) {
    console.error("Erro AI Chat:", error);
    res.status(500).json({ error: "Erro ao processar mensagem da IA" });
  }
};
