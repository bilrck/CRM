import prisma from "../config/prisma.js";

// GET /roles
export const listRoles = async (req, res) => {
  try {
    const workspaceId = req.workspaceId;

    const roles = await prisma.role.findMany({
      where: { workspaceId },
      include: {
        _count: { select: { members: true } },
      },
    });

    res.json(roles);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao listar cargos" });
  }
};

// POST /roles
export const createRole = async (req, res) => {
  try {
    const workspaceId = req.workspaceId;
    const { name, permissions, description } = req.body;

    if (!name) return res.status(400).json({ error: "Nome é obrigatório" });

    // Check duplication
    const existing = await prisma.role.findFirst({
      where: { workspaceId, name: { equals: name, mode: "insensitive" } },
    });

    if (existing) return res.status(400).json({ error: "Cargo já existe" });

    const role = await prisma.role.create({
      data: {
        name,
        permissions: permissions || [],
        description,
        workspaceId,
      },
    });

    res.json(role);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao criar cargo" });
  }
};

// PUT /roles/:id
export const updateRole = async (req, res) => {
  try {
    const workspaceId = req.workspaceId;
    const { id } = req.params;
    const { name, permissions, description } = req.body;

    const role = await prisma.role.findUnique({
      where: { id: Number(id) },
    });

    if (!role || role.workspaceId !== workspaceId) {
      return res.status(404).json({ error: "Cargo não encontrado" });
    }

    if (role.isSystem) {
      return res
        .status(403)
        .json({ error: "Não é possível editar cargos de sistema" });
    }

    const updated = await prisma.role.update({
      where: { id: Number(id) },
      data: { name, permissions, description },
    });

    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao atualizar cargo" });
  }
};

// DELETE /roles/:id
export const deleteRole = async (req, res) => {
  try {
    const workspaceId = req.workspaceId;
    const { id } = req.params;

    const role = await prisma.role.findUnique({
      where: { id: Number(id) },
      include: { _count: { select: { members: true } } },
    });

    if (!role || role.workspaceId !== workspaceId) {
      return res.status(404).json({ error: "Cargo não encontrado" });
    }

    if (role._count.members > 0) {
      return res
        .status(400)
        .json({ error: "Não é possível excluir cargo em uso" });
    }

    await prisma.role.delete({ where: { id: Number(id) } });

    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao excluir cargo" });
  }
};
