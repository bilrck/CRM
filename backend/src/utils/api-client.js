/**
 * Custom error class for external API failures
 */
export class ExternalApiError extends Error {
  constructor(message, status, details, code) {
    super(message);
    this.name = "ExternalApiError";
    this.status = status;
    this.details = details;
    this.code = code;
  }
}

/**
 * Standardized fetch wrapper for external APIs
 * @param {string} url
 * @param {object} options
 * @returns {Promise<any>}
 */
export const request = async (url, options = {}) => {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    if (!response.ok) {
      let details = "";
      try {
        details = await response.text();
      } catch (e) {
        details = "Could not read error response";
      }
      throw new ExternalApiError(
        `API Request Failed: ${response.status}`,
        response.status,
        details,
      );
    }

    return await response.json();
  } catch (error) {
    if (error instanceof ExternalApiError) {
      throw error;
    }

    // Handle network-level errors
    console.error(`Network Error calling ${url}:`, error);

    const isConnRefused =
      error.code === "ECONNREFUSED" || error.message?.includes("ECONNREFUSED");
    const isTimedOut =
      error.code === "ETIMEDOUT" || error.message?.includes("ETIMEDOUT");

    if (isConnRefused) {
      throw new ExternalApiError(
        "Service Unavailable",
        503,
        "A conexão foi recusada. Verifique se o serviço externo está rodando.",
        "ECONNREFUSED",
      );
    }

    if (isTimedOut) {
      throw new ExternalApiError(
        "Request Timeout",
        504,
        "A requisição demorou muito para responder.",
        "ETIMEDOUT",
      );
    }

    throw new ExternalApiError(
      "External API Error",
      500,
      error.message || "Unknown error occurred during external request",
    );
  }
};
