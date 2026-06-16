import { apiClient } from "@/src/services/api/apiClient";
import { ENDPOINTS } from "@/src/services/api/endpoints";
import { LoginFormData } from "../schemas/login.schema";
import { SignupFormData } from "../schemas/signup.schema";
import { AuthResponse } from "../types/auth.types";

export const authApi = {
  /**
   * Log in user
   */
  async login(data: LoginFormData): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>(ENDPOINTS.AUTH.LOGIN, data);
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
};

export default authApi;
