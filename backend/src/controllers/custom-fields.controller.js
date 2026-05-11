import prisma from "../config/prisma.js";

export const listCustomFields = async (req, res) => {
  try {
    const { workspaceId } = req;
    const { entityType } = req.query;

    const where = { workspaceId };
    if (entityType) where.entityType = entityType;

    const fields = await prisma.customField.findMany({
      where,
      orderBy: { createdAt: "asc" },
    });

    res.json(fields);
  } catch (error) {
    console.error("Error in listCustomFields:", error);
    res.status(500).json({ error: error.message });
  }
};

export const createCustomField = async (req, res) => {
  try {
    const { workspaceId } = req;
    const { name, type, options, entityType, placeholder, isRequired } = req.body;

    const field = await prisma.customField.create({
      data: {
        name,
        type,
        options,
        entityType,
        placeholder,
        isRequired,
        workspaceId,
      },
    });

    res.json(field);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateCustomField = async (req, res) => {
  try {
    const { id } = req.params;
    const { workspaceId } = req;
    const { name, type, options, placeholder, isRequired } = req.body;

    const field = await prisma.customField.updateMany({
      where: { id: Number(id), workspaceId },
      data: {
        name,
        type,
        options,
        placeholder,
        isRequired,
      },
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteCustomField = async (req, res) => {
  try {
    const { id } = req.params;
    const { workspaceId } = req;

    await prisma.customField.deleteMany({
      where: { id: Number(id), workspaceId },
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
