import { Router } from "express";
import authMiddleware from "../middlewares/auth.middleware.js";
import { 
    listUsers, 
    createUser, 
    updateUser, 
    deleteUser 
} from "../controllers/users.controller.js";
import { 
    createInstance, 
    connectInstance, 
    deleteInstance,
    listInstances 
} from "../controllers/evolution.controller.js";
import { listAdAccounts } from "../controllers/meta.controller.js";
import { getPaymentConfig, savePaymentConfig, testPaymentConfig } from "../controllers/payment.controller.js";
import {
  getConfig,
  updateConfig,
  broadcastNotice,
  getBackupsList,
  createBackup,
  deleteBackup,
  downloadBackup,
} from "../controllers/adminConfig.controller.js";
import logsRoutes from "./logs.routes.js";

const router = Router();

router.use(authMiddleware);

// Users Management
router.get("/users", listUsers);
router.post("/users", createUser);
router.put("/users/:id", updateUser);
router.delete("/users/:id", deleteUser);

// Evolution API Manager (Admin Only routes)
router.post("/evolution/instance", async (req, res, next) => {
    if (req.user.role !== "ADMIN") return res.status(403).json({ error: "Acesso negado" });
    next();
}, createInstance);

router.get("/evolution/connect/:instanceName", async (req, res, next) => {
    if (req.user.role !== "ADMIN") return res.status(403).json({ error: "Acesso negado" });
    next();
}, connectInstance);

router.delete("/evolution/instance/:instanceName", async (req, res, next) => {
    if (req.user.role !== "ADMIN") return res.status(403).json({ error: "Acesso negado" });
    next();
}, deleteInstance);

// Meta API Manager
router.post("/meta/accounts", async (req, res, next) => {
    if (req.user.role !== "ADMIN") return res.status(403).json({ error: "Acesso negado" });
    next();
}, listAdAccounts);

import { listApiKeys, createApiKey, revokeApiKey } from "../controllers/apikey.controller.js";

// API Key Management (Within Workspace)
router.get("/apikeys", listApiKeys);
router.post("/apikeys", createApiKey);
router.delete("/apikeys/:id", revokeApiKey);

// Payment Gateway Config
router.get("/payment/config", getPaymentConfig);
router.post("/payment/config", savePaymentConfig);
router.post("/payment/test", testPaymentConfig);

// System Configurations & Broadcast
router.get("/system-config", getConfig);
router.put("/system-config", updateConfig);
router.post("/broadcast", broadcastNotice);

// Backups Management
router.get("/backups", getBackupsList);
router.post("/backups", createBackup);
router.delete("/backups/:filename", deleteBackup);
router.get("/backups/download/:filename", downloadBackup);

// Logs Management
router.use("/logs", logsRoutes);

export default router;
