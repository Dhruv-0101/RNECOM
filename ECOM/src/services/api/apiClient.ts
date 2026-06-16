import axios from "axios";
import { ENV } from "@/src/config/env";
import { secureStorage } from "@/src/services/storage/secureStorage";

/**
 * Custom Axios API client configured for server communications.
 * 
 * Sets the default server baseURL dynamically (dev local IP vs. production URL)
 * and defines standard request configurations.
 */
// eslint-disable-next-line import/no-named-as-default-member
export const apiClient = axios.create({
  baseURL: ENV.API_URL,
  timeout: 10000, // Timeout requests after 10 seconds to avoid infinite loading screens
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * Request Interceptor:
 * Runs automatically prior to dispatching any HTTP request.
 * 
 * Asynchronously pulls the authentication JWT from the secure device storage
 * and attaches it as a standard 'Authorization: Bearer <token>' header if found.
 */
apiClient.interceptors.request.use(
  async (config) => {
    const token = await secureStorage.getToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Response Interceptor:
 * Standardizes API error responses.
 * 
 * Safely extracts custom backend validation messages (e.g. from error middleware)
 * or falls back to generic HTTP status text. This transforms complex Axios error structures
 * into simple, unified JavaScript Error objects, making them easy to display in the UI.
 */
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Check if the backend returned a custom error JSON structure: { message: "..." }
    const apiError = error.response?.data?.message || error.message || "An unexpected error occurred";
    return Promise.reject(new Error(apiError));
  }
);

export default apiClient;
