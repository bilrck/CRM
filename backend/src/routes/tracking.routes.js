import { Router } from "express";
import authMiddleware from "../middlewares/auth.middleware.js";
import { checkModuleActive } from "../middlewares/moduleCheck.middleware.js";
import { getRules, createRule, deleteRule } from "../controllers/tracking.controller.js";

const router = Router();

// Secure routes by ensuring the whatsapp module is active (since tracking relies on WhatsApp webhook routing)
router.use(checkModuleActive("whatsapp"));

router.get("/rules", authMiddleware, getRules);
router.post("/rules", authMiddleware, createRule);
router.delete("/rules/:id", authMiddleware, deleteRule);

export default router;
