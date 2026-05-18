import prisma from "../config/prisma.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { sendMail } from "../services/mail.service.js";
dotenv.config();

// ========================================
// REGISTER
// ========================================
export const register = async (req, res) => {
  try {
    const { name, email, password, role, licenseKey } = req.body;

    if (!email || !password)
      return res.status(400).json({ error: "Email e senha são obrigatórios" });

    let finalRole = role || "CLIENTE";
    let subscriptionStatus = "TRIAL";
    let subscriptionPlan = "TESTE";
    let expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 10); // Default 10 days trial
    let maxInstances = 5;
    let keyId = null;

    // If License Key provided, validate it
    if (licenseKey) {
      const key = await prisma.licenseKey.findUnique({
        where: { key: licenseKey.toUpperCase() },
        include: { plan: true }
      });

      if (!key) return res.status(400).json({ error: "Chave de licença inválida" });
      if (key.currentUsage >= key.usageLimit) return res.status(400).json({ error: "Limite de uso desta chave atingido" });

      finalRole = key.plan?.role || role || "CLIENTE";
      subscriptionStatus = "ACTIVE";
      subscriptionPlan = key.plan?.name || "PERSONALIZADO";
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + key.daysValid);
      maxInstances = key.plan?.maxInstances || 5;
      keyId = key.id;
    }

    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) return res.status(400).json({ error: "Email já cadastrado" });

    const hash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: { 
        name, 
        email, 
        password: hash, 
        role: keyId ? (key?.plan?.role || role || "CLIENTE") : (role || "CLIENTE"),
        subscriptionStatus,
        subscriptionPlan,
        subscriptionExpiresAt: expiresAt,
        maxTotalInstances: maxInstances,
        trialEndsAt: subscriptionStatus === "TRIAL" ? expiresAt : null
      },
    });

    // Record activation if key was used
    if (keyId) {
      await prisma.licenseActivation.create({
        data: {
          keyId,
          userId: user.id
        }
      });

      await prisma.licenseKey.update({
        where: { id: keyId },
        data: { currentUsage: { increment: 1 } }
      });
    }

    // Create default workspace for the new user
    await prisma.workspace.create({
      data: {
        name: `Workspace de ${name}`,
        ownerId: user.id,
        members: {
          create: {
            userId: user.id,
            role: "OWNER"
          }
        }
      }
    });

    const { password: _, ...rest } = user;
    return res.json(rest);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro ao registrar usuário" });
  }
};

// ========================================
// LOGIN
// ========================================
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(404).json({ error: "Usuário não encontrado" });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: "Senha incorreta" });

    // 🛡️ Check if Two-Factor Authentication is enabled
    const prefs = user.preferences ? (typeof user.preferences === 'string' ? JSON.parse(user.preferences) : user.preferences) : {};
    if (prefs.twoFactorEnabled) {
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const expires = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

      // Save to user preferences JSON
      const newPrefs = {
        ...prefs,
        twoFactorCode: code,
        twoFactorExpiresAt: expires.toISOString()
      };

      await prisma.user.update({
        where: { id: user.id },
        data: { preferences: newPrefs }
      });

      // Send 2FA code via E-mail
      await sendMail(
        user.email,
        "Código de Segurança - Dois Fatores (2FA)",
        `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #2563eb; font-weight: bold; margin-bottom: 5px;">Rastreia AI</h2>
          <p style="color: #475569; font-size: 12px; margin-top: 0; margin-bottom: 20px;">Segurança de Conta</p>
          <p>Olá, <strong>${user.name}</strong>.</p>
          <p>Você está tentando fazer login no sistema. Por segurança, digite o código de verificação abaixo no painel:</p>
          <div style="font-size: 32px; font-weight: bold; letter-spacing: 6px; text-align: center; color: #2563eb; background-color: #f8fafc; padding: 20px; border-radius: 12px; margin: 25px auto; max-width: 240px; border: 1px dashed #cbd5e1;">
            ${code}
          </div>
          <p style="font-size: 12px; color: #64748b; margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 15px;">
            Este código expira em 5 minutos. Se você não solicitou isso, altere sua senha imediatamente por segurança.
          </p>
        </div>
        `
      );

      return res.json({ twoFactorRequired: true, email: user.email });
    }

    // Payload completo
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );

    const isProduction = process.env.NODE_ENV === "production";

    const cookieOptions = {
      httpOnly: true,
      secure: isProduction, // OBRIGATÓRIO em produção para HTTPS
      sameSite: isProduction ? "none" : "lax", // 'none' permite cross-domain
      maxAge: 7 * 24 * 60 * 60 * 1000,
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      path: "/",
    };

    if (isProduction && process.env.COOKIE_DOMAIN) {
      cookieOptions.domain = process.env.COOKIE_DOMAIN;
    }

    // Define o novo cookie (substitui o antigo automaticamente se o path/domain for o mesmo)
    res.cookie("token", token, cookieOptions);

    const { password: _, ...rest } = user;
    return res.json({ user: rest });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ error: "Erro no login: Falha ao conectar com o banco de dados" });
  }
};

