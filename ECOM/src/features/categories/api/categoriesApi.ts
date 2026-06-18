import { apiClient } from "@/src/services/api/apiClient";
import { ENDPOINTS } from "@/src/services/api/endpoints";
import { CategoriesResponse } from "../types/category.types";

export const categoriesApi = {
  /**
   * Fetch all categories from the backend.
   */
  async getCategories(): Promise<CategoriesResponse> {
    const response = await apiClient.get<CategoriesResponse>(ENDPOINTS.CATEGORIES.LIST);
    return response.data;
  },
};

export default categoriesApi;
