import prisma from "../config/prisma.js";
import { getIO } from "./socket.service.js";
import { sendMail } from "./mail.service.js";
import { sendMessage } from "./evolution.service.js";

/**
 * Sends a WhatsApp notification resolving connection instances and custom recipient targets from settings.
 */
export const sendWhatsAppNotification = async (userId, workspaceId, title, message) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        phone: true,
        notificationSettings: true
      }
    });

    if (!user) return false;

    const settings = user.notificationSettings || {};
    
    // 1. Resolve Connection (custom chosen or fallback)
    let connection = null;
    const connectionId = settings.whatsappNotificationConnectionId;
    if (connectionId && connectionId !== "none" && connectionId !== "null" && connectionId !== "" && !isNaN(Number(connectionId))) {
      connection = await prisma.connection.findFirst({
        where: {
          id: Number(connectionId),
          status: "connected"
        }
      });
    }

    // Fallback to first connected connection in the workspace
    if (!connection) {
      connection = await prisma.connection.findFirst({
        where: {
          workspaceId: workspaceId || undefined,
          provider: "evolution",
          status: "connected"
        }
      });
    }

    if (!connection || !connection.apiSecret) {
      console.warn(`[WhatsApp Notification] No connected instance found for user ${userId} in workspace ${workspaceId}`);
      return false;
    }

    // 2. Resolve Target (self, group, custom number)
    let target = null;
    const targetType = settings.whatsappNotificationTargetType || 'self';
    const targetValue = settings.whatsappNotificationTargetValue;

    if (targetType === 'self') {
      target = user.phone;
    } else if (targetType === 'group' || targetType === 'custom') {
      target = targetValue;
    }

    if (!target) {
      console.warn(`[WhatsApp Notification] No target number/group JID resolved for user ${userId}`);
      return false;
    }

    // Clean phone number of spaces, hyphens, and parentheses (keep group JIDs intact)
    if (!target.endsWith('@g.us')) {
      target = target.replace(/\D/g, '');
    }

    // 3. Send Message
    await sendMessage(
      connection.apiSecret,
      connection.apiKey,
      target,
      `🔔 *${title}*\n\n${message}`
    );
    return true;
  } catch (err) {
    console.error("[WhatsApp Notification] Send failed:", err.message);
    return false;
  }
};

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
  isTracked = false
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
      }
    });

    if (!user) return;

    const settings = user.notificationSettings || {};

    // Filter incoming message events by user settings
    if (eventKey === "message") {
      if (settings.message === false) return; // Skip if disabled globally
      const filterType = settings.whatsappNotificationFilter || "ALL";
      if (filterType === "TRACKED_ONLY" && !isTracked) {
        return; // Skip if user only wants tracked conversation notifications and this isn't one
      }
    }
    
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

    // 5. WhatsApp Channel
    if (settings.whatsapp === true && isEnabled('whatsapp', eventKey)) {
      try {
        await sendWhatsAppNotification(userId, workspaceId, title, message);
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
export const notifyWorkspace = async (workspaceId, { title, message, type, eventKey, isTracked }) => {
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
        eventKey,
        isTracked
      });
    }
  } catch (error) {
    console.error("Error in notifyWorkspace:", error);
  }
};
