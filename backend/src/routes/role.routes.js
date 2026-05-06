import { Router } from "express";
import {
  listRoles,
  createRole,
  updateRole,
  deleteRole,
} from "../controllers/role.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";

const router = Router();

router.use(authMiddleware);

router.get("/", listRoles);
router.post("/", createRole);
router.put("/:id", updateRole);
router.delete("/:id", deleteRole);

export default router;
