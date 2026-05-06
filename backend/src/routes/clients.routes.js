import { Router } from "express";
import authMiddleware from "../middlewares/auth.middleware.js";
import {
  listClients,
  createClient,
  getClient,
  updateClient,
  deleteClient,
  exportClients,
} from "../controllers/clients.controller.js";

const router = Router();

// 🔥 Role-based middleware (Manager+ only)
const requireManagerRole = (req, res, next) => {
  const userRole = req.user?.role;
  const allowedRoles = ["MANAGER", "ADMIN"];

  if (!allowedRoles.includes(userRole)) {
    return res.status(403).json({
      error:
        "Acesso negado. Apenas Gestores e Administradores podem acessar clientes.",
    });
  }

  next();
};

// All routes require authentication and Manager+ role
router.use(authMiddleware);
router.use(requireManagerRole);

// 🔥 Client Routes
router.get("/", listClients);
router.post("/", createClient);
router.get("/export", exportClients);
router.get("/:id", getClient);
router.put("/:id", updateClient);
router.delete("/:id", deleteClient);

export default router;
