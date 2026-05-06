import { Router } from "express";
import {
  getMyTeam,
  inviteUser,
  removeMember,
  updateMemberRole,
} from "../controllers/team.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";

const router = Router();

router.use(authMiddleware);

router.get("/", getMyTeam);
router.post("/invite", inviteUser);
router.put("/role/:id", updateMemberRole);
router.delete("/member/:id", removeMember);

export default router;
