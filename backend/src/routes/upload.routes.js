import { Router } from "express";
import { upload } from "../config/upload.js";
import { logger } from "../utils/logger.js";
import authMiddleware from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/", authMiddleware, upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Nenhum arquivo enviado" });
    }

    const baseUrl =
      process.env.API_URL || `${req.protocol}://${req.get("host")}`;
    const fileUrl = `${baseUrl}/uploads/${req.file.filename}`;

    await logger.info(
      "UPLOAD",
      `Novo arquivo carregado: ${req.file.filename}`,
      {
        userId: req.user.id,
        workspaceId: req.workspaceId,
      },
    );

    res.json({
      url: fileUrl,
      filename: req.file.filename,
      mimetype: req.file.mimetype,
      size: req.file.size,
    });
  } catch (error) {
    console.error("Erro no upload:", error);
    res.status(500).json({ error: "Erro ao processar upload" });
  }
});

export default router;
