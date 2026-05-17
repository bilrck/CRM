import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import prisma from "../config/prisma.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CONFIG_PATH = path.join(__dirname, "../data/system_config.json");

const DEFAULT_CONFIG = {
  systemName: "Rastreia.ai",
  modules: {
    whatsapp: true,
    meta: true,
    googleAds: true
  },
  backup: {
    enabled: false,
    frequency: "WEEKLY",
    time: "02:00",
    retentionDays: 30
  }
};

export const getSystemConfig = () => {
  try {
    if (!fs.existsSync(CONFIG_PATH)) {
      // Ensure directory exists
      const dir = path.dirname(CONFIG_PATH);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(CONFIG_PATH, JSON.stringify(DEFAULT_CONFIG, null, 2));
      return DEFAULT_CONFIG;
    }
    const data = fs.readFileSync(CONFIG_PATH, "utf-8");
    const parsed = JSON.parse(data);
    // Ensure backup is present in read config
    return {
      ...DEFAULT_CONFIG,
      ...parsed,
      modules: { ...DEFAULT_CONFIG.modules, ...parsed.modules },
      backup: { ...DEFAULT_CONFIG.backup, ...parsed.backup }
    };
  } catch (error) {
    console.error("Error reading system config, returning default:", error);
    return DEFAULT_CONFIG;
  }
};

export const saveSystemConfig = (newConfig) => {
  try {
    const current = getSystemConfig();
    const updated = {
      systemName: newConfig.systemName || current.systemName,
      modules: {
        ...current.modules,
        ...(newConfig.modules || {})
      },
      backup: {
        ...current.backup,
        ...(newConfig.backup || {})
      }
    };
    
    // Side effects of module deactivation: stop/disconnect all integrations dynamically
    if (newConfig.modules) {
      if (newConfig.modules.meta === false) {
        prisma.metaConnection.updateMany({
          data: { status: "expired" }
        }).catch(err => console.error("Error auto-disconnecting Meta Connections:", err));
      }
      if (newConfig.modules.whatsapp === false) {
        prisma.connection.updateMany({
          where: { provider: { in: ["evolution", "whatsapp"] } },
          data: { status: "disconnected" }
        }).catch(err => console.error("Error auto-disconnecting WhatsApp Connections:", err));
      }
    }

    const dir = path.dirname(CONFIG_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(updated, null, 2), "utf-8");
    return updated;
  } catch (error) {
    console.error("Error saving system config:", error);
    throw new Error("Failed to save system configuration");
  }
};
