import { Router } from "express";
import {
  getMyWorkspace,
  updateWorkspace,
  listMemberships,
  createWorkspace,
} from "../controllers/workspace.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";

const router = Router();

router.use(authMiddleware);

// Global Workspace Actions
router.get("/list", listMemberships); // List all my workspaces
router.post("/", createWorkspace); // Create new workspace

// Current Workspace Context Actions
router.get("/current", getMyWorkspace); // Get details of *current* workspace
router.put("/current", updateWorkspace);

// Legacy/Compatibility (Redirecting / to current)
router.put("/", updateWorkspace);

// 🔥 Management (Admin/Gestor Only)
import {
  listWorkspacesForManagement,
  updateWorkspaceLimits,
} from "../controllers/workspace.controller.js";
router.get("/management/list", listWorkspacesForManagement);
router.put("/management/:id", updateWorkspaceLimits);

export default router;
