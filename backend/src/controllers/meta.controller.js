import prisma from "../config/prisma.js";
import * as metaService from "../services/meta.service.js";
import { ExternalApiError } from "../utils/api-client.js";

const REQUIRED_SCOPES = [
  "ads_management",
  "ads_read",
  "pages_show_list",
  "pages_manage_metadata",
  "pages_read_engagement",
  "leads_retrieval",
  "business_management",
  "instagram_basic",
  "instagram_manage_insights",
].join(",");

/**
 * Returns the Facebook OAuth URL so the frontend can redirect the user.
 * The `state` param encodes the workspaceId + JWT token to restore session after redirect.
 */
export const getOAuthUrl = async (req, res) => {
  try {
    const { workspaceId } = req;
    const appId = process.env.META_APP_ID;
    const redirectUri = `${process.env.API_URL}/meta/oauth/callback`;

    if (!appId) {
      return res.status(500).json({ error: "META_APP_ID não configurado no servidor" });
    }

    // Encode workspaceId in state so we can restore context after redirect
    const state = Buffer.from(JSON.stringify({ workspaceId })).toString("base64url");

    const url = new URL("https://www.facebook.com/v18.0/dialog/oauth");
    url.searchParams.set("client_id", appId);
    url.searchParams.set("redirect_uri", redirectUri);
    url.searchParams.set("scope", REQUIRED_SCOPES);
    url.searchParams.set("state", state);
    url.searchParams.set("response_type", "code");

    res.json({ url: url.toString() });
  } catch (error) {
    console.error("getOAuthUrl error:", error);
    res.status(500).json({ error: "Erro ao gerar URL de autenticação" });
  }
};

/**
 * Gets the current Meta connection settings (config).
 */
export const getSettings = async (req, res) => {
  try {
    const { workspaceId } = req;
    const connection = await prisma.metaConnection.findFirst({
      where: { workspaceId },
      select: { config: true }
    });
    
    if (!connection) {
      return res.status(404).json({ error: "Nenhuma conexão Meta encontrada" });
    }
    
    res.json(connection.config || {});
  } catch (error) {
    console.error("getSettings error:", error);
    res.status(500).json({ error: "Erro ao buscar configurações" });
  }
};

/**
 * Updates the Meta connection settings (config).
 */
export const updateSettings = async (req, res) => {
  try {
    const { workspaceId } = req;
    const { config } = req.body;
    
    const connection = await prisma.metaConnection.findFirst({
      where: { workspaceId }
    });
    
    if (!connection) {
      return res.status(404).json({ error: "Nenhuma conexão Meta encontrada" });
    }
    
    const updated = await prisma.metaConnection.update({
      where: { id: connection.id },
      data: { config }
    });
    
    res.json(updated.config);
  } catch (error) {
    console.error("updateSettings error:", error);
    res.status(500).json({ error: "Erro ao atualizar configurações" });
  }
};

/**
 * OAuth Callback — called by Facebook after user grants permissions.
 * Exchanges the `code` for an access token, saves connection, then redirects to frontend.
 */
