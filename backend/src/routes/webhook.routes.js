import { Router } from "express";
import { receiveWebhook } from "../controllers/webhook.controller.js";
import {
  verifyMetaWebhook,
  receiveMetaWebhook,
} from "../controllers/webhook-meta.controller.js";

const router = Router();

// Rota para Meta (Facebook/Instagram)
router.get("/meta", verifyMetaWebhook);
router.post("/meta", receiveMetaWebhook);

// Rota pública para receber webhooks externos
router.post("/:uniqueId", receiveWebhook);

export default router;
