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

export const activateUserPlan = async (userId, planId, gatewaySubscriptionId = null) => {
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
            billingStatus: "ativo",
            gatewaySubscriptionId: gatewaySubscriptionId || undefined
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
                sessionParams.append('metadata[planId]', plan.id.toString());
                sessionParams.append('metadata[userId]', userId.toString());
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
        } else if (provider === "PAGARME") {
            const base64Key = Buffer.from(accessToken + ":").toString("base64");
            const pagarMeBody = {
                name: plan.name,
                type: "order",
                status: "active",
                payment_methods: ["credit_card", "pix"],
                items: [
                    {
                        amount: Math.round(plan.price * 100),
                        description: plan.description || `Plano ${plan.name}`,
                        quantity: 1
                    }
                ],
                metadata: {
                    planId: plan.id.toString(),
                    userId: userId.toString()
                }
            };

            const pagarmeRes = await fetch("https://api.pagar.me/core/v5/payment-links", {
                method: "POST",
                headers: {
                    Authorization: `Basic ${base64Key}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(pagarMeBody),
            });

            const link = await pagarmeRes.json();

            if (pagarmeRes.ok && link.url) {
                return res.json({ url: link.url, provider: "PAGARME", isMock: false });
            } else {
                console.error("Erro Pagar.me Checkout:", link);
                return res.status(400).json({ error: `Falha ao iniciar Checkout com Pagar.me: ${link.message || "Erro desconhecido"}` });
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

export const cancelSubscription = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await prisma.user.findUnique({ where: { id: userId } });

        if (!user) {
            return res.status(404).json({ error: "Usuário não encontrado" });
        }

        // 1. Calculate plan duration and start of the current cycle to check if in 10-day refund window
        const now = new Date();
        let subscriptionDurationDays = 30; // Default MONTHLY
        if (user.subscriptionPlan === "QUARTERLY") {
            subscriptionDurationDays = 90;
        } else if (user.subscriptionPlan === "ANNUAL") {
            subscriptionDurationDays = 365;
        }

        const lastActivation = await prisma.licenseActivation.findFirst({
            where: { userId: user.id },
            orderBy: { usedAt: "desc" },
            include: { key: true }
        });
        
        if (lastActivation && lastActivation.key) {
            subscriptionDurationDays = lastActivation.key.daysValid;
        }

        let isWithinRefundPeriod = false;
        if (user.subscriptionExpiresAt) {
            const expiresAt = new Date(user.subscriptionExpiresAt);
            const startOfSubscription = new Date(expiresAt.getTime() - subscriptionDurationDays * 24 * 60 * 60 * 1000);
            const tenDaysInMillis = 10 * 24 * 60 * 60 * 1000;
            if (now.getTime() - startOfSubscription.getTime() <= tenDaysInMillis) {
                isWithinRefundPeriod = true;
            }
        }

        let refundSuccess = false;
        let refundDetails = "";

        // 2. Gateway cancellation & optional automatic refund
        if (user.gatewaySubscriptionId) {
            const paymentConfig = await prisma.paymentConfig.findFirst({
                where: { isActive: true }
            });

            if (paymentConfig && paymentConfig.accessToken) {
                const { provider, accessToken } = paymentConfig;

                if (provider === "STRIPE") {
                    // Cancel recurring subscription in Stripe
                    const resStripeCancel = await fetch(`https://api.stripe.com/v1/subscriptions/${user.gatewaySubscriptionId}`, {
                        method: "DELETE",
                        headers: {
                            Authorization: `Bearer ${accessToken}`,
                        }
                    });
                    const dataStripeCancel = await resStripeCancel.json();
                    if (!resStripeCancel.ok) {
                        console.error("Erro ao cancelar assinatura no Stripe:", dataStripeCancel);
                    }

                    // Process Refund if within 10 days
                    if (isWithinRefundPeriod) {
                        try {
                            // Retrieve the subscription details to get latest_invoice
                            const resSub = await fetch(`https://api.stripe.com/v1/subscriptions/${user.gatewaySubscriptionId}`, {
                                headers: { Authorization: `Bearer ${accessToken}` }
                            });
                            const subObj = await resSub.json();
                            const latestInvoice = subObj.latest_invoice;

                            if (latestInvoice) {
                                // Retrieve the invoice to get payment_intent
                                const resInv = await fetch(`https://api.stripe.com/v1/invoices/${latestInvoice}`, {
                                    headers: { Authorization: `Bearer ${accessToken}` }
                                });
                                const invObj = await resInv.json();
                                const paymentIntent = invObj.payment_intent;

                                if (paymentIntent) {
                                    // Refund the payment intent
                                    const params = new URLSearchParams();
                                    params.append("payment_intent", paymentIntent);

                                    const resRefund = await fetch("https://api.stripe.com/v1/refunds", {
                                        method: "POST",
                                        headers: {
                                            Authorization: `Bearer ${accessToken}`,
                                            "Content-Type": "application/x-www-form-urlencoded"
                                        },
                                        body: params
                                    });
                                    const dataRefund = await resRefund.json();
                                    if (resRefund.ok) {
                                        refundSuccess = true;
                                        refundDetails = `Reembolso Stripe realizado (ID: ${dataRefund.id})`;
                                    } else {
                                        console.error("Erro ao realizar reembolso no Stripe:", dataRefund);
                                    }
                                }
                            }
                        } catch (stripeRefundError) {
                            console.error("Erro no processo de reembolso Stripe:", stripeRefundError);
                        }
                    }
                } else if (provider === "MERCADO_PAGO" || provider === "MERCADOPAGO") {
                    // Cancel preapproval in Mercado Pago
                    const resMP = await fetch(`https://api.mercadopago.com/preapproval/${user.gatewaySubscriptionId}`, {
                        method: "PUT",
                        headers: {
                            Authorization: `Bearer ${accessToken}`,
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({ status: "cancelled" })
                    });
                    const dataMP = await resMP.json();
                    if (!resMP.ok) {
                        console.error("Erro ao cancelar preapproval no Mercado Pago:", dataMP);
                    }

                    // Process Refund if within 10 days
                    if (isWithinRefundPeriod) {
                        try {
                            // Search payments for this preapproval
                            const resSearch = await fetch(`https://api.mercadopago.com/v1/payments/search?preapproval_id=${user.gatewaySubscriptionId}&sort=date_created&criteria=desc`, {
                                headers: { Authorization: `Bearer ${accessToken}` }
                            });
                            const dataSearch = await resSearch.json();
                            
                            if (dataSearch.results && dataSearch.results.length > 0) {
                                const paymentId = dataSearch.results[0].id;
                                
                                // Refund the payment
                                const resRefund = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}/refunds`, {
                                    method: "POST",
                                    headers: {
                                        Authorization: `Bearer ${accessToken}`,
                                        "Content-Type": "application/json"
                                    }
                                });
                                const dataRefund = await resRefund.json();
                                if (resRefund.ok) {
                                    refundSuccess = true;
                                    refundDetails = `Reembolso Mercado Pago realizado (ID: ${dataRefund.id})`;
                                } else {
                                    console.error("Erro ao realizar reembolso no Mercado Pago:", dataRefund);
                                }
                            }
                        } catch (mpRefundError) {
                            console.error("Erro no processo de reembolso Mercado Pago:", mpRefundError);
                        }
                    }
                } else if (provider === "PAGARME" || provider === "PAGAR.ME") {
                    // Cancel subscription in Pagar.me
                    const base64Key = Buffer.from(accessToken + ":").toString("base64");
                    const resPagarme = await fetch(`https://api.pagar.me/core/v5/subscriptions/${user.gatewaySubscriptionId}`, {
                        method: "DELETE",
                        headers: {
                            Authorization: `Basic ${base64Key}`,
                        }
                    });
                    const dataPagarme = await resPagarme.json();
                    if (!resPagarme.ok) {
                        console.error("Erro ao cancelar assinatura no Pagar.me:", dataPagarme);
                    }

                    // Process Refund if within 10 days
                    if (isWithinRefundPeriod) {
                        try {
                            // Get subscription invoices
                            const resInvoices = await fetch(`https://api.pagar.me/core/v5/subscriptions/${user.gatewaySubscriptionId}/invoices`, {
                                headers: { Authorization: `Basic ${base64Key}` }
                            });
                            const invoices = await resInvoices.json();
                            
                            if (invoices.data && invoices.data.length > 0) {
                                const chargeId = invoices.data[0].charge?.id;
                                if (chargeId) {
                                    // Refund the charge
                                    const resRefund = await fetch(`https://api.pagar.me/core/v5/charges/${chargeId}/refund`, {
                                        method: "POST",
                                        headers: {
                                            Authorization: `Basic ${base64Key}`,
                                            "Content-Type": "application/json"
                                        }
                                    });
                                    const dataRefund = await resRefund.json();
                                    if (resRefund.ok) {
                                        refundSuccess = true;
                                        refundDetails = `Reembolso Pagar.me realizado (ID: ${dataRefund.id})`;
                                    } else {
                                        console.error("Erro ao realizar reembolso no Pagar.me:", dataRefund);
                                    }
                                }
                            }
                        } catch (pagarmeRefundError) {
                            console.error("Erro no processo de reembolso Pagar.me:", pagarmeRefundError);
                        }
                    }
                }
            }
        }

        // 3. Database Updates depending on period
        let updatedStatus = "CANCELED";
        let updatedExpiresAt = user.subscriptionExpiresAt;

        if (isWithinRefundPeriod) {
            // Cut access immediately: set expired and expire date to now
            updatedStatus = "EXPIRED";
            updatedExpiresAt = new Date();
        }

        await prisma.user.update({
            where: { id: userId },
            data: {
                subscriptionStatus: updatedStatus,
                subscriptionExpiresAt: updatedExpiresAt,
                billingStatus: "inativo",
            }
        });

        // 4. Send tailored email
        try {
            const expDateStr = user.subscriptionExpiresAt 
                ? new Date(user.subscriptionExpiresAt).toLocaleDateString('pt-BR') 
                : 'N/A';
                
            let htmlContent = "";

            if (isWithinRefundPeriod) {
                // Refund and immediate block email
                htmlContent = `
                    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
                        <div style="text-align: center; margin-bottom: 20px;">
                            <h2 style="color: #ef4444; margin-bottom: 5px;">Rastreia.ai</h2>
                            <p style="color: #64748b; font-size: 14px; margin: 0;">Confirmação de Cancelamento e Reembolso de Assinatura</p>
                        </div>
                        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin-bottom: 20px;" />
                        <p style="color: #334155; font-size: 16px; line-height: 1.5;">Olá, <strong>${user.name}</strong>,</p>
                        <p style="color: #334155; font-size: 15px; line-height: 1.5;">
                            Confirmamos que a sua assinatura recorrente do <strong>Rastreia.ai CRM</strong> foi cancelada a seu pedido dentro do prazo garantido de arrependimento (10 dias).
                        </p>
                        <div style="background-color: #fef2f2; border: 1px solid #fca5a5; padding: 15px; border-radius: 6px; margin: 20px 0;">
                            <p style="margin: 0 0 8px 0; font-size: 14px; color: #991b1b;"><strong>Status do Cancelamento & Reembolso:</strong></p>
                            <ul style="margin: 0; padding-left: 20px; font-size: 14px; color: #7f1d1d; line-height: 1.6;">
                                <li><strong>Acesso Suspenso:</strong> O acesso completo aos recursos do CRM foi interrompido imediatamente nesta data.</li>
                                <li><strong>Reembolso Automático Realizado:</strong> O valor integral correspondente à ativação/renovação deste plano foi estornado automaticamente na mesma forma de pagamento utilizada. O crédito aparecerá na sua fatura/conta em breve de acordo com seu banco.</li>
                                <li>Sua conta agora encontra-se inativa, mas seus dados permanecerão salvos em segurança caso queira voltar no futuro.</li>
                            </ul>
                        </div>
                        <p style="color: #334155; font-size: 15px; line-height: 1.5;">
                            Agradecemos pelo tempo que passou conosco. Se tiver qualquer dúvida ou precisar de qualquer auxílio, nossa equipe de suporte está à disposição.
                        </p>
                        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin-top: 30px; margin-bottom: 15px;" />
                        <p style="color: #94a3b8; font-size: 12px; text-align: center; margin: 0;">
                            Este é um email transacional automático enviado por Rastreia.ai CRM.
                        </p>
                    </div>
                `;
            } else {
                // Cancelled after 10 days (keep access until expiry)
                htmlContent = `
                    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
                        <div style="text-align: center; margin-bottom: 20px;">
                            <h2 style="color: #2563eb; margin-bottom: 5px;">Rastreia.ai</h2>
                            <p style="color: #64748b; font-size: 14px; margin: 0;">Confirmação de Cancelamento de Assinatura</p>
                        </div>
                        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin-bottom: 20px;" />
                        <p style="color: #334155; font-size: 16px; line-height: 1.5;">Olá, <strong>${user.name}</strong>,</p>
                        <p style="color: #334155; font-size: 15px; line-height: 1.5;">
                            Confirmamos que a sua assinatura recorrente do <strong>Rastreia.ai CRM</strong> foi cancelada com sucesso a seu pedido.
                        </p>
                        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 15px; border-radius: 6px; margin: 20px 0;">
                            <p style="margin: 0 0 8px 0; font-size: 14px; color: #475569;"><strong>Detalhes importantes:</strong></p>
                            <ul style="margin: 0; padding-left: 20px; font-size: 14px; color: #334155; line-height: 1.6;">
                                <li>O acesso completo aos seus recursos e workspaces continuará ativo e liberado até o dia <strong>${expDateStr}</strong>.</li>
                                <li>Nenhuma nova cobrança automática será realizada no seu cartão de crédito.</li>
                                <li>Nenhum reembolso foi gerado visto que a solicitação ocorreu após o prazo garantido de 10 dias.</li>
                                <li>Após a data de expiração, a sua conta entrará no modo inativo, mas seus dados ficarão salvos caso decida retornar futuramente.</li>
                            </ul>
                        </div>
                        <p style="color: #334155; font-size: 15px; line-height: 1.5;">
                            Lamentamos ver você partir! Se tiver qualquer dúvida ou precisar de ajuda para exportar seus dados, responda a este email ou entre em contato com nosso suporte técnico.
                        </p>
                        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin-top: 30px; margin-bottom: 15px;" />
                        <p style="color: #94a3b8; font-size: 12px; text-align: center; margin: 0;">
                            Este é um email transacional automático enviado por Rastreia.ai CRM.
                        </p>
                    </div>
                `;
            }

            await sendMail(
                user.email,
                isWithinRefundPeriod ? "Rastreia.ai - Assinatura Cancelada e Reembolsada" : "Rastreia.ai - Assinatura Cancelada com Sucesso",
                htmlContent
            );
        } catch (emailError) {
            console.error("Falha ao enviar email de cancelamento:", emailError);
        }

        return res.json({ 
            success: true, 
            message: isWithinRefundPeriod 
                ? "Assinatura cancelada dentro do prazo de 10 dias. Acesso suspenso imediatamente e reembolso automático solicitado com sucesso."
                : "Assinatura cancelada com sucesso. Acesso permanece ativo até o fim do plano.",
            isWithinRefundPeriod,
            refundSuccess,
            refundDetails
        });
    } catch (error) {
        console.error("Erro ao cancelar assinatura:", error);
        return res.status(500).json({ error: `Erro interno no servidor: ${error.message}` });
    }
};

