import prisma from "../config/prisma.js";

export default async function subscriptionMiddleware(req, res, next) {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ error: "Não autenticado" });

    // Admin always has access
    if (user.role === "ADMIN") return next();

    // Fetch fresh subscription info
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        subscriptionStatus: true,
        trialEndsAt: true,
        subscriptionExpiresAt: true,
        role: true,
      },
    });

    if (!dbUser)
      return res.status(404).json({ error: "Usuário não encontrado" });

    const now = new Date();

    // 1. Check if ACTIVE or CANCELED
    if (dbUser.subscriptionStatus === "ACTIVE" || dbUser.subscriptionStatus === "CANCELED") {
      if (dbUser.subscriptionExpiresAt && now > dbUser.subscriptionExpiresAt) {
        // Auto-expire
        await prisma.user.update({
          where: { id: user.id },
          data: { subscriptionStatus: "EXPIRED" },
        });
        return res.status(403).json({
          error: "Sua assinatura expirou.",
          code: "SUBSCRIPTION_EXPIRED",
        });
      }
      return next();
    }

    // 2. Check if TRIAL
    if (dbUser.subscriptionStatus === "TRIAL") {
      if (dbUser.trialEndsAt && now > dbUser.trialEndsAt) {
        // Auto-expire trial
        await prisma.user.update({
            where: { id: user.id },
            data: { subscriptionStatus: "EXPIRED" }
        });
        return res.status(403).json({
          error: "Seu período de teste de 10 dias acabou.",
          code: "TRIAL_EXPIRED",
        });
      }
      return next();
    }

    // 3. EXPIRED or CANCELED
    return res.status(403).json({
      error: "Assinatura necessária para acessar esta funcionalidade.",
      code: "SUBSCRIPTION_REQUIRED",
    });
  } catch (error) {
    console.error("Subscription Middleware Error:", error);
    return res.status(500).json({ error: "Erro interno no servidor" });
  }
}
