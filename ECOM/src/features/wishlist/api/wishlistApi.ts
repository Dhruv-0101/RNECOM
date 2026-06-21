import { apiClient } from "@/src/services/api/apiClient";
import { ENDPOINTS } from "@/src/services/api/endpoints";
import { Product } from "@/src/features/products/types/product.types";

export interface WishlistResponse {
  status: string;
  message: string;
  wishlist: Product[];
}

export const wishlistApi = {
  async toggleWishlist(productId: string): Promise<WishlistResponse> {
    const response = await apiClient.post<WishlistResponse>(ENDPOINTS.WISHLIST.TOGGLE, { productId });
    return response.data;
  },

  async getWishlist(params?: { page?: number; limit?: number }): Promise<WishlistResponse> {
    const response = await apiClient.get<WishlistResponse>(ENDPOINTS.WISHLIST.GET, { params });
    return response.data;
  },

  async mergeWishlist(productIds: string[]): Promise<WishlistResponse> {
    const response = await apiClient.post<WishlistResponse>(ENDPOINTS.WISHLIST.MERGE, { productIds });
    return response.data;
  },
};

export default wishlistApi;
