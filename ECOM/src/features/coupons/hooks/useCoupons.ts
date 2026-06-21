import { useQuery } from "@tanstack/react-query";
import { couponsApi } from "../api/couponsApi";

export const useCoupons = (params?: { page?: number; limit?: number; code?: string }) => {
  return useQuery({
    queryKey: ["coupons", params],
    queryFn: () => couponsApi.getCoupons(params),
    // Cache coupons for 10 minutes since coupons change infrequently
    staleTime: 1000 * 60 * 10,
  });
};

export default useCoupons;
