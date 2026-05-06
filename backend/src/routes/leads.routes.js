import { Router } from "express";
import authMiddleware from "../middlewares/auth.middleware.js";
import {
  createLead,
  listLeads,
  updateLead,
  getLead,
  deleteLead,
} from "../controllers/leads.controller.js";

const router = Router();

router.use(authMiddleware);

router.post("/", createLead);
router.get("/", listLeads);
router.get("/:id", getLead);
router.put("/:id", updateLead);
router.delete("/:id", deleteLead);

export default router;
