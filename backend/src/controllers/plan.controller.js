import prisma from "../config/prisma.js";
import crypto from "crypto";
import { sendMail } from "../services/mail.service.js";

export const listPlans = async (req, res) => {
    try {
        const plans = await prisma.plan.findMany({
            where: { isActive: true },
            orderBy: { price: "asc" }
        });
        res.json(plans);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const createPlan = async (req, res) => {
    try {
        if (req.user.role !== "ADMIN") return res.status(403).json({ error: "Acesso negado" });
        const { name, description, daysValid, price, role, features, isSubscription } = req.body;
        
        const plan = await prisma.plan.create({
            data: {
                name,
                description,
                daysValid: Number(daysValid),
                price: Number(price),
                role,
                features: Array.isArray(features) ? features : [],
                isSubscription: Boolean(isSubscription)
            }
        });
        res.status(201).json(plan);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const updatePlan = async (req, res) => {
    try {
        if (req.user.role !== "ADMIN") return res.status(403).json({ error: "Acesso negado" });
        const { id } = req.params;
        const data = req.body;
        
        const updated = await prisma.plan.update({
            where: { id: Number(id) },
            data
        });
        res.json(updated);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const deletePlan = async (req, res) => {
    try {
        if (req.user.role !== "ADMIN") return res.status(403).json({ error: "Acesso negado" });
        const { id } = req.params;
        await prisma.plan.delete({ where: { id: Number(id) } });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const activateUserPlan = async (userId, planId) => {
    const plan = await prisma.plan.findUnique({ where: { id: Number(planId) } });
    if (!plan) throw new Error("Plano não encontrado");

    const user = await prisma.user.findUnique({ where: { id: Number(userId) } });
    if (!user) throw new Error("Usuário não encontrado");

    let newExpiry = new Date();
    const now = new Date();

    if (user.subscriptionExpiresAt && user.subscriptionExpiresAt > now) {
        newExpiry = new Date(user.subscriptionExpiresAt.getTime() + (plan.daysValid * 24 * 60 * 60 * 1000));
    } else {
        newExpiry.setDate(now.getDate() + plan.daysValid);
    }

    const updatedUser = await prisma.user.update({
        where: { id: Number(userId) },
        data: {
            subscriptionStatus: "ACTIVE",
            subscriptionExpiresAt: newExpiry,
            billingStatus: "ativo"
        }
    });

    // Generate and assign a License Key
    const keyString = crypto.randomBytes(8).toString("hex").toUpperCase();
    const newKey = await prisma.licenseKey.create({
        data: {
            key: keyString,
            daysValid: plan.daysValid,
            usageLimit: 1,
            currentUsage: 1,
            priceGestor: plan.role === "MANAGER" ? plan.price : 0,
            priceCliente: plan.role !== "MANAGER" ? plan.price : 0,
            planId: plan.id,
            isActive: true,
        }
    });

    await prisma.licenseActivation.create({
        data: {
            keyId: newKey.id,
            userId: user.id
        }
    });

    // Send email to user
    try {
        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #2563eb;">Obrigado por assinar o plano ${plan.name}!</h2>
                <p>Olá <strong>${user.name}</strong>,</p>
                <p>Seu pagamento foi aprovado e seu plano foi ativado com sucesso.</p>
                <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: center;">
                    <p style="margin: 0; color: #4b5563; font-size: 14px;">Sua Chave de Licença Exclusiva</p>
                    <h3 style="margin: 10px 0 0 0; color: #111827; font-size: 24px; letter-spacing: 2px;">${keyString}</h3>
                </div>
                <p>Esta chave já foi vinculada automaticamente à sua conta.</p>
                <p>O plano é válido por ${plan.daysValid} dias, até <strong>${newExpiry.toLocaleDateString('pt-BR')}</strong>.</p>
                <br/>
                <p>Atenciosamente,<br/>Equipe Rastreia AI</p>
            </div>
        `;
        await sendMail(user.email, "Confirmação de Assinatura e Chave de Licença - Rastreia AI", html);
    } catch (emailError) {
        console.error("Erro ao enviar email com a chave de licença:", emailError);
    }

    return updatedUser;
};

export const checkoutPlan = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const plan = await prisma.plan.findUnique({ where: { id: Number(id) } });
        if (!plan) return res.status(404).json({ error: "Plano não encontrado" });

        const paymentConfig = await prisma.paymentConfig.findFirst({
            where: { isActive: true }
        });

        if (!paymentConfig || !paymentConfig.accessToken || paymentConfig.mode === "SANDBOX") {
            return res.json({
                isMock: true,
                planId: plan.id,
                provider: paymentConfig?.provider || "MOCK",
                message: "Ambiente de Testes / Sandbox local ativo."
            });
        }

        const { provider, accessToken } = paymentConfig;

        const baseUrl = process.env.FRONTEND_URL || req.headers.origin || 'http://localhost:3000';

        if (provider === "STRIPE") {
            const isSubscription = plan.isSubscription;
            const sessionParams = new URLSearchParams({
                success_url: `${baseUrl}/planos?success=true&planId=${plan.id}`,
                cancel_url: `${baseUrl}/planos`,
                mode: isSubscription ? 'subscription' : 'payment',
                'line_items[0][price_data][currency]': 'brl',
                'line_items[0][price_data][product_data][name]': plan.name,
                'line_items[0][price_data][product_data][description]': plan.description || `Plano ${plan.name}`,
                'line_items[0][price_data][unit_amount]': Math.round(plan.price * 100).toString(),
                'line_items[0][quantity]': '1',
                client_reference_id: userId.toString(),
            });

            if (isSubscription) {
                sessionParams.append('subscription_data[metadata][planId]', plan.id.toString());
                sessionParams.append('subscription_data[metadata][userId]', userId.toString());
                const interval = plan.daysValid >= 365 ? 'year' : 'month';
                sessionParams.append('line_items[0][price_data][recurring][interval]', interval);
                sessionParams.append('payment_method_types[0]', 'card');
            } else {
                sessionParams.append('metadata[planId]', plan.id.toString());
                sessionParams.append('metadata[userId]', userId.toString());
            }

            const stripeRes = await fetch("https://api.stripe.com/v1/checkout/sessions", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                body: sessionParams.toString(),
            });

            const session = await stripeRes.json();

            if (stripeRes.ok && session.url) {
                return res.json({ url: session.url, provider: "STRIPE", isMock: false });
            } else {
                console.error("Erro Stripe Checkout:", session);
                return res.status(400).json({ error: `Falha ao iniciar Checkout com Stripe: ${session.error?.message || "Erro desconhecido"}` });
            }
        } else {
            const isSubscription = plan.isSubscription;

            if (isSubscription) {
                const preapprovalBody = {
                    reason: plan.name,
                    auto_recurring: {
                        frequency: 1,
                        frequency_type: plan.daysValid >= 365 ? "years" : "months",
                        transaction_amount: Number(plan.price),
                        currency_id: "BRL"
                    },
                    back_url: `${baseUrl}/planos?success=true&planId=${plan.id}`,
                    external_reference: `${userId}:${plan.id}`,
                    payer_email: req.user.email || "teste@teste.com"
                };

                const mpRes = await fetch("https://api.mercadopago.com/preapproval", {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(preapprovalBody),
                });

                const preapproval = await mpRes.json();

                if (mpRes.ok && preapproval.init_point) {
                    return res.json({ url: preapproval.init_point, provider: "MERCADO_PAGO", isMock: false });
                } else {
                    console.error("Erro Mercado Pago Preapproval:", preapproval);
                    return res.status(400).json({ error: `Falha ao iniciar Assinatura com Mercado Pago: ${preapproval.message || "Erro desconhecido"}` });
                }
            } else {
                const preferenceBody = {
                    items: [
                        {
                            title: plan.name,
                            quantity: 1,
                            unit_price: Number(plan.price),
                            currency_id: "BRL",
                            description: plan.description || `Plano ${plan.name}`
                        }
                    ],
                    back_urls: {
                        success: `${baseUrl}/planos?success=true&planId=${plan.id}`,
                        failure: `${baseUrl}/planos`,
                        pending: `${baseUrl}/planos`,
                    },
                    auto_return: "approved",
                    external_reference: `${userId}:${plan.id}`,
                    metadata: {
                        plan_id: plan.id,
                        user_id: userId,
                    }
                };

                const mpRes = await fetch("https://api.mercadopago.com/checkout/preferences", {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(preferenceBody),
                });

                const preference = await mpRes.json();

                if (mpRes.ok && preference.init_point) {
                    return res.json({ url: preference.init_point, provider: "MERCADO_PAGO", isMock: false });
                } else {
                    console.error("Erro Mercado Pago Checkout:", preference);
                    return res.status(400).json({ error: `Falha ao iniciar Checkout com Mercado Pago: ${preference.message || "Erro desconhecido"}` });
                }
            }
        }
    } catch (error) {
        console.error("Erro Checkout:", error);
        res.status(500).json({ error: `Erro interno no servidor ao processar pagamento: ${error.message}` });
    }
};

export const activateMockPlan = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        await activateUserPlan(userId, id);
        res.json({ success: true, message: "Plano ativado com sucesso em ambiente de testes!" });
    } catch (error) {
        console.error("Erro Mock Activation:", error);
        res.status(500).json({ error: `Falha ao ativar plano de teste: ${error.message}` });
    }
};
