import { Router } from "express";
import authMiddleware from "../middlewares/auth.middleware.js";
import { getRules, createRule, deleteRule } from "../controllers/tracking.controller.js";

const router = Router();

router.get("/rules", authMiddleware, getRules);
router.post("/rules", authMiddleware, createRule);
router.delete("/rules/:id", authMiddleware, deleteRule);

export default router;
