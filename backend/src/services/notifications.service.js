import prisma from "../config/prisma.js";
import { getIO } from "./socket.service.js";
import { sendMail } from "./mail.service.js";
import { sendMessage } from "./evolution.service.js";

/**
 * Sends a notification through all enabled channels based on user settings.
 */
export const notifyUser = async ({
  userId,
  workspaceId,
  title,
  message,
  type = "INFO",
  eventKey = "newLead", // mapped to notificationSettings keys: newLead, conversion, message, etc.
}) => {
  try {
    // 1. Get User and Settings
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        id: true, 
        email: true, 
        phone: true, 
        notificationSettings: true,
        connections: {
            where: { status: "connected" },
            take: 1
        }
      }
    });

    if (!user) return;

    const settings = user.notificationSettings || {};
    
    // Helper to check if a specific channel & event is enabled
    // If setting is missing, we assume true for panel/email and false for whatsapp
    const isEnabled = (channel, event) => {
      if (settings[channel] === false) return false; // Channel global off
      if (settings[event] === false) return false; // Event specific off
      return true;
    };

    // 2. Create DB Notification record (Always do this for history)
    await prisma.notification.create({
      data: {
        userId,
        workspaceId,
        title,
        message,
        type,
      },
    });

    // 3. Socket.IO (Panel)
    if (isEnabled('push', eventKey)) {
      try {
        const io = getIO();
        const room = workspaceId ? `workspace:${workspaceId}` : `user:${userId}`;
        io.to(room).emit("notification:new", {
          title,
          message,
          type,
          createdAt: new Date(),
        });
      } catch (err) {
        console.warn("Socket notification failed:", err.message);
      }
    }

    // 4. Email Channel
    if (isEnabled('email', eventKey)) {
      try {
        await sendMail(
          user.email,
          `[Rastreia AI] ${title}`,
          `<h3>${title}</h3><p>${message}</p>`
        );
      } catch (err) {
        console.error("Email notification failed:", err.message);
      }
    }

    // 5. WhatsApp Channel (Default OFF unless specified)
    if (settings.whatsapp === true && isEnabled('whatsapp', eventKey) && user.phone) {
      try {
        const conn = user.connections[0];
        if (conn && conn.apiSecret) {
          await sendMessage(
            conn.apiSecret,
            conn.apiKey,
            user.phone,
            `🔔 *${title}*\n\n${message}`
          );
        }
      } catch (err) {
        console.error("WhatsApp notification failed:", err.message);
      }
    }

  } catch (error) {
    console.error("Critical error in notifyUser:", error);
  }
};

/**
 * Sends a notification to all members of a workspace.
 */
export const notifyWorkspace = async (workspaceId, { title, message, type, eventKey }) => {
  try {
    const members = await prisma.workspaceMember.findMany({
      where: { workspaceId },
      select: { userId: true }
    });

    for (const member of members) {
      await notifyUser({
        userId: member.userId,
        workspaceId,
        title,
        message,
        type,
        eventKey
      });
    }
  } catch (error) {
    console.error("Error in notifyWorkspace:", error);
  }
};
