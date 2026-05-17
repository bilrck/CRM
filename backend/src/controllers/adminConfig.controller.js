import prisma from "../config/prisma.js";
import { getSystemConfig, saveSystemConfig } from "../services/systemConfig.service.js";
import { getIO } from "../services/socket.service.js";
import { logger } from "../utils/logger.js";
import {
  listBackups,
  generateBackup,
  deleteBackupFile,
  getBackupFilePath,
} from "../services/backup.service.js";

// GET system configuration
export const getConfig = async (req, res) => {
  try {
    const config = getSystemConfig();
    res.json(config);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// UPDATE system configuration (Admin only)
export const updateConfig = async (req, res) => {
  try {
    if (req.user.role !== "ADMIN") {
      return res.status(403).json({ error: "Acesso negado: Somente administradores" });
    }

    const { systemName, modules, backup } = req.body;
    const updated = saveSystemConfig({ systemName, modules, backup });

    await logger.info("SYSTEM", `Configurações do sistema atualizadas por ${req.user.name}`, {
      userId: req.user.id,
      data: updated
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// BROADCAST notice to all users (Admin only)
export const broadcastNotice = async (req, res) => {
  try {
    if (req.user.role !== "ADMIN") {
      return res.status(403).json({ error: "Acesso negado: Somente administradores" });
    }

    const { title, message, type } = req.body;
    if (!title || !message) {
      return res.status(400).json({ error: "Título e mensagem são obrigatórios" });
    }

    // 1. Get all active users
    const users = await prisma.user.findMany({
      select: { id: true }
    });

    if (users.length === 0) {
      return res.json({ success: true, count: 0 });
    }

    // 2. Create notifications in bulk
    const notificationType = type || "INFO"; // INFO, WARNING, ERROR
    const data = users.map(u => ({
      userId: u.id,
      title,
      message,
      type: notificationType
    }));

    await prisma.notification.createMany({
      data
    });

    // 3. Emit real-time Socket event to everyone
    try {
      const io = getIO();
      io.emit("notification:new", {
        title,
        message,
        type: notificationType,
        createdAt: new Date()
      });
    } catch (err) {
      console.warn("Socket broadcast failed:", err.message);
    }

    await logger.warn("SYSTEM", `Aviso global enviado por ${req.user.name}: "${title}"`, {
      userId: req.user.id,
      data: { title, message, type: notificationType }
    });

    res.json({ success: true, count: users.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ========================================
// DATA BACKUPS MANAGEMENT (Admin only)
// ========================================

// GET List of all backup files
export const getBackupsList = async (req, res) => {
  try {
    if (req.user.role !== "ADMIN") {
      return res.status(403).json({ error: "Acesso negado" });
    }
    const backups = listBackups();
    res.json(backups);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// POST trigger a manual backup
export const createBackup = async (req, res) => {
  try {
    if (req.user.role !== "ADMIN") {
      return res.status(403).json({ error: "Acesso negado" });
    }
    const backup = await generateBackup();

    await logger.info("SYSTEM", `Backup manual do sistema gerado com sucesso por ${req.user.name}`, {
      userId: req.user.id,
      data: { filename: backup.filename, size: backup.size }
    });

    res.json(backup);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// DELETE a backup file
export const deleteBackup = async (req, res) => {
  try {
    if (req.user.role !== "ADMIN") {
      return res.status(403).json({ error: "Acesso negado" });
    }
    const { filename } = req.params;
    deleteBackupFile(filename);

    await logger.warn("SYSTEM", `Arquivo de backup ${filename} excluído por ${req.user.name}`, {
      userId: req.user.id
    });

    res.json({ success: true, message: "Backup excluído com sucesso." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET download backup file
export const downloadBackup = async (req, res) => {
  try {
    if (req.user.role !== "ADMIN") {
      return res.status(403).json({ error: "Acesso negado" });
    }
    const { filename } = req.params;
    const filePath = getBackupFilePath(filename);

    res.download(filePath, filename);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

