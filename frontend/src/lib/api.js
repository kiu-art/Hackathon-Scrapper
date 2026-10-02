import axios from "axios";

/**
 * Configured Axios instance for the ERP hackathon platform.
 * baseURL defaults to the Vite environment variable VITE_API_URL or local Express port.
 * Authentication headers are injected dynamically via useAuthToken hook.
 */
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  timeout: 60000, // 60s timeout to accommodate PDF vectorization and LLM pitch synthesis
  headers: {
    "Content-Type": "application/json",
  },
});

// Response interceptor for consistent ERP telemetry and error formatting
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Standardize error messaging across Express & FastAPI microservices
    const errorPayload = {
      status: error.response?.status,
      message:
        error.response?.data?.error ||
        error.response?.data?.message ||
        error.message ||
        "An unexpected microservice error occurred",
      details: error.response?.data?.details || null,
    };

    if (error.response?.status === 401) {
      console.warn("[API // AUTH_UNAUTHORIZED] Clerk session token invalid or expired.");
    } else if (error.response?.status === 503 || error.code === "ECONNABORTED") {
      console.error("[API // GATEWAY_TIMEOUT] Downstream AI service or MongoDB timed out.");
    }

    return Promise.reject(error);
  }
);

export default api;