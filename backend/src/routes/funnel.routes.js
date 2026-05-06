import { Router } from "express";
import {
  getFunnels,
  createFunnel,
  updateFunnel,
  deleteFunnel,
  createStage,
  updateStage,
  deleteStage,
  reorderStages,
  updateLeadStage,
} from "../controllers/funnel.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";

const router = Router();

router.use(authMiddleware);

// Funnels
router.get("/", getFunnels);
router.post("/", createFunnel);
router.put("/:id", updateFunnel);
router.delete("/:id", deleteFunnel);

// Stages
router.post("/:funnelId/stages", createStage);
router.put("/stages/reorder/:funnelId", reorderStages);
router.put("/stages/:id", updateStage);
router.delete("/stages/:id", deleteStage);

// Lead Movement
router.put("/leads/:leadId/move", updateLeadStage);

export default router;
