import prisma from "../config/prisma.js";
import bcrypt from "bcrypt";
import crypto from "crypto";

// GET /team
export const getMyTeam = async (req, res) => {
  try {
    const workspaceId = req.workspaceId;
    if (!workspaceId)
      return res.status(404).json({ error: "No workspace context" });

    // List all members of the current workspace
    const members = await prisma.workspaceMember.findMany({
      where: { workspaceId },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
        customRole: true, // Include custom role info
      },
      orderBy: { createdAt: "asc" },
    });

    const formatted = members.map((m) => ({
      id: m.id,
      userId: m.userId,
      name: m.user.name,
      email: m.user.email,
      role: m.role, // System role
      roleName: m.customRole ? m.customRole.name : m.role, // Display Name
      permissions: m.customRole ? m.customRole.permissions : [],
      joinedAt: m.createdAt,
    }));

    res.json(formatted);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao buscar membros" });
  }
};

// POST /team/invite
// Validate Invite and Create Workspace OR Add Member
export const inviteUser = async (req, res) => {
  try {
    const workspaceId = req.workspaceId;
    const { email, role, roleId } = req.body; // role: ADMIN, MEMBER, GESTOR, CLIENTE

    // Check permissions
    const currentUserMember = await prisma.workspaceMember.findFirst({
      where: { workspaceId, userId: req.user.id },
    });

    if (currentUserMember?.role !== "ADMIN" && req.user.role !== "ADMIN") {
      return res
        .status(403)
        .json({ error: "Apenas admins podem adicionar membros" });
    }

    // Find user by email
    let userToAdd = await prisma.user.findUnique({
      where: { email },
    });

    let tempPassword = null;

    if (!userToAdd) {
      // If it's a hierarchical role, we allow auto-registration
      if (role === "GESTOR" || role === "CLIENTE") {
        tempPassword = crypto.randomBytes(4).toString("hex"); // 8 chars
        const hash = await bcrypt.hash(tempPassword, 10);

        userToAdd = await prisma.user.create({
          data: {
            email,
            name: email.split("@")[0], // Fallback name
            password: hash,
            role: "USER", // System basic role
            forcePasswordChange: true,
          },
        });
      } else {
        return res.status(404).json({
          error:
            "Usuário não encontrado no sistema. Peça para ele criar uma conta primeiro ou use um cargo de Gestor/Cliente.",
        });
      }
    }

    // Determine Logic based on Role
    // 1. Hierarchical Roles (GESTOR, CLIENTE) -> Create new Workspace (Sub-workspace)
    if (role === "GESTOR" || role === "CLIENTE") {
      const newWorkspaceName =
        role === "GESTOR"
          ? `Gestão: ${userToAdd.name}`
          : `Cliente: ${userToAdd.name}`;

      // Create Workspace Linked to Parent
      const newWorkspace = await prisma.workspace.create({
        data: {
          name: newWorkspaceName,
          ownerId: userToAdd.id,
          parentWorkspaceId: workspaceId,
          members: {
            create: {
              userId: userToAdd.id,
              role: "ADMIN", // They are admin of their own sub-workspace
            },
          },
        },
      });

      return res.json({
        message: tempPassword
          ? "Usuário registrado e sub-workspace criado com sucesso"
          : "Sub-workspace criado com sucesso",
        workspace: newWorkspace,
        tempPassword, // Return to the admin so they can share it
      });
    }

    // 2. Regular Invite to Current Workspace

    // Check if already member
    const existing = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId: userToAdd.id,
        },
      },
    });

    if (existing) {
      return res
        .status(400)
        .json({ error: "Usuário já é membro deste workspace" });
    }

    // Add member
    const newMember = await prisma.workspaceMember.create({
      data: {
        workspaceId,
        userId: userToAdd.id,
        role: role === "ADMIN" || role === "MEMBER" ? role : "MEMBER", // Fallback to MEMBER if unknown
        roleId: roleId ? Number(roleId) : null,
      },
      include: {
        user: { select: { name: true, email: true } },
        customRole: true,
      },
    });

    res.json(newMember);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao adicionar membro" });
  }
};

// PUT /team/role/:id
export const updateMemberRole = async (req, res) => {
  try {
    const workspaceId = req.workspaceId;
    const { id } = req.params; // Member ID
    const { role, roleId } = req.body;

    // Permissions check
    const currentMember = await prisma.workspaceMember.findFirst({
      where: { workspaceId, userId: req.user.id },
    });

    if (currentMember?.role !== "ADMIN" && req.user.role !== "ADMIN") {
      return res
        .status(403)
        .json({
          error: "Apenas administradores do workspace podem alterar cargos.",
        });
    }

    // Target member check
    const targetMember = await prisma.workspaceMember.findFirst({
      where: { id: Number(id), workspaceId },
    });

    if (!targetMember) {
      return res
        .status(404)
        .json({ error: "Membro não encontrado neste workspace." });
    }

    const updated = await prisma.workspaceMember.update({
      where: { id: Number(id) },
      data: {
        role,
        roleId: roleId ? Number(roleId) : null,
      },
    });

    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao atualizar role" });
  }
};

// DELETE /team/member/:id
export const removeMember = async (req, res) => {
  try {
    const workspaceId = req.workspaceId;
    const { id } = req.params; // Member ID

    // Permissions check
    const currentMember = await prisma.workspaceMember.findFirst({
      where: { workspaceId, userId: req.user.id },
    });

    if (currentMember?.role !== "ADMIN" && req.user.role !== "ADMIN") {
      return res
        .status(403)
        .json({
          error: "Apenas administradores do workspace podem remover membros.",
        });
    }

    // Target member check
    const targetMember = await prisma.workspaceMember.findFirst({
      where: { id: Number(id), workspaceId },
    });

    if (!targetMember) {
      return res
        .status(404)
        .json({ error: "Membro não encontrado neste workspace." });
    }

    // Prevent removing the owner
    const workspaceInfo = await prisma.workspace.findUnique({
      where: { id: workspaceId },
    });

    if (workspaceInfo && workspaceInfo.ownerId === targetMember.userId) {
      return res
        .status(400)
        .json({ error: "Não é possível remover o proprietário do workspace." });
    }

    await prisma.workspaceMember.delete({
      where: { id: Number(id) },
    });

    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao remover membro" });
  }
};
