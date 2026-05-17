import { Router } from "express";
import { receiveWebhook } from "../controllers/webhook.controller.js";
import {
  verifyMetaWebhook,
  receiveMetaWebhook,
} from "../controllers/webhook-meta.controller.js";
import { receivePaymentWebhook } from "../controllers/payment.controller.js";

const router = Router();

// Rota para Meta (Facebook/Instagram)
router.get("/meta", verifyMetaWebhook);
router.post("/meta", receiveMetaWebhook);

// Rota pública para receber webhooks de pagamento (Stripe / Mercado Pago)
router.post("/payments", receivePaymentWebhook);

// Rota pública para receber webhooks externos
router.post("/:uniqueId", receiveWebhook);

export default router;
