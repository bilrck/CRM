import express from "express";
import authMiddleware from "../middlewares/auth.middleware.js";
import { 
    listAutomations, 
    createAutomation, 
    updateAutomation, 
    deleteAutomation,
    toggleAutomation
} from "../controllers/automations.controller.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/", listAutomations);
router.post("/", createAutomation);
router.put("/:id", updateAutomation);
router.delete("/:id", deleteAutomation);
router.patch("/:id/toggle", toggleAutomation);

export default router;
