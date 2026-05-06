import express from "express";
import apiAuthMiddleware from "../middlewares/api.middleware.js";
import {
  apiListLeads,
  apiCreateLead,
  apiUpdateLead,
  apiDeleteLead,
  apiGetWorkspace,
  apiListConversations,
  apiListMessages,
  apiListConnections,
  apiSendMessage,
  apiListFunnels,
  apiCreateFunnel,
  apiUpdateFunnel,
  apiDeleteFunnel,
  apiListUsers,
  apiInviteUser,
  apiUpdateUserRole,
  apiRemoveUser,
  apiGetReports,
} from "../controllers/api.controller.js";

const router = express.Router();

// Middleware Global para /api/v1
router.use(apiAuthMiddleware);

// Workspace
router.get("/workspaces/me", apiGetWorkspace);

// Leads
router.get("/leads", apiListLeads);
router.post("/leads", apiCreateLead);
router.put("/leads/:id", apiUpdateLead);
router.delete("/leads/:id", apiDeleteLead);

// Messaging
router.get("/conversations", apiListConversations);
router.get("/messages/:conversationId", apiListMessages);
router.post("/messages/send", apiSendMessage);
router.get("/connections", apiListConnections);

// Funnels
router.get("/funnels", apiListFunnels);
router.post("/funnels", apiCreateFunnel);
router.put("/funnels/:id", apiUpdateFunnel);
router.delete("/funnels/:id", apiDeleteFunnel);

// Users (Team)
router.get("/users", apiListUsers);
router.post("/users", apiInviteUser);
router.put("/users/:id", apiUpdateUserRole);
router.delete("/users/:id", apiRemoveUser);

// Reports
router.get("/reports/dashboard", apiGetReports);

export default router;
