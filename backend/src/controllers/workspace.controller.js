import prisma from "../config/prisma.js";

// GET /workspace/list
// Lista todos os workspaces que o usuário faz parte + workspaces filhos (hierarquia)
export const listMemberships = async (req, res) => {
  try {
    const userId = req.user.id;

    // 1. Peer-to-Peer Memberships (Direct)
    const directMemberships = await prisma.workspaceMember.findMany({
      where: { userId },
      include: {
        workspace: {
          select: { id: true, name: true, parentWorkspaceId: true },
        },
      },
    });

    const workspacesMap = new Map();

    // Add direct memberships to map
    directMemberships.forEach((m) => {
      workspacesMap.set(m.workspace.id, {
        id: m.workspace.id,
        name: m.workspace.name,
        role: m.role,
        isDirect: true,
      });
    });

    // 2. Hierarchical visibility: If user is ADMIN of a parent, they see the children
    // Find IDs of workspaces where user is ADMIN/OWNER
    const parentIds = directMemberships
      .filter((m) => m.role === "ADMIN" || req.user.role === "ADMIN")
      .map((m) => m.workspace.id);

    if (parentIds.length > 0) {
      const children = await prisma.workspace.findMany({
        where: { parentWorkspaceId: { in: parentIds } },
        select: { id: true, name: true },
      });

      children.forEach((c) => {
        if (!workspacesMap.has(c.id)) {
          workspacesMap.set(c.id, {
            id: c.id,
            name: `📁 ${c.name}`, // Visual indicator for child
            role: "PARENT_VIEWER",
            isDirect: false,
          });
        }
      });
    }

    res.json(Array.from(workspacesMap.values()));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao listar workspaces" });
  }
};

// POST /workspace
// Cria um novo workspace
export const createWorkspace = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: "Nome obrigatório" });

    // Transaction: Create Workspace -> Add User as Admin (Owner)
    const result = await prisma.$transaction(async (prisma) => {
      const workspace = await prisma.workspace.create({
        data: {
          name,
          ownerId: req.user.id,
        },
      });

      await prisma.workspaceMember.create({
        data: {
          workspaceId: workspace.id,
          userId: req.user.id,
          role: "ADMIN",
        },
      });

      return workspace;
    });

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao criar workspace" });
  }
};

// GET /workspace/current
export const getMyWorkspace = async (req, res) => {
  try {
    const workspaceId = req.workspaceId;
    if (!workspaceId)
      return res.status(404).json({ error: "No workspace context" });

    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: {
        members: {
          include: {
            user: { select: { id: true, name: true, email: true, role: true } },
          },
        },
        _count: {
          select: { leads: true },
        },
      },
    });

    return res.json(workspace);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal Error" });
  }
};

// PUT /workspace/current
export const updateWorkspace = async (req, res) => {
  try {
    const workspaceId = req.workspaceId;
    const { name } = req.body;

    // Check if user is admin of workspace (or global admin)
    const member = await prisma.workspaceMember.findFirst({
      where: { workspaceId, userId: req.user.id },
    });

    if (member?.role !== "ADMIN" && req.user.role !== "ADMIN") {
      return res.status(403).json({ error: "Access denied" });
    }

    const updated = await prisma.workspace.update({
      where: { id: workspaceId },
      data: { name },
    });

    return res.json(updated);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal Error" });
  }
};

// GET /workspace/management
export const listWorkspacesForManagement = async (req, res) => {
  try {
    const userRole = req.user.role;
    const workspaceId = req.workspaceId;

    let where = {};
    if (userRole === "GESTOR") {
      where = { parentWorkspaceId: workspaceId };
    } else if (userRole !== "ADMIN") {
      return res.status(403).json({ error: "Acesso negado" });
    }

    const workspaces = await prisma.workspace.findMany({
      where,
      include: {
        owner: { select: { id: true, name: true, email: true } },
        _count: { select: { leads: true, connections: true } },
      },
    });

    res.json(workspaces);
  } catch (err) {
    res.status(500).json({ error: "Erro ao listar workspaces para gestão" });
  }
};

// PUT /workspace/management/:id
export const updateWorkspaceLimits = async (req, res) => {
  try {
    const { id } = req.params;
    const { maxInstances, status } = req.body;
    const userRole = req.user.role;
    const currentWorkspaceId = req.workspaceId;

    const targetWorkspace = await prisma.workspace.findUnique({
      where: { id: parseInt(id) },
    });

    if (!targetWorkspace)
      return res.status(404).json({ error: "Workspace não encontrado" });

    // Gestor check: must be parent
    if (
      userRole === "GESTOR" &&
      targetWorkspace.parentWorkspaceId !== currentWorkspaceId
    ) {
      return res
        .status(403)
        .json({ error: "Sem permissão para este workspace" });
    } else if (userRole !== "ADMIN" && userRole !== "GESTOR") {
      return res.status(403).json({ error: "Acesso negado" });
    }

    // Check if Gestor has enough capacity
    if (userRole === "GESTOR" && maxInstances !== undefined) {
      const user = await prisma.user.findUnique({ where: { id: req.user.id } });
      const currentAllocated = await prisma.workspace.aggregate({
        where: {
          parentWorkspaceId: currentWorkspaceId,
          NOT: { id: parseInt(id) },
        },
        _sum: { maxInstances: true },
      });

      const totalRequested =
        (currentAllocated._sum.maxInstances || 0) + parseInt(maxInstances);

      if (totalRequested > (user.maxTotalInstances || 1)) {
        return res
          .status(400)
          .json({
            error: `Capacidade excedida. Você possui ${user.maxTotalInstances} instâncias e tentou alocar ${totalRequested} no total.`,
          });
      }
    }

    const updated = await prisma.workspace.update({
      where: { id: parseInt(id) },
      data: {
        maxInstances:
          maxInstances !== undefined ? parseInt(maxInstances) : undefined,
        status: status || undefined,
      },
    });

    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao atualizar limites do workspace" });
  }
};