export const oauthCallback = async (req, res) => {
  try {
    const { code, state, error: fbError, error_description } = req.query;
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";

    if (fbError) {
      console.error("Facebook OAuth error:", fbError, error_description);
      return res.redirect(`${frontendUrl}/conexoes/meta?error=facebook_denied`);
    }

    if (!code || !state) {
      return res.redirect(`${frontendUrl}/conexoes/meta?error=invalid_callback`);
    }

    // Decode state to get workspaceId
    let workspaceId;
    try {
      const decoded = JSON.parse(Buffer.from(state, "base64url").toString());
      workspaceId = decoded.workspaceId;
    } catch {
      return res.redirect(`${frontendUrl}/conexoes/meta?error=invalid_state`);
    }

    const appId = process.env.META_APP_ID;
    const appSecret = process.env.META_APP_SECRET;
    const redirectUri = `${process.env.API_URL}/meta/oauth/callback`;

    // 1. Exchange code for short-lived token
    const tokenRes = await fetch(
      `https://graph.facebook.com/v18.0/oauth/access_token?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${appSecret}&code=${code}`
    );
    const tokenData = await tokenRes.json();

    if (!tokenData.access_token) {
      console.error("Failed to exchange code:", tokenData);
      return res.redirect(`${frontendUrl}/conexoes/meta?error=token_exchange_failed`);
    }

    // 2. Exchange short-lived → long-lived (60 days)
    let longLivedToken = tokenData.access_token;
    let expiresAt = null;
    try {
      const longLived = await metaService.exchangeUserToken(tokenData.access_token);
      longLivedToken = longLived.access_token;
      expiresAt = longLived.expires_in
        ? new Date(Date.now() + longLived.expires_in * 1000)
        : null;
    } catch (e) {
      console.warn("Could not exchange for long-lived token, using short-lived:", e.message);
    }

    // 3. Get user info from Meta
    const meRes = await fetch(`https://graph.facebook.com/v18.0/me?access_token=${longLivedToken}&fields=id,name`);
    const meData = await meRes.json();
    const fbUserId = meData.id;
    const fbName = meData.name || "Conta Meta";

    if (!fbUserId) {
      return res.redirect(`${frontendUrl}/conexoes/meta?error=user_info_failed`);
    }

    // 4. Upsert MetaConnection
    const connection = await prisma.metaConnection.upsert({
      where: { fbUserId },
      update: { accessToken: longLivedToken, name: fbName, expiresAt, status: "active", workspaceId },
      create: { fbUserId, accessToken: longLivedToken, name: fbName, expiresAt, workspaceId },
    });

    // 5. Sync Businesses and Pages (New Architecture)
    try {
      const businesses = await metaService.getBusinesses(longLivedToken);
      
      for (const b of businesses) {
        const savedBusiness = await prisma.metaBusiness.upsert({
          where: { businessId: b.id },
          update: {
            name: b.name,
            verificationStatus: b.verification_status,
            vertical: b.vertical
          },
          create: {
            businessId: b.id,
            name: b.name,
            verificationStatus: b.verification_status,
            vertical: b.vertical,
            workspaceId,
            metaConnectionId: connection.id
          }
        });

        const pages = await metaService.getBusinessPages(b.id, longLivedToken);

        for (const p of pages) {
          let pageToken = null;
          try {
            pageToken = await metaService.getPageAccessToken(p.id, longLivedToken);
          } catch (e) {
            console.warn(`Could not get token for page ${p.id}:`, e.message);
          }

          await prisma.metaPage.upsert({
            where: { pageId: p.id },
            update: {
              name: p.name,
              accessToken: pageToken || p.access_token || undefined,
              category: p.category,
              pictureUrl: p.picture?.data?.url,
              businessId: savedBusiness.id
            },
            create: {
              pageId: p.id,
              name: p.name,
              accessToken: pageToken || p.access_token || "",
              category: p.category,
              pictureUrl: p.picture?.data?.url,
              metaConnectionId: connection.id,
              businessId: savedBusiness.id
            },
          });
        }
      }
    } catch (e) {
      console.warn("Could not sync businesses/pages after OAuth:", e.message);
    }

    // 6. Redirect back to frontend with success
    res.redirect(`${frontendUrl}/conexoes/meta?success=1&pages=${encodeURIComponent(fbName)}`);
  } catch (error) {
    console.error("oauthCallback error:", error);
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    res.redirect(`${frontendUrl}/conexoes/meta?error=server_error`);
  }
};

/**
 * Disconnects the Meta account from the workspace.
 */
export const disconnectMeta = async (req, res) => {
  try {
    const { workspaceId } = req;
    await prisma.metaConnection.updateMany({
      where: { workspaceId },
      data: { status: "inactive" },
    });
    res.json({ message: "Conta Meta desconectada com sucesso" });
  } catch (error) {
    console.error("disconnectMeta error:", error);
    res.status(500).json({ error: "Erro ao desconectar conta Meta" });
  }
};

/**
 * Connects or refreshes a Meta account (legacy / manual token flow — kept as fallback).
 * Expected body: { accessToken, fbUserId, name }
 */
