import prisma from "../config/prisma.js";
import * as notificationsService from "../services/notifications.service.js";

export const listNotifications = async (req, res) => {
  try {
    const { workspaceId } = req;
    const { unreadOnly } = req.query;

    const where = {
      userId: req.user.id,
      OR: [
        { workspaceId },
        { workspaceId: null }
      ]
    };
    if (unreadOnly === "true") {
      where.read = false;
    }

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.notification.updateMany({
      where: { 
        id: Number(id), 
        userId: req.user.id 
      },
      data: { read: true },
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const markAllAsRead = async (req, res) => {
  try {
    const { workspaceId } = req;

    await prisma.notification.updateMany({
      where: { 
        userId: req.user.id,
        read: false,
        OR: [
          { workspaceId },
          { workspaceId: null }
        ]
      },
      data: { read: true },
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createNotification = async (
  userId,
  workspaceId,
  title,
  message,
  type = "INFO",
  eventKey = "systemAlert"
) => {
  return notificationsService.notifyUser({
    userId,
    workspaceId,
    title,
    message,
    type,
    eventKey
  });
};
