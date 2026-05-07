import crypto from "crypto";
import { request, ExternalApiError } from "../utils/api-client.js";

const FB_GRAPH_URL = "https://graph.facebook.com/v18.0";

/**
 * Exchanges a short-lived user access token for a long-lived one (60 days).
 */
export const exchangeUserToken = async (shortLivedToken) => {
  try {
    const url = new URL(`${FB_GRAPH_URL}/oauth/access_token`);
    url.searchParams.append("grant_type", "fb_exchange_token");
    url.searchParams.append("client_id", process.env.META_APP_ID);
    url.searchParams.append("client_secret", process.env.META_APP_SECRET);
    url.searchParams.append("fb_exchange_token", shortLivedToken);

    return await request(url.toString());
  } catch (error) {
    console.error("Meta exchangeUserToken error:", error.message);
    throw error;
  }
};

/**
 * Lists current user's Facebook pages and their Page Access Tokens.
 */
export const getUserPages = async (userAccessToken) => {
  try {
    const data = await request(
      `${FB_GRAPH_URL}/me/accounts?access_token=${userAccessToken}&limit=100`,
    );
    return data.data; // Array of pages
  } catch (error) {
    console.error("Meta getUserPages error:", error.message);
    throw error;
  }
};

/**
 * Subscribes the application to a page's leadgen webhooks.
 */
export const subscribePageToWebhooks = async (pageId, pageAccessToken) => {
  try {
    return await request(
      `${FB_GRAPH_URL}/${pageId}/subscribed_apps?access_token=${pageAccessToken}`,
      {
        method: "POST",
        body: JSON.stringify({
          subscribed_fields: ["leadgen"],
        }),
      },
    );
  } catch (error) {
    console.error("Meta subscribePageToWebhooks error:", error.message);
    throw error;
  }
};


/**
 * Fetches detailed content for a specific Lead.
 */
export const getLeadData = async (leadId, pageAccessToken) => {
  try {
    return await request(
      `${FB_GRAPH_URL}/${leadId}?access_token=${pageAccessToken}`,
    );
  } catch (error) {
    console.error("Meta getLeadData error:", error.message);
    throw error;
  }
};

/**
 * Meta Conversions API (CAPI)
 */
export const sendCapiEvent = async (pixelId, accessToken, eventData) => {
  try {
    return await request(
      `${FB_GRAPH_URL}/${pixelId}/events?access_token=${accessToken}`,
      {
        method: "POST",
        body: JSON.stringify({
          data: [eventData],
        }),
      },
    );
  } catch (error) {
    console.error("Meta CAPI error:", error.message);
    throw error;
  }
};

/**
 * Formats a payload for Meta CAPI
 */
export const formatCapiEvent = (eventName, email, phone, externalId) => {
  // Note: CAPI requires hashed PII
  const hash = (val) =>
    val
      ? crypto
          .createHash("sha256")
          .update(val.toLowerCase().trim())
          .digest("hex")
      : null;

  return {
    event_name: eventName,
    event_time: Math.floor(Date.now() / 1000),
    user_data: {
      em: email ? [hash(email)] : [],
      ph: phone ? [hash(phone.replace(/\D/g, ""))] : [],
      external_id: externalId ? [hash(String(externalId))] : [],
    },
    action_source: "system_generated",
  };
};

/**
 * Lists the Ad Accounts the user has access to.
 */
export const getAdAccounts = async (userAccessToken) => {
  try {
    const data = await request(
      `${FB_GRAPH_URL}/me/adaccounts?access_token=${userAccessToken}&fields=name,account_id,id,currency,account_status,amount_spent&limit=100`,
    );
    return data.data;
  } catch (error) {
    console.error("Meta getAdAccounts error:", error.message);
    throw error;
  }
};

/**
 * Lists campaigns for a specific Ad Account.
 */
export const getCampaigns = async (adAccountId, accessToken) => {
  try {
    const data = await request(
      `${FB_GRAPH_URL}/${adAccountId}/campaigns?access_token=${accessToken}&fields=name,status,objective,start_time,stop_time,id&limit=100`,
    );
    return data.data;
  } catch (error) {
    console.error("Meta getCampaigns error:", error.message);
    throw error;
  }
};

/**
 * Fetches insights (metrics) for a campaign, ad set, or ad.
 */
export const getInsights = async (objectId, accessToken, range = "last_30d") => {
  try {
    // range can be: today, yesterday, last_7d, last_30d, this_month, last_month
    const data = await request(
      `${FB_GRAPH_URL}/${objectId}/insights?access_token=${accessToken}&date_preset=${range}&fields=impressions,clicks,spend,reach,actions,conversions,cost_per_conversion`,
    );
    return data.data[0] || null;
  } catch (error) {
    console.error("Meta getInsights error:", error.message);
    throw error;
  }
};

/**
 * Fetches Lead Forms for a given Page.
 */
export const getPageForms = async (pageId, pageAccessToken) => {
  try {
    const data = await request(
      `${FB_GRAPH_URL}/${pageId}/leadgen_forms?access_token=${pageAccessToken}&fields=id,name,status,created_time,leads_count&limit=100`,
    );
    return data.data;
  } catch (error) {
    console.error("Meta getPageForms error:", error.message);
    throw error;
  }
};

/**
 * Validates if a token is effective. (Used by legacy connections flow)
 */
export const validateMetaToken = async (accessToken) => {
  try {
    await request(`${FB_GRAPH_URL}/me?access_token=${accessToken}`);
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Fetches metrics for a connection.
 */
export const getMetaMetrics = async (accessToken, adAccountId = null) => {
  try {
    if (!adAccountId) return { leads: 0, gastos: "R$ 0", conversoes: 0 };

    const insights = await getInsights(adAccountId, accessToken, "this_month");
    if (!insights) return { leads: 0, gastos: "R$ 0", conversoes: 0 };

    return {
      leads: insights.conversions || 0,
      gastos: `R$ ${parseFloat(insights.spend || 0).toLocaleString("pt-BR")}`,
      conversoes: insights.actions?.find((a) => a.action_type === "lead")?.value || 0,
    };
  } catch (error) {
    return { leads: 0, gastos: "R$ 0", conversoes: 0 };
  }
};
