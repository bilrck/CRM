import express from "express";
import { getDashboardStats } from "../controllers/reports.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/dashboard", authMiddleware, getDashboardStats);

export default router;
