import nodeCron from "node-cron";
import prisma from "../config/prisma.js";
import * as metaService from "./meta.service.js";

/**
 * Starts a background worker that synchronizes Meta leads for all active connections.
 * Runs every 15 minutes.
 */
export const startMetaSyncWorker = () => {
  console.log("🕒 [MetaSyncWorker] Iniciando worker de sincronização Meta...");

  // Runs every 15 minutes: */15 * * * *
  nodeCron.schedule("*/15 * * * *", async () => {
    console.log("🔄 [MetaSyncWorker] Executando sincronização periódica...");
    try {
      const activeConnections = await prisma.metaConnection.findMany({
        where: { status: "active" }
      });

      console.log(`[MetaSyncWorker] Sincronizando ${activeConnections.length} conexões ativas.`);

      for (const conn of activeConnections) {
        try {
          await metaService.syncLeadsCenter(conn.workspaceId, conn.accessToken);
          console.log(`[MetaSyncWorker] Sucesso para Workspace ${conn.workspaceId}`);
        } catch (err) {
          console.error(`[MetaSyncWorker] Erro ao sincronizar Workspace ${conn.workspaceId}:`, err.message);
        }
      }
    } catch (error) {
      console.error("[MetaSyncWorker] Erro crítico no worker:", error);
    }
  });
};
