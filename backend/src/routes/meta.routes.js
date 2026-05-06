import express from "express";
import authMiddleware from "../middlewares/auth.middleware.js";
import * as metaController from "../controllers/meta.controller.js";

const router = express.Router();

// All meta routes require CRM authentication
router.use(authMiddleware);

router.post("/connect", metaController.connectMeta);
router.get("/pages", metaController.listPages);
router.put("/pages/:id/sync", metaController.togglePageSync);
router.get("/pages/:pageId/forms", metaController.listPageForms);
router.put("/forms/:id/map", metaController.mapForm);

export default router;
