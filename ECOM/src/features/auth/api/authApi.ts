import { apiClient } from "@/src/services/api/apiClient";
import { ENDPOINTS } from "@/src/services/api/endpoints";
import { LoginFormData } from "../schemas/login.schema";
import { SignupFormData } from "../schemas/signup.schema";
import { AuthResponse, UserProfile } from "../types/auth.types";

export const authApi = {
  /**
   * Log in user using mobile RTR endpoint
   */
  async login(data: LoginFormData): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>(ENDPOINTS.AUTH.MOBILE_LOGIN, data);
    return response.data;
  },

  /**
   * Register user
   */
  async register(data: SignupFormData): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>(ENDPOINTS.AUTH.REGISTER, data);
    return response.data;
  },

  /**
   * Get authenticated user's profile
   */
  async getProfile(): Promise<AuthResponse> {
    const response = await apiClient.get<AuthResponse>(ENDPOINTS.AUTH.PROFILE);
    return response.data;
  },

  /**
   * Log out user by revoking token on backend
   */
  async logout(refreshToken: string): Promise<void> {
    try {
      await apiClient.post(ENDPOINTS.AUTH.MOBILE_LOGOUT, { refreshToken });
    } catch (err) {
      console.log("Failed to notify backend of logout:", err);
    }
  },

  /**
   * Update shipping address details
   */
  async updateShippingAddress(data: NonNullable<UserProfile["shippingAddress"]>): Promise<AuthResponse> {
    const response = await apiClient.put<AuthResponse>(ENDPOINTS.AUTH.UPDATE_SHIPPING, data);
    return response.data;
  },
};

export default authApi;
