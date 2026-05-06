import { Router } from "express";
import authMiddleware from "../middlewares/auth.middleware.js";
import {
  listNotifications,
  markAsRead,
  markAllAsRead,
} from "../controllers/notifications.controller.js";

const router = Router();

router.use(authMiddleware);

router.get("/", listNotifications);
router.put("/mark-all-read", markAllAsRead);
router.put("/:id/read", markAsRead);

export default router;
