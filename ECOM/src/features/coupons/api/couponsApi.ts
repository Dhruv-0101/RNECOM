import { apiClient } from "@/src/services/api/apiClient";
import { ENDPOINTS } from "@/src/services/api/endpoints";
import { CouponsResponse, SingleCouponResponse } from "../types/coupon.types";

export const couponsApi = {
  /**
   * Fetch all coupons from the backend.
   */
  async getCoupons(): Promise<CouponsResponse> {
    const response = await apiClient.get<CouponsResponse>(ENDPOINTS.COUPONS.LIST);
    return response.data;
  },

  /**
   * Fetch a single coupon by code.
   */
  async getCoupon(code: string): Promise<SingleCouponResponse> {
    const response = await apiClient.get<SingleCouponResponse>(ENDPOINTS.COUPONS.SINGLE, {
      params: { code },
    });
    return response.data;
  },
};

export default couponsApi;