export const connectMeta = async (req, res) => {
  try {
    const { workspaceId } = req;
    const { accessToken, fbUserId, name } = req.body;

    if (!accessToken || !fbUserId) {
      return res.status(400).json({ error: "Token e ID do usuário são obrigatórios" });
    }

    // Try to exchange for Long-lived token (may fail if already long-lived)
    let longLivedToken = accessToken;
    let expiresAt = null;
    try {
      const longLivedData = await metaService.exchangeUserToken(accessToken);
      longLivedToken = longLivedData.access_token;
      expiresAt = longLivedData.expires_in
        ? new Date(Date.now() + longLivedData.expires_in * 1000)
        : null;
    } catch (e) {
      console.warn("Token exchange failed, using token as-is:", e.message);
    }

    const connection = await prisma.metaConnection.upsert({
      where: { fbUserId },
      update: { accessToken: longLivedToken, name: name || "Conta Meta", expiresAt, status: "active", workspaceId },
      create: { fbUserId, accessToken: longLivedToken, name: name || "Conta Meta", expiresAt, workspaceId },
    });

    const pagesData = await metaService.getUserPages(longLivedToken);
    for (const p of pagesData) {
      await prisma.metaPage.upsert({
        where: { pageId: p.id },
        update: { name: p.name, accessToken: p.access_token, category: p.category, pictureUrl: p.picture?.data?.url },
        create: {
          pageId: p.id, name: p.name, accessToken: p.access_token,
          category: p.category, pictureUrl: p.picture?.data?.url,
          metaConnectionId: connection.id,
        },
      });
    }

    res.json({ message: "Conta conectada com sucesso", connectionId: connection.id });
  } catch (error) {
    if (error instanceof ExternalApiError) {
      return res.status(error.status).json({ error: error.message, details: error.details });
    }
    console.error("connectMeta Error:", error);
    res.status(500).json({ error: error.message || "Erro interno ao conectar Meta" });
  }
};


/**
 * Lists all pages connected to the workspace.
 */
export const listPages = async (req, res) => {
  try {
    const { workspaceId } = req;
    const pages = await prisma.metaPage.findMany({
      where: { metaConnection: { workspaceId } },
      include: { metaConnection: { select: { name: true } } },
    });
    res.json(pages);
  } catch (error) {
    res.status(500).json({ error: "Erro ao listar páginas" });
  }
};

/**
 * Toggles lead synchronization for a page.
 */
export const togglePageSync = async (req, res) => {
  try {
    const { id } = req.params;
    const { isConnected } = req.body;
    const { workspaceId } = req;

    const page = await prisma.metaPage.findUnique({
      where: { id: Number(id) },
      include: { metaConnection: true },
    });

    if (!page || page.metaConnection.workspaceId !== workspaceId) {
      return res.status(404).json({ error: "Página não encontrada" });
    }

    if (isConnected) {
      // Subscribe to webhooks on Meta's side
      await metaService.subscribePageToWebhooks(page.pageId, page.accessToken);

      // Sync forms for this page
      const forms = await metaService.getPageForms(
        page.pageId,
        page.accessToken,
      );
      for (const f of forms) {
        await prisma.metaLeadForm.upsert({
          where: { formId: f.id },
          update: { name: f.name, status: f.status },
          create: {
            formId: f.id,
            name: f.name,
            status: f.status,
            pageId: page.id,
          },
        });
      }
    }

    const updated = await prisma.metaPage.update({
      where: { id: page.id },
      data: { isConnected },
    });

    res.json(updated);
  } catch (error) {
    if (error instanceof ExternalApiError) {
      return res
        .status(error.status)
        .json({ error: error.message, details: error.details });
    }
    console.error("togglePageSync error:", error);
    res
      .status(500)
      .json({ error: error.message || "Erro interno ao sincronizar página" });
  }
};

/**
 * Lists forms for a connected page.
 */
export const listPageForms = async (req, res) => {
  try {
    const { pageId } = req.params;
    const forms = await prisma.metaLeadForm.findMany({
      where: { pageId: Number(pageId) },
      include: { funnel: true, stage: true },
    });
    res.json(forms);
  } catch (error) {
    res.status(500).json({ error: "Erro ao listar formulários" });
  }
};

/**
 * Maps a form to a CRM funnel and stage.
 */
export const mapForm = async (req, res) => {
  try {
    const { id } = req.params;
    const { funnelId, stageId, autoCreateFields } = req.body;

    const updated = await prisma.metaLeadForm.update({
      where: { id: Number(id) },
      data: { 
        funnelId: funnelId ? Number(funnelId) : null, 
        stageId: stageId ? Number(stageId) : null,
        autoCreateFields: autoCreateFields !== undefined ? autoCreateFields : undefined
      },
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: "Erro ao mapear formulário" });
  }
};

