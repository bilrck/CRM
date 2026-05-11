import crypto from "crypto";
import { request, ExternalApiError } from "../utils/api-client.js";

const FB_GRAPH_URL = "https://graph.facebook.com/v23.0";

// Simple in-memory cache to mitigate Meta API rate limits
const cache = new Map();
const CACHE_TTL = 15 * 60 * 1000; // 15 minutes

const getCachedOrFetch = async (key, fetcher) => {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  const data = await fetcher();
  cache.set(key, { data, timestamp: Date.now() });
  return data;
};

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
 * Includes picture and category for display.
 */
export const getUserPages = async (userAccessToken) => {
  try {
    const data = await request(
      `${FB_GRAPH_URL}/me/accounts?access_token=${userAccessToken}&fields=id,name,category,access_token,picture&limit=100`,
    );
    return data.data;
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
 * Fetches detailed content for a specific Lead, including all form fields.
 * IMPORTANT: Meta API requires explicit `fields` param to return field_data.
 */
export const getLeadData = async (leadId, pageAccessToken) => {
  try {
    return await request(
      `${FB_GRAPH_URL}/${leadId}?access_token=${pageAccessToken}&fields=id,created_time,field_data`,
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

/**
 * Lists the Ad Accounts specifically for a Business Account.
 */
export const getBusinessAdAccounts = async (businessId, userAccessToken) => {
  try {
    const data = await request(
      `${FB_GRAPH_URL}/${businessId}/adaccounts?access_token=${userAccessToken}&fields=name,account_id,id,currency,account_status,amount_spent&limit=100`,
    );
    return data.data;
  } catch (error) {
    console.error(`Meta getBusinessAdAccounts error for ${businessId}:`, error.message);
    throw error;
  }
};

/**
 * Comprehensive Meta report: accounts + campaigns with insights + pages.
 * Supports filtering by businessId.
 */
export const getMetaReport = async (userAccessToken, dateRange = "last_30d", businessId = null) => {
  const cacheKey = `report_${userAccessToken}_${dateRange}_${businessId || 'all'}`;
  
  return getCachedOrFetch(cacheKey, async () => {
    const report = {
      adAccounts: [],
      campaigns: [],
      totalSpend: 0,
      totalImpressions: 0,
      totalClicks: 0,
      totalLeads: 0,
      avgCpl: 0,
      avgCtr: 0,
      dateRange,
      generatedAt: new Date().toISOString(),
    };

    try {
      // 1. Get Ad Accounts (either for all or for a specific business)
      let accounts = [];
      if (businessId) {
        accounts = await getBusinessAdAccounts(businessId, userAccessToken);
      } else {
        accounts = await getAdAccounts(userAccessToken);
      }
      report.adAccounts = accounts;

      // 2. For each account, get campaigns with insights in a single call (Bulk Optimization)
      const campaignPromises = accounts.map(async (acc) => {
        try {
          const [campaignsRes, accountInsightsRes] = await Promise.allSettled([
            request(`${FB_GRAPH_URL}/${acc.id}/campaigns?access_token=${userAccessToken}&fields=id,name,status,insights.date_preset(${dateRange}){spend,impressions,clicks,actions}`),
            getInsights(acc.id, userAccessToken, dateRange),
          ]);

          const campaignsData = campaignsRes.status === "fulfilled" ? campaignsRes.value.data || [] : [];
          const accInsights = accountInsightsRes.status === "fulfilled" ? accountInsightsRes.value : null;

          // Accumulate totals
          if (accInsights) {
            report.totalSpend += parseFloat(accInsights.spend || 0);
            report.totalImpressions += parseInt(accInsights.impressions || 0);
            report.totalClicks += parseInt(accInsights.clicks || 0);
            const leadAction = accInsights.actions?.find((a) => a.action_type === "lead");
            report.totalLeads += parseInt(leadAction?.value || 0);
          }

          // Map campaigns with their nested insights
          return campaignsData.map(camp => ({
            ...camp,
            insights: camp.insights?.data?.[0] || null,
            adAccountName: acc.name,
            adAccountId: acc.id
          }));
        } catch (err) {
          console.warn(`Error fetching data for account ${acc.id}:`, err.message);
          return [];
        }
      });

      const campaignResults = await Promise.all(campaignPromises);
      report.campaigns = campaignResults.flat();

      // 3. Post-calculation metrics
      if (report.totalImpressions > 0) {
        report.avgCtr = (report.totalClicks / report.totalImpressions) * 100;
      }
      if (report.totalLeads > 0) {
        report.avgCpl = report.totalSpend / report.totalLeads;
      }

    } catch (error) {
      console.error("getMetaReport error:", error.message);
    }

    return report;
  });
};

/**
 * Lists the Business Accounts (Portfolios) the user has access to.
 */
export const getBusinesses = async (userAccessToken) => {
  return getCachedOrFetch(`businesses_${userAccessToken}`, async () => {
    try {
      const data = await request(
        `${FB_GRAPH_URL}/me/businesses?access_token=${userAccessToken}&fields=id,name,vertical,verification_status,primary_page,created_time&limit=100`,
      );
      return data.data || [];
    } catch (error) {
      console.error("Meta getBusinesses error:", error.message);
      throw error;
    }
  });
};

/**
 * Lists pages for a specific Business.
 */
export const getBusinessPages = async (businessId, userAccessToken) => {
  try {
    const endpoints = [
      `${FB_GRAPH_URL}/${businessId}/owned_pages`,
      `${FB_GRAPH_URL}/${businessId}/client_pages`
    ];

    let pages = [];

    for (const endpoint of endpoints) {
      try {
        const data = await request(
          `${endpoint}?fields=id,name,category,access_token,picture{url}&access_token=${userAccessToken}&limit=100`
        );
        if (data.data) {
          pages.push(...data.data);
        }
      } catch (e) {
        console.warn(`Could not fetch pages from ${endpoint}:`, e.message);
      }
    }

    // Deduplicate pages by ID
    const map = new Map();
    pages.forEach(p => map.set(p.id, p));
    return Array.from(map.values());
  } catch (error) {
    console.error(`Meta getBusinessPages error for ${businessId}:`, error.message);
    throw error;
  }
};

/**
 * Gets specific Page Access Token using User Access Token.
 */
export const getPageAccessToken = async (pageId, userAccessToken) => {
  try {
    const data = await request(
      `${FB_GRAPH_URL}/${pageId}?fields=access_token&access_token=${userAccessToken}`
    );
    return data.access_token;
  } catch (error) {
    console.error(`Meta getPageAccessToken error for ${pageId}:`, error.message);
    throw error;
  }
};

/**
 * Lists assets (Ad Accounts, Pages, Instagram Accounts) for a specific Business.
 */
export const getBusinessAssets = async (businessId, userAccessToken) => {
  return getCachedOrFetch(`assets_${businessId}`, async () => {
    try {
      // We fetch both owned and client assets for a full picture
      const [ownedAdAccounts, clientAdAccounts, instagramAccounts] = await Promise.allSettled([
        request(`${FB_GRAPH_URL}/${businessId}/adaccounts?access_token=${userAccessToken}&fields=id,name,account_id,account_status,amount_spent,currency`),
        request(`${FB_GRAPH_URL}/${businessId}/client_ad_accounts?access_token=${userAccessToken}&fields=id,name,account_id,account_status,amount_spent,currency`),
        request(`${FB_GRAPH_URL}/${businessId}/instagram_accounts?access_token=${userAccessToken}&fields=id,username,follow_count`)
      ]);

      const pages = await getBusinessPages(businessId, userAccessToken);

      const merge = (r1, r2) => {
        const data1 = r1.status === "fulfilled" ? r1.value.data : [];
        const data2 = r2.status === "fulfilled" ? r2.value.data : [];
        const map = new Map();
        [...data1, ...data2].forEach(item => map.set(item.id, item));
        return Array.from(map.values());
      };

      return {
        adAccounts: merge(ownedAdAccounts, clientAdAccounts),
        pages: pages,
        instagramAccounts: instagramAccounts.status === "fulfilled" ? instagramAccounts.value.data : []
      };
    } catch (error) {
      console.error(`Meta getBusinessAssets error for ${businessId}:`, error.message);
      throw error;
    }
  });
};

/**
 * Fetches leads from a specific Meta Lead Form.
 */
export const getFormLeads = async (formId, accessToken, limit = 50) => {
  try {
    const data = await request(
      `${FB_GRAPH_URL}/${formId}/leads?access_token=${accessToken}&fields=id,created_time,field_data&limit=${limit}`
    );
    return data.data || [];
  } catch (error) {
    console.error(`Meta getFormLeads error for ${formId}:`, error.message);
    throw error;
  }
};

/**
 * Helper to map Meta lead fields (array) to a flat object.
 */
export const mapLeadFields = (fieldData = []) => {
  const mapped = {};
  for (const field of fieldData) {
    mapped[field.name] = field.values?.[0] || null;
  }
  return mapped;
};

/**
 * Fetches full details for a specific Lead.
 */
export const getLeadDetails = async (leadId, token) => {
  try {
    return await request(
      `${FB_GRAPH_URL}/${leadId}?access_token=${token}`
    );
  } catch (error) {
    console.error(`Meta getLeadDetails error for ${leadId}:`, error.message);
    throw error;
  }
};

/**
 * Main service for the Unified Leads Center.
 * Traverses Hierarchy: Businesses -> Pages -> Forms -> Leads
 */
export const syncLeadsCenter = async (workspaceId, token) => {
  const { default: prisma } = await import("../config/prisma.js");

  const businesses = await getBusinesses(token);

  let totalNewLeads = 0;

  for (const business of businesses) {
    const pages = await getBusinessPages(business.id, token);

    for (const page of pages) {
      let pageToken = null;
      try {
        pageToken = await getPageAccessToken(page.id, token);
      } catch (e) {
        console.warn(`Could not get page token for ${page.id} during leads center sync:`, e.message);
        continue;
      }

      const forms = await getPageForms(page.id, pageToken);

      for (const form of forms) {
        try {
          const leads = await getFormLeads(form.id, pageToken);

          for (const lead of leads) {
            const exists = await prisma.metaUnifiedLead.findUnique({
              where: { metaLeadId: lead.id }
            });

            if (exists) continue;

            const fields = mapLeadFields(lead.field_data);

            await prisma.metaUnifiedLead.create({
              data: {
                metaLeadId: lead.id,
                name: fields.full_name || fields.name || "Lead Meta",
                email: fields.email,
                phone: fields.phone_number,
                pageId: page.id,
                pageName: page.name,
                formId: form.id,
                formName: form.name,
                createdTime: new Date(lead.created_time),
                rawData: lead,
                workspaceId
              }
            });
            totalNewLeads++;
          }
        } catch (e) {
          console.warn(`Could not sync leads for form ${form.id}:`, e.message);
        }
      }
    }
  }

  if (totalNewLeads > 0) {
    const { notifyWorkspace } = await import("./notifications.service.js");
    await notifyWorkspace(workspaceId, {
      title: "🔄 Sincronização Meta Concluída",
      message: `${totalNewLeads} novos leads foram importados para sua Central de Leads.`,
      type: "SUCCESS",
      eventKey: "newLead"
    });
  }

  return totalNewLeads;
};
