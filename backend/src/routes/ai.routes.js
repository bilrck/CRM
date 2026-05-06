import express from "express";
import authMiddleware from "../middlewares/auth.middleware.js";
import { 
  getAiSettings, 
  updateAiSettings, 
  getChatHistory, 
  chat 
} from "../controllers/ai.controller.js";

const router = express.Router();

router.get("/settings", authMiddleware, getAiSettings);
router.put("/settings", authMiddleware, updateAiSettings);
router.get("/history", authMiddleware, getChatHistory);
router.post("/chat", authMiddleware, chat);

export default router;
