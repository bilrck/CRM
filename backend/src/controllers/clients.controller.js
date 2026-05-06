import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// 🔥 List Clients with pagination, filters, and search
export const listClients = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      status,
      segment,
      assignedToId,
    } = req.query;
    const workspaceId = req.workspaceId;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Build where clause
    const where = {
      workspaceId,
      ...(status && { status }),
      ...(segment && { segment }),
      ...(assignedToId && { assignedToId: parseInt(assignedToId) }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
          { company: { contains: search, mode: "insensitive" } },
          { document: { contains: search, mode: "insensitive" } },
        ],
      }),
    };

    const [clients, total] = await Promise.all([
      prisma.client.findMany({
        where,
        skip,
        take,
        include: {
          assignedTo: {
            select: { id: true, name: true, email: true },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.client.count({ where }),
    ]);

    res.json({
      clients,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Error listing clients:", error);
    res.status(500).json({ error: "Erro ao listar clientes" });
  }
};

// 🔥 Create Client
export const createClient = async (req, res) => {
  try {
    const workspaceId = req.workspaceId;
    const userId = req.user.id;

    const {
      name,
      email,
      phone,
      company,
      document,
      street,
      number,
      complement,
      neighborhood,
      city,
      state,
      zipCode,
      country,
      instagram,
      facebook,
      linkedin,
      website,
      segment,
      totalRevenue,
      lifetimeValue,
      status,
      observations,
      assignedToId,
    } = req.body;

    // Validation
    if (!name) {
      return res.status(400).json({ error: "Nome é obrigatório" });
    }

    const client = await prisma.client.create({
      data: {
        name,
        email,
        phone,
        company,
        document,
        street,
        number,
        complement,
        neighborhood,
        city,
        state,
        zipCode,
        country,
        instagram,
        facebook,
        linkedin,
        website,
        segment,
        totalRevenue: totalRevenue ? parseFloat(totalRevenue) : null,
        lifetimeValue: lifetimeValue ? parseFloat(lifetimeValue) : null,
        status: status || "ACTIVE",
        observations,
        workspaceId,
        assignedToId: assignedToId || userId,
      },
      include: {
        assignedTo: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    res.status(201).json(client);
  } catch (error) {
    console.error("Error creating client:", error);
    res.status(500).json({ error: "Erro ao criar cliente" });
  }
};

// 🔥 Get Client by ID
export const getClient = async (req, res) => {
  try {
    const { id } = req.params;
    const workspaceId = req.workspaceId;

    const client = await prisma.client.findFirst({
      where: {
        id: parseInt(id),
        workspaceId,
      },
      include: {
        assignedTo: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!client) {
      return res.status(404).json({ error: "Cliente não encontrado" });
    }

    res.json(client);
  } catch (error) {
    console.error("Error getting client:", error);
    res.status(500).json({ error: "Erro ao buscar cliente" });
  }
};

// 🔥 Update Client
export const updateClient = async (req, res) => {
  try {
    const { id } = req.params;
    const workspaceId = req.workspaceId;

    const {
      name,
      email,
      phone,
      company,
      document,
      street,
      number,
      complement,
      neighborhood,
      city,
      state,
      zipCode,
      country,
      instagram,
      facebook,
      linkedin,
      website,
      segment,
      totalRevenue,
      lifetimeValue,
      status,
      observations,
      assignedToId,
    } = req.body;

    // Check if client exists and belongs to workspace
    const existingClient = await prisma.client.findFirst({
      where: {
        id: parseInt(id),
        workspaceId,
      },
    });

    if (!existingClient) {
      return res.status(404).json({ error: "Cliente não encontrado" });
    }

    const client = await prisma.client.update({
      where: { id: parseInt(id) },
      data: {
        name,
        email,
        phone,
        company,
        document,
        street,
        number,
        complement,
        neighborhood,
        city,
        state,
        zipCode,
        country,
        instagram,
        facebook,
        linkedin,
        website,
        segment,
        totalRevenue: totalRevenue ? parseFloat(totalRevenue) : null,
        lifetimeValue: lifetimeValue ? parseFloat(lifetimeValue) : null,
        status,
        observations,
        assignedToId,
      },
      include: {
        assignedTo: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    res.json(client);
  } catch (error) {
    console.error("Error updating client:", error);
    res.status(500).json({ error: "Erro ao atualizar cliente" });
  }
};

// 🔥 Delete Client
export const deleteClient = async (req, res) => {
  try {
    const { id } = req.params;
    const workspaceId = req.workspaceId;

    // Check if client exists and belongs to workspace
    const existingClient = await prisma.client.findFirst({
      where: {
        id: parseInt(id),
        workspaceId,
      },
    });

    if (!existingClient) {
      return res.status(404).json({ error: "Cliente não encontrado" });
    }

    await prisma.client.delete({
      where: { id: parseInt(id) },
    });

    res.json({ message: "Cliente deletado com sucesso" });
  } catch (error) {
    console.error("Error deleting client:", error);
    res.status(500).json({ error: "Erro ao deletar cliente" });
  }
};

// 🔥 Export Clients to Excel
export const exportClients = async (req, res) => {
  try {
    const workspaceId = req.workspaceId;
    const { status, segment, assignedToId } = req.query;

    // Build where clause
    const where = {
      workspaceId,
      ...(status && { status }),
      ...(segment && { segment }),
      ...(assignedToId && { assignedToId: parseInt(assignedToId) }),
    };

    const clients = await prisma.client.findMany({
      where,
      include: {
        assignedTo: {
          select: { name: true, email: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // TODO: Implement Excel generation with exceljs
    // For now, return JSON
    res.json(clients);
  } catch (error) {
    console.error("Error exporting clients:", error);
    res.status(500).json({ error: "Erro ao exportar clientes" });
  }
};
