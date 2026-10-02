import axios from "axios";

/**
 * Configured Axios instance for the ERP hackathon platform.
 * Reads VITE_API_URL in production, falling back to local Express port 3000.
 */
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000/api",
  timeout: 60000, // 60s timeout for PDF vectorization and LLM pitch synthesis
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // Required if transmitting session cookies across domains
});

// Response interceptor for consistent ERP telemetry and error formatting
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Standardize error messaging across Express & FastAPI microservices
    const errorPayload = {
      status: error.response?.status || 500,
      message:
        error.response?.data?.error ||
        error.response?.data?.message ||
        error.message ||
        "An unexpected microservice error occurred",
      details: error.response?.data?.details || null,
      raw: error,
    };

    if (error.response?.status === 401) {
      console.warn("[API // AUTH_UNAUTHORIZED] Clerk session token invalid or expired.");
    } else if (error.response?.status === 503 || error.code === "ECONNABORTED") {
      console.error("[API // GATEWAY_TIMEOUT] Downstream AI service or MongoDB timed out.");
    }

    // Attach payload to error object so both err.message and err.response work in Zustand/React
    error.payload = errorPayload;

    return Promise.reject(error);
  }
);

/**
 * Utility to attach/detach Clerk Bearer token dynamically
 */
export const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common["Authorization"];
  }
};

export default api;