/**
 * Lists Ad Accounts for the connected Meta account.
 */
export const listAdAccounts = async (req, res) => {
  try {
    const { workspaceId } = req;
    const connection = await prisma.metaConnection.findFirst({
      where: { workspaceId },
    });

    if (!connection) {
      return res.status(404).json({ error: "Nenhuma conta Meta conectada" });
    }

    const adAccounts = await metaService.getAdAccounts(connection.accessToken);
    res.json(adAccounts);
  } catch (error) {
    console.error("listAdAccounts error:", error);
    res.status(500).json({ error: "Erro ao listar contas de anúncios" });
  }
};

/**
 * Lists Business Accounts (Portfolios) for the connected Meta account.
 */
export const listBusinesses = async (req, res) => {
  try {
    const { workspaceId } = req;
    const { refresh } = req.query;

    if (refresh === "true") {
      const connection = await prisma.metaConnection.findFirst({ where: { workspaceId } });
      if (connection) {
        const businesses = await metaService.getBusinesses(connection.accessToken);
        for (const b of businesses) {
          await prisma.metaBusiness.upsert({
            where: { businessId: b.id },
            update: { name: b.name, vertical: b.vertical, verificationStatus: b.verification_status },
            create: { 
              businessId: b.id, name: b.name, vertical: b.vertical, 
              verificationStatus: b.verification_status, workspaceId,
              metaConnectionId: connection.id 
            }
          });
        }
      }
    }

    const businesses = await prisma.metaBusiness.findMany({
      where: { workspaceId },
      include: { _count: { select: { pages: true } } }
    });
    
    res.json(businesses);
  } catch (error) {
    console.error("listBusinesses error:", error);
    res.status(500).json({ error: "Erro ao listar portfólios (Business Accounts)" });
  }
};

/**
 * Gets detailed assets for a specific business.
 */
export const getBusinessAssets = async (req, res) => {
  try {
    const { workspaceId } = req;
    const { businessId } = req.params;
    const connection = await prisma.metaConnection.findFirst({
      where: { workspaceId },
    });

    if (!connection) {
      return res.status(404).json({ error: "Nenhuma conta Meta conectada" });
    }

    const assets = await metaService.getBusinessAssets(businessId, connection.accessToken);
    
    // Find the internal business ID
    const business = await prisma.metaBusiness.findUnique({
      where: { businessId }
    });

    if (business && assets.pages) {
      for (const p of assets.pages) {
        let pageToken = null;
        try {
          pageToken = await metaService.getPageAccessToken(p.id, connection.accessToken);
        } catch (e) {
          console.warn(`Could not get token for page ${p.id} during asset sync:`, e.message);
        }

        await prisma.metaPage.upsert({
          where: { pageId: p.id },
          update: { 
            name: p.name, 
            category: p.category, 
            pictureUrl: p.picture?.data?.url,
            accessToken: pageToken || p.access_token || undefined,
            businessId: business.id
          },
          create: {
            pageId: p.id,
            name: p.name,
            category: p.category,
            pictureUrl: p.picture?.data?.url,
            accessToken: pageToken || p.access_token || "",
            metaConnectionId: connection.id,
            businessId: business.id
          }
        });
      }
    }

    res.json(assets);
  } catch (error) {
    console.error("getBusinessAssets error:", error);
    res.status(500).json({ error: "Erro ao buscar ativos do portfólio" });
  }
};

/**
 * Lists campaigns for a specific Ad Account.
 */
export const listCampaigns = async (req, res) => {
  try {
    const { adAccountId } = req.params;
    const { workspaceId } = req;
    const connection = await prisma.metaConnection.findFirst({
      where: { workspaceId },
    });

    if (!connection) {
      return res.status(404).json({ error: "Nenhuma conta Meta conectada" });
    }

    const campaigns = await metaService.getCampaigns(
      adAccountId,
      connection.accessToken,
    );
    res.json(campaigns);
  } catch (error) {
    console.error("listCampaigns error:", error);
    res.status(500).json({ error: "Erro ao listar campanhas" });
  }
};

