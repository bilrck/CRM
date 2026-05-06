import express from "express";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();
import morgan from "morgan";
import cookieParser from "cookie-parser";
import http from "http";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import authMiddleware from "./middlewares/auth.middleware.js";
import subscriptionMiddleware from "./middlewares/subscription.middleware.js";

import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import leadsRoutes from "./routes/leads.routes.js";
import marketingRoutes from "./routes/marketing.routes.js";
import teamRoutes from "./routes/team.routes.js";
import connectionRoutes from "./routes/connection.routes.js";
import webhookRoutes from "./routes/webhook.routes.js";
import whatsappRoutes from "./routes/whatsapp.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import trackingRoutes from "./routes/tracking.routes.js";
import apiRoutes from "./routes/api.routes.js";
import funnelRoutes from "./routes/funnel.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import reportsRoutes from "./routes/reports.routes.js";
import workspaceRoutes from "./routes/workspace.routes.js";
import roleRoutes from "./routes/role.routes.js";
import metaRoutes from "./routes/meta.routes.js";
import uploadRoutes from "./routes/upload.routes.js";
import clientsRoutes from "./routes/clients.routes.js";
import notificationsRoutes from "./routes/notifications.routes.js";
import automationsRoutes from "./routes/automations.routes.js";
import licenseRoutes from "./routes/license.routes.js";
import planRoutes from "./routes/plan.routes.js";
import aiRoutes from "./routes/ai.routes.js";
import helmet from "helmet";

const app = express();
app.use(helmet());
const PORT = process.env.PORT || 4000;

// Configuração do CORS
app.enable("trust proxy");
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:3001",
      "http://127.0.0.1:3000",
      "http://127.0.0.1:3001",
      "http://192.168.0.23:3000",
      "http://192.168.0.23:3001",
      process.env.FRONTEND_URL,
    ].filter(Boolean),
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "apikey",
      "x-api-key",
      "x-workspace-id",
    ],
    exposedHeaders: ["set-cookie"],
  }),
);

app.use(
  express.json({
    verify: (req, res, buf) => {
      req.rawBody = buf;
    },
  })
);
app.use(cookieParser());
app.use(morgan(":method :url :status :response-time ms"));

// Adicione esta rota antes das outras rotas protegidas
app.get("/auth/check", authMiddleware, (req, res) => {
  res.json({ isAuthenticated: true, user: req.user });
});

// public routes
app.get("/health", (req, res) => res.json({ ok: true }));
app.use("/uploads", express.static(path.resolve(__dirname, "../uploads")));
app.use("/auth", authRoutes);
app.use("/webhooks", webhookRoutes);
app.use("/api/v1", apiRoutes); // 🔥 Public API Endpoints
// app.use("/automations", automationsRoutes); 

// Protected routes
app.use("/users", authMiddleware, userRoutes);
app.use("/leads", authMiddleware, subscriptionMiddleware, leadsRoutes);
app.use("/marketing", authMiddleware, subscriptionMiddleware, marketingRoutes);
app.use("/team", authMiddleware, subscriptionMiddleware, teamRoutes);
app.use("/what", authMiddleware, subscriptionMiddleware, whatsappRoutes);
app.use("/tracking", authMiddleware, subscriptionMiddleware, trackingRoutes);
app.use("/admin", authMiddleware, adminRoutes); 
app.use("/funnel", authMiddleware, subscriptionMiddleware, funnelRoutes);
app.use("/dashboard", authMiddleware, subscriptionMiddleware, dashboardRoutes);
app.use("/reports", authMiddleware, subscriptionMiddleware, reportsRoutes);
app.use("/workspace", authMiddleware, workspaceRoutes);
app.use("/roles", authMiddleware, roleRoutes);
app.use("/meta", authMiddleware, subscriptionMiddleware, metaRoutes);
app.use("/upload", authMiddleware, subscriptionMiddleware, uploadRoutes);
app.use("/clients", authMiddleware, subscriptionMiddleware, clientsRoutes); 
app.use("/notifications", authMiddleware, subscriptionMiddleware, notificationsRoutes);
app.use("/license", licenseRoutes);
app.use("/plans", planRoutes);
app.use("/ai", authMiddleware, aiRoutes);

// Connection routes (using "/" as base but protected)
app.use("/", authMiddleware, subscriptionMiddleware, connectionRoutes);

const server = http.createServer(app);

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

import { initSocket } from "./services/socket.service.js";
import { startFollowUpWorker } from "./services/followUp.service.js";
import { startBillingWorker } from "./services/billing.service.js";

initSocket(server);
startFollowUpWorker();
startBillingWorker();
 
