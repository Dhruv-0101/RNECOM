import { apiClient } from "@/src/services/api/apiClient";
import { ENDPOINTS } from "@/src/services/api/endpoints";
import { Product, ProductsResponse } from "../types/product.types";

export interface GetProductsParams {
  name?: string;
  brand?: string;
  category?: string;
  page?: number;
  limit?: number;
}

export const productsApi = {
  /**
   * Fetch all products from the backend with optional query filters and pagination
   */
  async getProducts(params?: GetProductsParams): Promise<ProductsResponse> {
    const response = await apiClient.get<ProductsResponse>(ENDPOINTS.PRODUCTS.LIST, {
      params,
    });
    return response.data;
  },

  async getProduct(productId: string): Promise<Product> {
    const response = await apiClient.get<{ product: Product } | Product>(
      ENDPOINTS.PRODUCTS.DETAIL(productId)
    );
    return "product" in response.data ? response.data.product : response.data;
  },
};

export default productsApi;
