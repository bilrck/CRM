import express from "express";
import * as customFieldsController from "../controllers/custom-fields.controller.js";

const router = express.Router();

router.get("/", customFieldsController.listCustomFields);
router.post("/", customFieldsController.createCustomField);
router.put("/:id", customFieldsController.updateCustomField);
router.delete("/:id", customFieldsController.deleteCustomField);

export default router;
