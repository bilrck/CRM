import { Router } from "express";
import authMiddleware from "../middlewares/auth.middleware.js";
import {
  getConversations,
  getMessages,
  sendWhatsappMessage,
  updateConversationStatus,
  importChats,
  createLeadFromConversation,
  getMessageMedia,
} from "../controllers/whatsapp.controller.js";

const router = Router();

router.use(authMiddleware);

router.get("/conversations", getConversations);
router.get("/conversations/:id/messages", getMessages);
router.get("/messages/:id/media", getMessageMedia);
router.post("/messages/send", sendWhatsappMessage);
router.put("/conversations/:id", updateConversationStatus);
router.post("/import", importChats);
router.post("/conversations/:id/create-lead", createLeadFromConversation);

export default router;
