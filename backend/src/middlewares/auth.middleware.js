import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();
import prisma from "../config/prisma.js";

export default async function authMiddleware(req, res, next) {
  try {
    let token = null;

    // 1️⃣ Prioridade para cookie
    if (req.cookies?.token) token = req.cookies.token;

    // 2️⃣ Se não veio no cookie, tenta Authorization: Bearer
    if (!token && req.headers.authorization) {
      const [scheme, value] = req.headers.authorization.split(" ");
      if (/^Bearer$/i.test(scheme)) token = value;
    }

    if (!token) {
      return res.status(401).json({ error: "Token não fornecido" });
    }

    // 3️⃣ Verificar token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 4️⃣ Buscar usuário real
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        forcePasswordChange: true,
      },
    });

    if (!user) {
      res.clearCookie("token", { path: "/" });
      return res.status(401).json({ error: "Usuário não encontrado" });
    }

    // 🔥 Gerenciamento de Workspace
    const headerWorkspaceId = req.headers["x-workspace-id"];
    const cookieWorkspaceId = req.cookies?.workspaceId;
    const requestedWorkspaceId = headerWorkspaceId || cookieWorkspaceId;
    let membership = null;

    if (requestedWorkspaceId && !isNaN(Number(requestedWorkspaceId))) {
      const targetWsid = Number(requestedWorkspaceId);
      // Validate if user belongs to requested workspace
      membership = await prisma.workspaceMember.findUnique({
        where: {
          workspaceId_userId: {
            workspaceId: targetWsid,
            userId: user.id,
          },
        },
      });

      // 🔥 Hierarchy bypass: Allow parent admins to view child workspaces
      if (!membership) {
        const targetWorkspace = await prisma.workspace.findUnique({
          where: { id: targetWsid },
          select: { parentWorkspaceId: true },
        });

        if (targetWorkspace?.parentWorkspaceId) {
          const parentMember = await prisma.workspaceMember.findUnique({
            where: {
              workspaceId_userId: {
                workspaceId: targetWorkspace.parentWorkspaceId,
                userId: user.id,
              },
            },
          });

          if (
            parentMember &&
            (parentMember.role === "ADMIN" || user.role === "ADMIN")
          ) {
            membership = { workspaceId: targetWsid, role: "PARENT_VIEWER" };
          }
        }
      }
    }

    // Fallback: Default to first workspace found
    if (!membership) {
      membership = await prisma.workspaceMember.findFirst({
        where: { userId: user.id },
        orderBy: { createdAt: "asc" },
      });
    }

    req.workspaceId = membership ? membership.workspaceId : null;
    req.user = user;
    req.tokenPayload = decoded;

    // 🔥 Force Password Change Enforcement
    // Ignore enforcement for the change-password route itself
    if (
      user.forcePasswordChange &&
      req.path !== "/change-password" &&
      !req.path.includes("/auth")
    ) {
      return res.status(403).json({
        error: "Troca de senha obrigatória",
        code: "FORCE_PASSWORD_CHANGE",
      });
    }

    return next();
  } catch (err) {
    console.error("Erro na autenticação:", {
      name: err.name,
      message: err.message,
      expiredAt: err.expiredAt,
    });

    res.clearCookie("token", { path: "/" });
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Token expirado" });
    }

    return res.status(401).json({ error: "Token inválido" });
  }
}
