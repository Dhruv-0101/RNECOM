import { useQuery } from "@tanstack/react-query";
import { couponsApi } from "../api/couponsApi";

export const useCoupons = () => {
  return useQuery({
    queryKey: ["coupons"],
    queryFn: () => couponsApi.getCoupons(),
    // Cache coupons for 10 minutes since coupons change infrequently
    staleTime: 1000 * 60 * 10,
  });
};

export default useCoupons;
