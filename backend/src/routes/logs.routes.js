import { Router } from "express";
import { listLogs } from "../controllers/logs.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/", authMiddleware, listLogs);

export default router;
