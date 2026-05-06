import { Router } from "express";
import authMiddleware from "../middlewares/auth.middleware.js";
import { getConnections, createConnection, updateConnection, deleteConnection, syncConnection, getQrCode, refreshStatus } from "../controllers/connections.controller.js";

const router = Router();

router.get("/connections", authMiddleware, getConnections);
router.post("/connections/create", authMiddleware, createConnection);
router.put("/connections/:id", authMiddleware, updateConnection);
router.delete("/connections/:id", authMiddleware, deleteConnection);

// 🔥 Rota de Sincronização
router.post("/connections/:id/sync", authMiddleware, syncConnection);

// Routes for Evolution API
router.get("/connections/:id/qrcode", authMiddleware, getQrCode); 
router.post("/connections/:id/refresh", authMiddleware, refreshStatus);


export default router;
