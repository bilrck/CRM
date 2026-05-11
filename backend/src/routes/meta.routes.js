import express from "express";
import authMiddleware from "../middlewares/auth.middleware.js";
import * as metaController from "../controllers/meta.controller.js";

const router = express.Router();

// OAuth routes: callback is PUBLIC (called by Facebook redirect)
router.get("/oauth/callback", metaController.oauthCallback);

// All other meta routes require CRM authentication
router.use(authMiddleware);

router.get("/oauth/url", metaController.getOAuthUrl);
router.post("/connect", metaController.connectMeta);
router.delete("/disconnect", metaController.disconnectMeta);
router.get("/pages", metaController.listPages);
router.put("/pages/:id/sync", metaController.togglePageSync);
router.get("/pages/:pageId/forms", metaController.listPageForms);
router.put("/forms/:id/map", metaController.mapForm);

// Ad Accounts & Campaigns
router.get("/ad-accounts", metaController.listAdAccounts);
router.get("/businesses", metaController.listBusinesses);
router.get("/businesses/:businessId/assets", metaController.getBusinessAssets);
router.get("/ad-accounts/:adAccountId/campaigns", metaController.listCampaigns);
router.get("/insights/:objectId", metaController.getInsights);

// Reports & Sync
router.get("/report", metaController.getMetaReport);
router.post("/sync", metaController.syncMeta);
router.post("/forms/:formId/sync-leads", metaController.syncFormLeads);

// Leads Center
router.get("/leads-center", metaController.getLeadsCenter);
router.post("/sync-leads-center", metaController.syncLeadsCenter);

// Advanced Settings
router.get("/settings", metaController.getSettings);
router.put("/settings", metaController.updateSettings);

export default router;