/**
 * Gets insights for a specific object (Campaign, AdSet, Ad, or Account).
 */
export const getInsights = async (req, res) => {
  try {
    const { objectId } = req.params;
    const { range } = req.query;
    const { workspaceId } = req;
    const connection = await prisma.metaConnection.findFirst({ where: { workspaceId } });

    if (!connection) return res.status(404).json({ error: "Nenhuma conta Meta conectada" });

    const insights = await metaService.getInsights(objectId, connection.accessToken, range);
    res.json(insights);
  } catch (error) {
    console.error("getInsights error:", error);
    res.status(500).json({ error: "Erro ao buscar insights da Meta" });
  }
};

/**
 * Returns a comprehensive Meta report for the workspace:
 * accounts, campaigns with insights, pages, and DB form/lead counts.
 */
export const getMetaReport = async (req, res) => {
  try {
    const { workspaceId } = req;
    const { range = "last_30d", businessId } = req.query;

    const connection = await prisma.metaConnection.findFirst({ where: { workspaceId } });
    if (!connection) return res.status(404).json({ error: "Nenhuma conta Meta conectada" });

    // Fetch live data from Meta API + DB data in parallel
    const [liveReport, dbPages, unifiedCounts] = await Promise.allSettled([
      metaService.getMetaReport(connection.accessToken, range, businessId),
      prisma.metaPage.findMany({
        where: { 
          metaConnection: { workspaceId },
          business: businessId ? { businessId } : undefined
        },
        include: {
          forms: true
        }
      }),
      prisma.metaUnifiedLead.groupBy({
        by: ['formId'],
        where: { workspaceId },
        _count: { formId: true }
      })
    ]);

    const report = liveReport.status === "fulfilled" ? liveReport.value : {};
    const pages = dbPages.status === "fulfilled" ? dbPages.value : [];
    const countsMap = unifiedCounts.status === "fulfilled" 
      ? Object.fromEntries(unifiedCounts.value.map(c => [c.formId, c._count.formId]))
      : {};

    // Enrich pages with lead counts from the Unified Center
    const enrichedPages = pages.map(page => ({
      id: page.id,
      name: page.name,
      pageId: page.pageId,
      category: page.category,
      pictureUrl: page.pictureUrl,
      isConnected: page.isConnected,
      forms: page.forms.map(f => ({
        id: f.id,
        name: f.name,
        formId: f.formId,
        status: f.status,
        leadCount: countsMap[f.formId] || 0,
      })),
      totalLeads: page.forms.reduce((sum, f) => sum + (countsMap[f.formId] || 0), 0),
    }));

    res.json({ ...report, pages: enrichedPages, connectionName: connection.name });
  } catch (error) {
    console.error("getMetaReport error:", error);
    res.status(500).json({ error: "Erro ao gerar relatório Meta" });
  }
};

/**
 * Forces re-sync of all pages and their forms from Meta API.
 */
export const syncMeta = async (req, res) => {
  try {
    const { workspaceId } = req;
    const connection = await prisma.metaConnection.findFirst({ where: { workspaceId } });
    if (!connection) return res.status(404).json({ error: "Nenhuma conta Meta conectada" });

    // 1. Sync Businesses
    const businessesData = await metaService.getBusinesses(connection.accessToken);
    let syncedBusinesses = 0;
    let syncedPages = 0;
    let syncedForms = 0;

    for (const b of businessesData) {
      const savedBusiness = await prisma.metaBusiness.upsert({
        where: { businessId: b.id },
        update: {
          name: b.name,
          verificationStatus: b.verification_status,
          vertical: b.vertical
        },
        create: {
          businessId: b.id,
          name: b.name,
          verificationStatus: b.verification_status,
          vertical: b.vertical,
          workspaceId,
          metaConnectionId: connection.id
        }
      });
      syncedBusinesses++;

      // 2. Sync Pages for each Business
      const pagesData = await metaService.getBusinessPages(b.id, connection.accessToken);
      
      for (const p of pagesData) {
        let pageToken = null;
        try {
          pageToken = await metaService.getPageAccessToken(p.id, connection.accessToken);
        } catch (e) {
          console.warn(`Could not get token for page ${p.id}:`, e.message);
        }

        const page = await prisma.metaPage.upsert({
          where: { pageId: p.id },
          update: {
            name: p.name,
            accessToken: pageToken || p.access_token || undefined,
            category: p.category,
            pictureUrl: p.picture?.data?.url,
            businessId: savedBusiness.id
          },
          create: {
            pageId: p.id,
            name: p.name,
            accessToken: pageToken || p.access_token || "",
            category: p.category,
            pictureUrl: p.picture?.data?.url,
            metaConnectionId: connection.id,
            businessId: savedBusiness.id
          },
        });
        syncedPages++;

        // 3. Sync forms for connected pages
        if (page.isConnected) {
          try {
            const forms = await metaService.getPageForms(page.pageId, page.accessToken);
            for (const f of forms) {
              await prisma.metaLeadForm.upsert({
                where: { formId: f.id },
                update: { name: f.name, status: f.status },
                create: { formId: f.id, name: f.name, status: f.status, pageId: page.id },
              });
              syncedForms++;
            }
          } catch (e) {
            console.warn(`Could not sync forms for page ${p.id}:`, e.message);
          }
        }
      }
    }

    res.json({ message: "Sincronização concluída", syncedBusinesses, syncedPages, syncedForms });
  } catch (error) {
    console.error("syncMeta error:", error);
    res.status(500).json({ error: "Erro ao sincronizar dados da Meta" });
  }
};

