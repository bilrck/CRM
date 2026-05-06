import { Router } from "express";
import authMiddleware from "../middlewares/auth.middleware.js";
import {
  createCampaign,
  listCampaigns,
} from "../controllers/marketing.controller.js";

const router = Router();
router.use(authMiddleware);

router.post("/campaigns", createCampaign);
router.get("/campaigns", listCampaigns);

export default router;
