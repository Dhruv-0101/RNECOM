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
/*
Simple Explanation

Imagine your app sends 3 API requests at the same time:

Profile
Cart
Wishlist

But the access token has expired, so all 3 get:

401 Unauthorized
Without this code ❌

Each request tries to refresh the token:

Profile  → Refresh Token API
Cart     → Refresh Token API
Wishlist → Refresh Token API

3 refresh calls are made.

With this code ✅

First request:

Profile → starts refresh
isRefreshing = true

Other requests see that refresh is already running:

Cart → wait in queue
Wishlist → wait in queue

When the refresh succeeds:

New token received

processQueue() gives the new token to all waiting requests.

Cart → retry with new token
Wishlist → retry with new token
In one sentence

This code makes sure only ONE refresh-token request is sent, while all other failed requests wait for the new token and then continue automatically.
*/

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

    console.log(`[API Client] Request failed: ${originalRequest?.method?.toUpperCase()} ${originalRequest?.url} - Status: ${error.response?.status}`);

    // Check if the server returned a 401 (Unauthorized) and this request hasn't been retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        console.log(`[API Client] Token refresh already in progress. Queueing request: ${originalRequest.url}`);
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

      console.log(`[API Client] Access token expired (401). Initiating automatic token rotation...`);
      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = await secureStorage.getRefreshToken();
        if (!refreshToken) {
          throw new Error("No refresh token available");
        }

        console.log(`[API Client] Calling refresh endpoint /api/v1/users/mobile/refresh...`);
        // Call the separate mobile refresh endpoint
        const response = await refreshInstance.post("/api/v1/users/mobile/refresh", {
          refreshToken,
        });

        const { accessToken: newAccessToken, refreshToken: newRefreshToken } = response.data;

        // Save rotated credentials
        await secureStorage.setAccessToken(newAccessToken);
        await secureStorage.setRefreshToken(newRefreshToken);
        console.log(`[API Client] Tokens rotated successfully. New tokens saved to secure storage.`);

        // Process all queued requests with the new access token
        processQueue(null, newAccessToken);
        isRefreshing = false;

        // Retry the original request
        console.log(`[API Client] Retrying original request: ${originalRequest.url}`);
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError: any) {
        console.log(`[API Client] Token rotation failed: ${refreshError.message || refreshError}`);
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
/*
Request Interceptor 🚪➡️

Before every API request leaves your app:

Request → Interceptor → Add Token → Server

Example:

GET /profile

becomes:

GET /profile
Authorization: Bearer abc123

Feel: "Har request ke saath token chipka do."

Response Interceptor ⬅️🚪

After the server responds:

Server → Interceptor → App

If response is:

200 OK

pass it through.

If response is:

401 Unauthorized

then:

Refresh Token
↓
Get New Access Token
↓
Retry Original Request

Feel: "Agar token expire ho gaya ho, to automatically naya token le aao aur request dobara bhej do."

One-line memory
Request Interceptor  = Before sending request
Response Interceptor = After receiving response

or

Request Interceptor  = Token lagata hai
Response Interceptor = Token expire hone par bachata hai
*/


/*
Complete Flow From Scratch
1. User Login
Email + Password
      ↓
POST /mobile/login

Server:

const { accessToken, refreshToken } =
  generateMobileTokens(userFound._id);

Generates:

Access Token  → 30s
Refresh Token → 7d

Stores refresh token in DB:

RefreshTokens Collection
--------------------------------
user
token
expiresAt
isUsed
isRevoked

Returns:

{
  "accessToken": "...",
  "refreshToken": "..."
}

Client stores both in Secure Storage.

2. API Request
apiClient.get("/profile")

Before sending:

apiClient.interceptors.request.use(...)

runs.

Gets token:

const token =
 await secureStorage.getAccessToken();

Adds:

Authorization: Bearer abc123

Request goes to server.

3. Token Expires

After 30 seconds:

Access Token Expired

Request:

GET /profile

returns:

401 Unauthorized
4. Response Interceptor

Catches:

if (
 error.response?.status === 401
)

Starts refresh flow.

5. Refresh Request

Gets refresh token:

await secureStorage.getRefreshToken()

Calls:

POST /mobile/refresh
6. Server Verification

Server checks:

JWT valid?
jwt.verify(...)
Exists in DB?
RefreshToken.findOne(...)
Already used?
tokenRecord.isUsed
Revoked?
tokenRecord.isRevoked
Expired?
tokenRecord.expiresAt

If all pass:

Token Rotation
7. Rotation

Old token:

Refresh A

marked:

isUsed = true

New tokens:

Access B
Refresh B

created.

DB:

Refresh A → used
Refresh B → active
8. Client Receives New Tokens
secureStorage.setAccessToken(...)
secureStorage.setRefreshToken(...)

Then:

return apiClient(originalRequest)

Original request runs again.

User never notices.

Queue Example

Suppose:

/profile
/cart
/orders

all fail together.

Without queue:

Refresh x3 ❌

With queue:

Refresh x1 ✅

Other requests wait.

When refresh succeeds:

processQueue(...)

All retry.

Excellent implementation.
*/
export default apiClient;
