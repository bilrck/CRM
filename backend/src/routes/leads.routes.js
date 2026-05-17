import { Router } from "express";
import authMiddleware from "../middlewares/auth.middleware.js";
import {
  createLead,
  listLeads,
  updateLead,
  getLead,
  deleteLead,
  addLeadDocument,
  deleteLeadDocument,
  bulkCreateLeads,
} from "../controllers/leads.controller.js";

const router = Router();

router.use(authMiddleware);

router.post("/", createLead);
router.post("/bulk", bulkCreateLeads);
router.get("/", listLeads);
router.get("/:id", getLead);
router.put("/:id", updateLead);
router.delete("/:id", deleteLead);

router.post("/:id/documents", addLeadDocument);
router.delete("/documents/:docId", deleteLeadDocument);

export default router;
