import axios from "axios";
import { ENV } from "@/src/config/env";
import { secureStorage } from "@/src/services/storage/secureStorage";
import { store } from "@/src/store/store";
import { clearAuth } from "@/src/features/auth/store/authSlice";

// Separate Axios instance for refresh calls to prevent request interceptor loops
const refreshInstance = axios.create({
  baseURL: ENV.API_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

export const apiClient = axios.create({
  baseURL: ENV.API_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Queueing mechanism to prevent concurrent duplicate refresh calls
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token!);
    }
  });
  failedQueue = [];
};

/**
 * Request Interceptor:
 * Attaches the Authorization header using the access token from secure storage.
 */
apiClient.interceptors.request.use(
  async (config) => {
    const token = await secureStorage.getAccessToken();
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
 * Standardizes API responses, catches 401 Unauthorized errors,
 * and initiates automatic token refresh rotation.
 */
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Check if the server returned a 401 (Unauthorized) and this request hasn't been retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // If we are already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: (token) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              resolve(apiClient(originalRequest));
            },
            reject: (err) => reject(err),
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = await secureStorage.getRefreshToken();
        if (!refreshToken) {
          throw new Error("No refresh token available");
        }

        // Call the separate mobile refresh endpoint
        const response = await refreshInstance.post("/api/v1/users/mobile/refresh", {
          refreshToken,
        });

        const { accessToken: newAccessToken, refreshToken: newRefreshToken } = response.data;

        // Save rotated credentials
        await secureStorage.setAccessToken(newAccessToken);
        await secureStorage.setRefreshToken(newRefreshToken);

        // Process all queued requests with the new access token
        processQueue(null, newAccessToken);
        isRefreshing = false;

        // Retry the original request
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        isRefreshing = false;

        // Invalidate session locally and in global state
        await secureStorage.clearTokens();
        store.dispatch(clearAuth());

        const apiError = error.response?.data?.message || error.message || "Session expired, please log in again";
        return Promise.reject(new Error(apiError));
      }
    }

    // Default error extractor
    const apiError = error.response?.data?.message || error.message || "An unexpected error occurred";
    return Promise.reject(new Error(apiError));
  }
);

export default apiClient;