// ========================================
// LOGOUT
// ========================================
export const logout = async (req, res) => {
  try {
    const isProduction = process.env.NODE_ENV === "production";

    const cookieOptions = {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      path: "/",
    };

    if (isProduction && process.env.COOKIE_DOMAIN) {
      cookieOptions.domain = process.env.COOKIE_DOMAIN;
    }

    res.clearCookie("token", cookieOptions);

    return res.json({ success: true });
  } catch (err) {
    console.error("Erro ao fazer logout:", err);
    return res.status(500).json({ error: "Erro ao fazer logout" });
  }
};
// ========================================
// CHANGE PASSWORD (FORCED)
// ========================================
export const changePassword = async (req, res) => {
  try {
    const { newPassword, companyName } = req.body;
    const userId = req.user.id;

    if (!newPassword)
      return res.status(400).json({ error: "Nova senha é obrigatória" });

    const hash = await bcrypt.hash(newPassword, 10);

    // Update User
    await prisma.user.update({
      where: { id: userId },
      data: {
        password: hash,
        forcePasswordChange: false,
      },
    });

    // Update Workspace Name if provided
    if (companyName) {
      await prisma.workspace.updateMany({
        where: { ownerId: userId },
        data: { name: companyName },
      });
    }

    res.json({ message: "Senha alterada e perfil configurado com sucesso" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao atualizar perfil" });
  }
};

// ========================================
// FORGOT PASSWORD
// ========================================
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return res.json({ message: "Se o email estiver cadastrado, um link de recuperação será enviado." });
    }

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: "1h" });
    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

    await sendMail(
      email,
      "Recuperação de Senha - Rastreia AI",
      `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #2563eb;">Rastreia AI</h2>
        <p>Olá, <strong>${user.name}</strong>.</p>
        <p>Você solicitou a recuperação de senha. Clique no botão abaixo para redefinir sua senha:</p>
        <a href="${resetLink}" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: #fff; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0;">Redefinir Senha</a>
        <p style="font-size: 12px; color: #64748b;">Este link expira em 1 hora. Se você não solicitou isso, ignore este email.</p>
      </div>
      `
    );

    res.json({ message: "Email enviado com sucesso." });
  } catch (error) {
    console.error("Erro forgotPassword:", error);
    res.status(500).json({ error: "Erro ao processar solicitação" });
  }
};

// ========================================
// RESET PASSWORD (FROM TOKEN)
// ========================================
export const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ error: "Token e nova senha são obrigatórios" });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;

    const hash = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: userId },
      data: {
        password: hash,
        forcePasswordChange: false
      }
    });

    res.json({ message: "Senha redefinida com sucesso. Agora você pode fazer login." });
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(400).json({ error: "O link de recuperação expirou." });
    }
    console.error("resetPassword error:", error);
    res.status(500).json({ error: "Erro ao redefinir senha. Link inválido ou expirado." });
  }
};

// ========================================
// VERIFY 2FA CODE & SIGN IN
// ========================================
export const verify2FA = async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) {
      return res.status(400).json({ error: "E-mail e código de segurança são obrigatórios." });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(404).json({ error: "Usuário não encontrado." });
    }

    const prefs = user.preferences ? (typeof user.preferences === 'string' ? JSON.parse(user.preferences) : user.preferences) : {};

    if (!prefs.twoFactorCode || prefs.twoFactorCode !== code) {
      return res.status(400).json({ error: "Código de verificação incorreto." });
    }

    if (new Date(prefs.twoFactorExpiresAt).getTime() < Date.now()) {
      return res.status(400).json({ error: "Código de verificação expirado." });
    }

    // Clean 2FA temp code from preferences
    const { twoFactorCode, twoFactorExpiresAt, ...cleanedPrefs } = prefs;
    await prisma.user.update({
      where: { id: user.id },
      data: { preferences: cleanedPrefs }
    });

    // Login user successfully
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    const isProduction = process.env.NODE_ENV === "production";
    const cookieOptions = {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      path: "/"
    };
    if (isProduction && process.env.COOKIE_DOMAIN) {
      cookieOptions.domain = process.env.COOKIE_DOMAIN;
    }
    res.cookie("token", token, cookieOptions);

    const { password: _, ...rest } = user;
    return res.json({ user: rest });
  } catch (err) {
    console.error("Erro na verificação de 2FA:", err);
    return res.status(500).json({ error: "Erro interno ao processar verificação de 2FA." });
  }
};

