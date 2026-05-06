import { request, ExternalApiError } from "../utils/api-client.js";

const EVO_URL = process.env.EVOLUTION_API_URL || "https://evo.example.com";
const EVO_KEY = process.env.EVOLUTION_API_KEY || "global-api-key";

// Proxy para criar instância na Evolution
export const createInstance = async (req, res) => {
  try {
    const { instanceName } = req.body;

    const data = await request(`${EVO_URL}/instance/create`, {
      method: "POST",
      headers: {
        apikey: EVO_KEY,
      },
      body: JSON.stringify({
        instanceName: instanceName,
        token: "", // Opcional
        qrcode: true,
      }),
    });

    return res.json(data);
  } catch (error) {
    if (error instanceof ExternalApiError) {
      return res
        .status(error.status)
        .json({ error: error.message, details: error.details });
    }
    console.error("Erro ao criar instância Evolution:", error);
    return res
      .status(500)
      .json({ error: "Erro na comunicação com Evolution API" });
  }
};

// Proxy para conectar (gerar QR Code)
export const connectInstance = async (req, res) => {
  try {
    const { instanceName } = req.params;

    const data = await request(`${EVO_URL}/instance/connect/${instanceName}`, {
      headers: { apikey: EVO_KEY },
    });

    return res.json(data);
  } catch (error) {
    if (error instanceof ExternalApiError) {
      return res
        .status(error.status)
        .json({ error: error.message, details: error.details });
    }
    return res.status(500).json({ error: "Erro ao buscar QR Code" });
  }
};

// Listar instâncias (Opcional, se a Evolution permitir listar)
export const listInstances = async (req, res) => {
  try {
    const data = await request(`${EVO_URL}/instance/fetchInstances`, {
      headers: { apikey: EVO_KEY },
    });

    return res.json(data);
  } catch (error) {
    if (error instanceof ExternalApiError) {
      return res
        .status(error.status)
        .json({ error: error.message, details: error.details });
    }
    return res.status(500).json({ error: "Erro ao listar instâncias" });
  }
};

export const deleteInstance = async (req, res) => {
  try {
    const { instanceName } = req.params;
    const data = await request(`${EVO_URL}/instance/delete/${instanceName}`, {
      method: "DELETE",
      headers: { apikey: EVO_KEY },
    });
    return res.json(data);
  } catch (error) {
    if (error instanceof ExternalApiError) {
      return res
        .status(error.status)
        .json({ error: error.message, details: error.details });
    }
    return res.status(500).json({ error: "Erro ao deletar instância" });
  }
};
