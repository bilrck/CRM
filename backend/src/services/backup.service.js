import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import prisma from "../config/prisma.js";
import { getSystemConfig, saveSystemConfig } from "./systemConfig.service.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BACKUPS_DIR = path.join(__dirname, "../../../backups");

// Ensure backups folder exists
if (!fs.existsSync(BACKUPS_DIR)) {
  fs.mkdirSync(BACKUPS_DIR, { recursive: true });
}

/**
 * Lists all generated backup files inside the backups/ folder
 */
export const listBackups = () => {
  try {
    if (!fs.existsSync(BACKUPS_DIR)) {
      return [];
    }

    const files = fs.readdirSync(BACKUPS_DIR);
    return files
      .filter((file) => file.endsWith(".json"))
      .map((file) => {
        const filePath = path.join(BACKUPS_DIR, file);
        const stats = fs.statSync(filePath);
        return {
          filename: file,
          size: stats.size,
          createdAt: stats.birthtime,
        };
      })
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  } catch (error) {
    console.error("Erro ao listar backups:", error);
    return [];
  }
};

/**
 * Generates a complete JSON backup containing all critical database tables
 */
export const generateBackup = async () => {
  try {
    const timestamp = new Date()
      .toISOString()
      .replace(/[:T]/g, "-")
      .split(".")[0];
    const filename = `backup_${timestamp}.json`;
    const filePath = path.join(BACKUPS_DIR, filename);

    // Fetch all system tables in parallel
    const [users, workspaces, leads, tasks, connections, notifications] = await Promise.all([
      prisma.user.findMany(),
      prisma.workspace.findMany(),
      prisma.lead.findMany(),
      prisma.task.findMany(),
      prisma.connection.findMany(),
      prisma.notification.findMany(),
    ]);

    const backupData = {
      version: "1.0.0",
      generatedAt: new Date().toISOString(),
      summary: {
        users: users.length,
        workspaces: workspaces.length,
        leads: leads.length,
        tasks: tasks.length,
        connections: connections.length,
        notifications: notifications.length,
      },
      data: {
        users,
        workspaces,
        leads,
        tasks,
        connections,
        notifications,
      },
    };

    fs.writeFileSync(filePath, JSON.stringify(backupData, null, 2), "utf-8");

    return {
      filename,
      size: fs.statSync(filePath).size,
      summary: backupData.summary,
      createdAt: new Date(),
    };
  } catch (error) {
    console.error("Erro ao gerar backup de dados:", error);
    throw new Error(`Erro ao gerar backup: ${error.message}`);
  }
};

/**
 * Deletes a backup file by name
 */
export const deleteBackupFile = (filename) => {
  const safeFilename = path.basename(filename);
  const filePath = path.join(BACKUPS_DIR, safeFilename);

  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    return true;
  }
  throw new Error("Arquivo de backup não encontrado.");
};

/**
 * Gets a read stream for a backup file
 */
export const getBackupFilePath = (filename) => {
  const safeFilename = path.basename(filename);
  const filePath = path.join(BACKUPS_DIR, safeFilename);

  if (fs.existsSync(filePath)) {
    return filePath;
  }
  throw new Error("Arquivo de backup não encontrado.");
};
