import { Router } from "express";
import {
  register,
  login,
  logout,
  changePassword,
  forgotPassword,
  resetPassword,
} from "../controllers/auth.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
router.post("/change-password", authMiddleware, changePassword);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

export default router;
