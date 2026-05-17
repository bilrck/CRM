import express from "express";
import * as tasksController from "../controllers/tasks.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/", tasksController.listTasks);
router.post("/", tasksController.createTask);
router.put("/:id", tasksController.updateTask);
router.delete("/:id", tasksController.deleteTask);

export default router;
