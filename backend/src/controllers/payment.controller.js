import prisma from "../config/prisma.js";

export const getPaymentConfig = async (req, res) => {
  if (req.user.role !== "ADMIN") return res.status(403).json({ error: "Acesso negado" });
  
  try {
    const config = await prisma.paymentConfig.findFirst();
    res.json(config || {});
  } catch (error) {
    res.status(500).json({ error: "Erro ao buscar configuração" });
  }
};

export const savePaymentConfig = async (req, res) => {
  if (req.user.role !== "ADMIN") return res.status(403).json({ error: "Acesso negado" });

  try {
    const { id, provider, isActive, publicKey, accessToken, clientSecret, webhookSecret, mode } = req.body;

    let config;
    if (id) {
      config = await prisma.paymentConfig.update({
        where: { id: Number(id) },
        data: { provider, isActive, publicKey, accessToken, clientSecret, webhookSecret, mode },
      });
    } else {
      config = await prisma.paymentConfig.create({
        data: { provider, isActive, publicKey, accessToken, clientSecret, webhookSecret, mode },
      });
    }

    res.json(config);
  } catch (error) {
    res.status(500).json({ error: "Erro ao salvar configuração" });
  }
};

export const testPaymentConfig = async (req, res) => {
  if (req.user.role !== "ADMIN") return res.status(403).json({ error: "Acesso negado" });

  try {
    const { provider, publicKey, accessToken } = req.body;

    if (!accessToken) {
      return res.status(400).json({ error: "Chave Privada / Access Token é obrigatória para o teste." });
    }

    if (provider === "STRIPE") {
      try {
        const stripeRes = await fetch("https://api.stripe.com/v1/balance", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        const data = await stripeRes.json();

        if (stripeRes.ok) {
          return res.json({ success: true, message: "Conexão com a Stripe realizada com sucesso!" });
        } else {
          return res.status(400).json({
            error: `Erro retornado pela Stripe: ${data.error?.message || "Credenciais inválidas"}`
          });
        }
      } catch (stripeError) {
        return res.status(500).json({ error: `Falha ao conectar com os servidores da Stripe: ${stripeError.message}` });
      }
    } else {
      try {
        const mpRes = await fetch("https://api.mercadopago.com/v1/payment_methods", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        const data = await mpRes.json();

        if (mpRes.ok) {
          return res.json({ success: true, message: "Conexão com o Mercado Pago realizada com sucesso!" });
        } else {
          const errorMsg = data.message || (data.cause && data.cause[0]?.description) || "Credenciais inválidas";
          return res.status(400).json({
            error: `Erro retornado pelo Mercado Pago: ${errorMsg}`
          });
        }
      } catch (mpError) {
        return res.status(500).json({ error: `Falha ao conectar com os servidores do Mercado Pago: ${mpError.message}` });
      }
    }
  } catch (error) {
    res.status(500).json({ error: `Erro no servidor ao testar a conexão: ${error.message}` });
  }
};

import { activateUserPlan } from "./plan.controller.js";

export const receivePaymentWebhook = async (req, res) => {
  try {
    const paymentConfig = await prisma.paymentConfig.findFirst({
      where: { isActive: true }
    });

    if (!paymentConfig || !paymentConfig.accessToken) {
      return res.status(400).json({ error: "Gateway de pagamento não configurado ou inativo." });
    }

    const stripeSignature = req.headers['stripe-signature'];
    
    if (stripeSignature) {
      const event = req.body;
      
      if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        const userId = session.client_reference_id || session.metadata?.userId;
        const planId = session.metadata?.planId;

        if (userId && planId) {
          console.log(`[Stripe Webhook] Ativando plano ${planId} para usuário ${userId}`);
          await activateUserPlan(userId, planId);
        }
      }
      return res.json({ received: true });
    } else {
      const paymentId = req.body.data?.id || req.query['data.id'] || req.body.id;
      const topic = req.body.type || req.body.topic;

      if (paymentId && (topic === 'payment' || req.body.action?.startsWith('payment.'))) {
        const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
          headers: {
            Authorization: `Bearer ${paymentConfig.accessToken}`
          }
        });

        if (mpRes.ok) {
          const payment = await mpRes.json();
          
          if (payment.status === 'approved') {
            let userId, planId;
            
            if (payment.external_reference) {
              const parts = payment.external_reference.split(':');
              userId = parts[0];
              planId = parts[1];
            } else if (payment.metadata) {
              userId = payment.metadata.user_id;
              planId = payment.metadata.plan_id;
            }

            if (userId && planId) {
              console.log(`[MercadoPago Webhook] Ativando plano ${planId} para usuário ${userId}`);
              await activateUserPlan(userId, planId);
            }
          }
        } else {
          console.error(`[MercadoPago Webhook] Erro ao buscar pagamento ${paymentId}`);
        }
      }
      return res.json({ received: true });
    }
  } catch (error) {
    console.error("Erro no processamento do Webhook de Pagamento:", error);
    res.status(500).json({ error: error.message });
  }
};
