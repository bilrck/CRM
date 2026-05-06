import { Router } from "express";
import { 
    listPlans, 
    createPlan, 
    updatePlan, 
    deletePlan 
} from "../controllers/plan.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";

const router = Router();

// Public/Auth list
router.get("/", authMiddleware, listPlans);

// Admin only
router.post("/", authMiddleware, createPlan);
router.put("/:id", authMiddleware, updatePlan);
router.delete("/:id", authMiddleware, deletePlan);

export default router;
