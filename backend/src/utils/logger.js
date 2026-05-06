import prisma from "../config/prisma.js";

class Logger {
    async log({ level = "INFO", category = "SYSTEM", message, data = null, userId = null, workspaceId = null }) {
        try {
            await prisma.systemLog.create({
                data: {
                    level,
                    category,
                    message,
                    data,
                    userId,
                    workspaceId
                }
            });
            console.log(`[${category}] ${level}: ${message}`);
        } catch (error) {
            console.error("Failed to write system log:", error);
        }
    }

    async info(category, message, extra = {}) {
        return this.log({ level: "INFO", category, message, ...extra });
    }

    async warn(category, message, extra = {}) {
        return this.log({ level: "WARN", category, message, ...extra });
    }

    async error(category, message, extra = {}) {
        return this.log({ level: "ERROR", category, message, ...extra });
    }
}

export const logger = new Logger();
