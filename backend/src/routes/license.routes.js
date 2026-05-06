import { Router } from "express";
import { 
    listKeys, 
    createKey, 
    updateKey, 
    deleteKey, 
    activateKey,
    generateExternal
} from "../controllers/license.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";

const router = Router();

// External API (Authenticated via x-api-key header)
router.post("/generate-external", generateExternal);

router.use(authMiddleware);

// Admin routes
router.get("/", listKeys);
router.post("/", createKey);
router.put("/:id", updateKey);
router.delete("/:id", deleteKey);

// User routes
router.post("/activate", activateKey);

export default router;
