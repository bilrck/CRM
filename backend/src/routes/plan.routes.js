import { Router } from "express";
import { 
    listPlans, 
    createPlan, 
    updatePlan, 
    deletePlan,
    checkoutPlan,
    activateMockPlan,
    cancelSubscription
} from "../controllers/plan.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";

const router = Router();

// Public/Auth list
router.get("/", authMiddleware, listPlans);

// Checkout & Purchase
router.post("/cancel-subscription", authMiddleware, cancelSubscription);
router.post("/:id/checkout", authMiddleware, checkoutPlan);
router.post("/:id/activate-mock", authMiddleware, activateMockPlan);

// Admin only
router.post("/", authMiddleware, createPlan);
router.put("/:id", authMiddleware, updatePlan);
router.delete("/:id", authMiddleware, deletePlan);

export default router;
