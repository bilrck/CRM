import { Router } from "express";
import authMiddleware from "../middlewares/auth.middleware.js";
import {
  me,
  listUsers,
  updateProfile,
  updateNotifications,
  updatePreferences,
  changePassword,
  exportData,
  requestDeletion
} from "../controllers/users.controller.js";

const router = Router();

router.get("/me", authMiddleware, me);
router.put("/me", authMiddleware, updateProfile);
router.put("/me/notifications", authMiddleware, updateNotifications);
router.put("/me/preferences", authMiddleware, updatePreferences);
router.put("/me/password", authMiddleware, changePassword);
router.get("/me/export", authMiddleware, exportData);
router.post("/me/delete", authMiddleware, requestDeletion);
router.get("/", authMiddleware, listUsers);

export default router;
