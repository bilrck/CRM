import prisma from "../config/prisma.js";

export const listTasks = async (req, res) => {
  try {
    const workspaceId = req.workspaceId;
    const tasks = await prisma.task.findMany({
      where: {
        workspaceId: Number(workspaceId),
        userId: req.user.id,
      },
      include: {
        lead: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { dueDate: "asc" },
    });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: "Erro ao listar tarefas" });
  }
};

export const createTask = async (req, res) => {
  try {
    const workspaceId = req.workspaceId;
    const { title, description, status, priority, dueDate, reminderAt, reminderType, leadId } = req.body;

    const task = await prisma.task.create({
      data: {
        title,
        description,
        status: status || "PENDING",
        priority: priority || "MEDIUM",
        dueDate: dueDate ? new Date(dueDate) : null,
        reminderAt: reminderAt ? new Date(reminderAt) : null,
        reminderType: reminderType || "SYSTEM",
        userId: req.user.id,
        workspaceId: Number(workspaceId),
        leadId: leadId && leadId !== "none" ? Number(leadId) : null,
      },
    });

    res.status(201).json(task);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao criar tarefa" });
  }
};

export const updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, status, priority, dueDate, reminderAt, reminderType, leadId } = req.body;

    const task = await prisma.task.update({
      where: { id: Number(id) },
      data: {
        title,
        description,
        status,
        priority,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        reminderAt: reminderAt ? new Date(reminderAt) : undefined,
        reminderType,
        leadId: leadId && leadId !== "none" ? Number(leadId) : null,
      },
    });

    res.json(task);
  } catch (error) {
    res.status(500).json({ error: "Erro ao atualizar tarefa" });
  }
};

export const deleteTask = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.task.delete({ where: { id: Number(id) } });
    res.json({ message: "Tarefa removida com sucesso" });
  } catch (error) {
    res.status(500).json({ error: "Erro ao remover tarefa" });
  }
};