/**
 * Pulls leads from a specific form and saves them to the database.
 */
export const syncFormLeads = async (req, res) => {
  try {
    const { workspaceId } = req;
    const { formId } = req.params;
    
    const connection = await prisma.metaConnection.findFirst({ where: { workspaceId } });
    if (!connection) return res.status(404).json({ error: "Nenhuma conta Meta conectada" });

    const form = await prisma.metaLeadForm.findUnique({
      where: { formId },
      include: { page: true }
    });

    if (!form) return res.status(404).json({ error: "Formulário não encontrado no banco de dados" });

    const leads = await metaService.getFormLeads(formId, form.page.accessToken);
    let createdCount = 0;

    for (const metaLead of leads) {
      const existing = await prisma.lead.findFirst({
        where: { metadata: { path: ["id"], equals: metaLead.id } }
      });

      if (!existing) {
        // Simple mapping from Meta fields to Lead model
        const nameField = metaLead.field_data.find(f => f.name === "full_name")?.values[0];
        const emailField = metaLead.field_data.find(f => f.name === "email")?.values[0];
        const phoneField = metaLead.field_data.find(f => f.name === "phone_number")?.values[0];

        await prisma.lead.create({
          data: {
            name: nameField || "Lead Meta",
            email: emailField,
            phone: phoneField,
            source: "meta_manual_sync",
            workspaceId,
            funnelId: form.funnelId,
            stageId: form.stageId,
            metaLeadFormId: form.id,
            metadata: metaLead
          }
        });
        createdCount++;
      }
    }

    res.json({ message: `Sincronização de leads concluída`, createdCount, totalFound: leads.length });
  } catch (error) {
    console.error("syncFormLeads error:", error);
    res.status(500).json({ error: "Erro ao sincronizar leads do formulário" });
  }
};

/**
 * Returns all unified leads for the workspace.
 */
export const getLeadsCenter = async (req, res) => {
  try {
    const { workspaceId } = req;
    const leads = await prisma.metaUnifiedLead.findMany({
      where: { workspaceId },
      orderBy: { createdTime: "desc" }
    });
    res.json(leads);
  } catch (error) {
    console.error("getLeadsCenter error:", error);
    res.status(500).json({ error: "Erro ao buscar Central de Leads" });
  }
};

/**
 * Triggers a full manual sync of all Meta leads from all forms.
 */
export const syncLeadsCenter = async (req, res) => {
  try {
    const { workspaceId } = req;
    const connection = await prisma.metaConnection.findFirst({
      where: { workspaceId, status: "active" }
    });

    if (!connection) {
      return res.status(404).json({ error: "Nenhuma conta Meta ativa conectada" });
    }

    await metaService.syncLeadsCenter(workspaceId, connection.accessToken);

    res.json({ success: true, message: "Sincronização da Central de Leads concluída" });
  } catch (error) {
    console.error("syncLeadsCenter error:", error);
    res.status(500).json({ error: error.message || "Erro ao sincronizar Central de Leads" });
  }
};
