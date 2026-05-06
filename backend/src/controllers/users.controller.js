import bcrypt from "bcrypt";
import prisma from "../config/prisma.js";

export const me = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        memberships: {
          include: { workspace: true },
        },
      },
    });

    if (!user) {
      return res.status(401).json({ error: "Usuário não encontrado" });
    }

    const { password: _, ...rest } = user;

    // Flatten workspace info for frontend convenience
    const activeWorkspace = user.memberships[0]?.workspace;

    return res.json({
      ...rest,
      workspaceId: activeWorkspace?.id,
      workspaceName: activeWorkspace?.name,
      role: user.role, // Global Role
      subscriptionStatus: user.subscriptionStatus,
      subscriptionPlan: user.subscriptionPlan,
      trialEndsAt: user.trialEndsAt,
      subscriptionExpiresAt: user.subscriptionExpiresAt,
      maxTotalInstances: user.maxTotalInstances,
    });
  } catch (err) {
    return res.status(500).json({ error: "Erro ao carregar usuário" });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { name, phone, avatarUrl } = req.body;
    const updated = await prisma.user.update({
      where: { id: req.user.id },
      data: { name, phone, avatarUrl },
    });
    const { password: _, ...rest } = updated;
    res.json(rest);
  } catch (error) {
    res.status(500).json({ error: "Erro ao atualizar perfil" });
  }
};

export const updateNotifications = async (req, res) => {
  try {
    const { notifications } = req.body;
    const updated = await prisma.user.update({
      where: { id: req.user.id },
      data: { notificationSettings: notifications },
    });
    res.json(updated.notificationSettings);
  } catch (error) {
    res.status(500).json({ error: "Erro ao atualizar notificações" });
  }
};

export const updatePreferences = async (req, res) => {
  try {
    const { preferences, billingReminderConfig } = req.body;
    
    const data = {};
    if (preferences) data.preferences = preferences;
    if (billingReminderConfig) data.billingReminderConfig = billingReminderConfig;

    const updated = await prisma.user.update({
      where: { id: req.user.id },
      data
    });
    res.json({ preferences: updated.preferences, billingReminderConfig: updated.billingReminderConfig });
  } catch (error) {
    res.status(500).json({ error: "Erro ao atualizar preferências" });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    const isMatch = await bcrypt.compare(currentPassword, user.password);

    if (!isMatch)
      return res.status(400).json({ error: "Senha atual incorreta" });

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: req.user.id },
      data: { password: hashedPassword, forcePasswordChange: false },
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Erro ao alterar senha" });
  }
};

export const listUsers = async (req, res) => {
  if (req.user.role !== "ADMIN")
    return res.status(403).json({ error: "Acesso negado" });

  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      maxMetaConnections: true,
      maxWhatsappConnections: true,
      maxTotalInstances: true,
      subscriptionStatus: true,
      subscriptionPlan: true,
      trialEndsAt: true,
      subscriptionExpiresAt: true,
      billingStatus: true,
      billingReminderConfig: true,
      lastBillingReminderAt: true,
      createdAt: true,
    },
    orderBy: { id: "asc" },
  });
  res.json(users);
};

export const createUser = async (req, res) => {
  if (req.user.role !== "ADMIN")
    return res.status(403).json({ error: "Acesso negado" });
  try {
    const {
      name,
      email,
      password,
      role,
      maxMetaConnections,
      maxWhatsappConnections,
    } = req.body;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(400).json({ error: "Email já cadastrado" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role || "CLIENTE",
        maxMetaConnections: Number(maxMetaConnections) || 1,
        maxWhatsappConnections: Number(maxWhatsappConnections) || 1,
        maxTotalInstances: Number(req.body.maxTotalInstances) || 5,
        subscriptionStatus: req.body.subscriptionStatus || "TRIAL",
        subscriptionPlan: req.body.subscriptionPlan || null,
        subscriptionExpiresAt: req.body.subscriptionExpiresAt ? new Date(req.body.subscriptionExpiresAt) : null,
        billingStatus: req.body.billingStatus || "ativo",
        billingReminderConfig: req.body.billingReminderConfig || undefined,
      },
    });

    const { password: _, ...rest } = user;
    return res.status(201).json(rest);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Erro ao criar usuário" });
  }
};

export const updateUser = async (req, res) => {
  if (req.user.role !== "ADMIN")
    return res.status(403).json({ error: "Acesso negado" });
  try {
    const { id } = req.params;
    const {
      name,
      email,
      role,
      maxMetaConnections,
      maxWhatsappConnections,
      password,
    } = req.body;

    const data = {
      name,
      email,
      role,
      maxMetaConnections: Number(maxMetaConnections),
      maxWhatsappConnections: Number(maxWhatsappConnections),
      maxTotalInstances: Number(req.body.maxTotalInstances),
      subscriptionStatus: req.body.subscriptionStatus,
      subscriptionPlan: req.body.subscriptionPlan,
      subscriptionExpiresAt: req.body.subscriptionExpiresAt ? new Date(req.body.subscriptionExpiresAt) : undefined,
      billingStatus: req.body.billingStatus,
      billingReminderConfig: req.body.billingReminderConfig,
    };

    if (password) {
      data.password = await bcrypt.hash(password, 10);
    }

    const user = await prisma.user.update({
      where: { id: Number(id) },
      data,
    });

    const { password: _, ...rest } = user;
    return res.json(rest);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Erro ao atualizar usuário" });
  }
};

export const deleteUser = async (req, res) => {
  if (req.user.role !== "ADMIN")
    return res.status(403).json({ error: "Acesso negado" });
  try {
    const { id } = req.params;
    // Impedir auto-deleção
    if (Number(id) === req.user.id)
      return res.status(400).json({ error: "Não pode deletar a si mesmo" });

    await prisma.user.delete({ where: { id: Number(id) } });
    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: "Erro ao deletar usuário" });
  }
};

// LGPD: Exportar todos os dados do usuário (Portabilidade)
export const exportData = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        memberships: { include: { workspace: true } },
        licenseActivations: { include: { key: true } },
        leads: true
      }
    });

    if (!user) return res.status(404).json({ error: "Usuário não encontrado" });

    const { password: _, ...userData } = user;
    
    // Gerar um JSON com todos os dados
    res.setHeader("Content-Disposition", 'attachment; filename="meus-dados-rastreia.json"');
    res.setHeader("Content-Type", "application/json");
    res.send(JSON.stringify(userData, null, 2));
  } catch (error) {
    res.status(500).json({ error: "Erro ao exportar dados" });
  }
};

// LGPD: Solicitar exclusão (Direito ao esquecimento)
export const requestDeletion = async (req, res) => {
  try {
    // Em um sistema real, poderíamos marcar para exclusão em 30 dias ou enviar email para admin
    await prisma.user.update({
      where: { id: req.user.id },
      data: { 
        subscriptionStatus: "EXPIRED", // Bloqueia acesso
        name: "Usuário em Processo de Exclusão",
        // anonimizar dados sensíveis conforme LGPD
      }
    });
    
    // Limpar cookie de sessão
    res.clearCookie("token");
    res.json({ message: "Sua solicitação de exclusão foi processada. Seus dados serão removidos em até 30 dias." });
  } catch (error) {
    res.status(500).json({ error: "Erro ao solicitar exclusão" });
  }
};
