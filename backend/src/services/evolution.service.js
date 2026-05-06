import { request, ExternalApiError } from "../utils/api-client.js";

export const validateEvolutionInstance = async (baseUrl, apiKey) => {
  try {
    const cleanUrl = baseUrl.replace(/\/$/, "");

    await request(`${cleanUrl}/instance/fetchInstances`, {
      method: "GET",
      headers: {
        apikey: apiKey,
      },
    });

    return true;
  } catch (error) {
    console.error("Erro ao validar Evolution API:", error.message);
    return false;
  }
};

export const sendMessage = async (baseUrl, apiKey, number, text) => {
  try {
    let cleanUrl = baseUrl.replace(/\/$/, "");
    let finalUrl = "";

    if (cleanUrl.match(/\/instance\/[^\/]+$/)) {
      const parts = cleanUrl.split("/instance/");
      const rootUrl = parts[0];
      const instanceName = parts[1];
      finalUrl = `${rootUrl}/message/sendText/${instanceName}`;
    } else {
      finalUrl = `${cleanUrl}/message/sendText`;
    }

    const data = await request(finalUrl, {
      method: "POST",
      headers: {
        apikey: apiKey,
      },
      body: JSON.stringify({
        number: number,
        text: text,
        options: {
          delay: 1200,
          presence: "composing",
          linkPreview: false,
        },
      }),
    });

    return data;
  } catch (error) {
    console.error("Erro ao enviar mensagem Evolution:", error.message);
    throw error;
  }
};

export const sendMedia = async (
  baseUrl,
  apiKey,
  number,
  mediaUrl,
  type,
  caption = "",
) => {
  try {
    let cleanUrl = baseUrl.replace(/\/$/, "");
    let finalUrl = "";

    if (cleanUrl.match(/\/instance\/[^\/]+$/)) {
      const parts = cleanUrl.split("/instance/");
      const rootUrl = parts[0];
      const instanceName = parts[1];
      finalUrl = `${rootUrl}/message/sendMedia/${instanceName}`;
    } else {
      finalUrl = `${cleanUrl}/message/sendMedia`;
    }

    const mediaType = type === "image" ? "image" : "document";
    const body = {
      number: number,
      media: mediaUrl,
      mediatype: mediaType,
      caption: caption,
      delay: 1200,
    };

    if (type === "document") {
      body.fileName = mediaUrl.split("/").pop() || "documento";
    }

    const data = await request(finalUrl, {
      method: "POST",
      headers: {
        apikey: apiKey,
      },
      body: JSON.stringify(body),
    });

    return data;
  } catch (error) {
    console.error("Erro ao enviar media Evolution:", error.message);
    throw error;
  }
};
