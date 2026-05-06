import prisma from "../config/prisma.js";
import * as metaService from "../services/meta.service.js";
import { ExternalApiError } from "../utils/api-client.js";

/**
 * Connects or refreshes a Meta account.
 * Expected body: { accessToken, fbUserId, name }
 */
export const connectMeta = async (req, res) => {
  try {
    const { workspaceId } = req;
    const { accessToken, fbUserId, name } = req.body;

    if (!accessToken || !fbUserId) {
      return res
        .status(400)
        .json({ error: "Token e ID do usuário são obrigatórios" });
    }

    // 1. Exchange for Long-lived token
    const longLivedData = await metaService.exchangeUserToken(accessToken);
    const longLivedToken = longLivedData.access_token;
    const expiresAt = longLivedData.expires_in
      ? new Date(Date.now() + longLivedData.expires_in * 1000)
      : null;

    // 2. Upsert MetaConnection
    const connection = await prisma.metaConnection.upsert({
      where: { fbUserId },
      update: {
        accessToken: longLivedToken,
        name: name || "Conta Meta",
        expiresAt,
        status: "active",
        workspaceId,
      },
      create: {
        fbUserId,
        accessToken: longLivedToken,
        name: name || "Conta Meta",
        expiresAt,
        workspaceId,
      },
    });

    // 3. Sync initial pages (but keep isConnected=false)
    const pagesData = await metaService.getUserPages(longLivedToken);
    for (const p of pagesData) {
      await prisma.metaPage.upsert({
        where: { pageId: p.id },
        update: {
          name: p.name,
          accessToken: p.access_token,
          category: p.category,
          pictureUrl: p.picture?.data?.url,
        },
        create: {
          pageId: p.id,
          name: p.name,
          accessToken: p.access_token,
          category: p.category,
          pictureUrl: p.picture?.data?.url,
          metaConnectionId: connection.id,
        },
      });
    }

    res.json({
      message: "Conta conectada com sucesso",
      connectionId: connection.id,
    });
  } catch (error) {
    if (error instanceof ExternalApiError) {
      return res
        .status(error.status)
        .json({ error: error.message, details: error.details });
    }
    console.error("connectMeta Error:", error);
    res
      .status(500)
      .json({ error: error.message || "Erro interno ao conectar Meta" });
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
    const { funnelId, stageId } = req.body;

    const updated = await prisma.metaLeadForm.update({
      where: { id: Number(id) },
      data: { funnelId, stageId },
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: "Erro ao mapear formulário" });
  }
};

/**
 * Admin: List Ad Accounts (Placeholder for legacy compatibility)
 */
export const listAdAccounts = async (req, res) => {
  try {
    // This was likely part of a legacy flow.
    // We'll return an empty list or implement basic fetch if needed later.
    res.json([]);
  } catch (error) {
    res.status(500).json({ error: "Erro ao listar contas de anúncios" });
  }
};
