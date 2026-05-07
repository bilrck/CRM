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
router.get("/ad-accounts/:adAccountId/campaigns", metaController.listCampaigns);
router.get("/insights/:objectId", metaController.getInsights);

export default router;
