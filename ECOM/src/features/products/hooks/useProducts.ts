import { useQuery } from "@tanstack/react-query";
import { productsApi, GetProductsParams } from "../api/productsApi";

export const useProducts = (params?: GetProductsParams) => {
  return useQuery({
    queryKey: ["products", params],
    queryFn: () => productsApi.getProducts(params),
    // Hold product list in cache for 5 minutes (config defaults are in queryClient but this is local override or explicit)
    staleTime: 1000 * 60 * 5,
  });
};

export const useProduct = (productId?: string) => {
  return useQuery({
    queryKey: ["product", productId],
    queryFn: () => productsApi.getProduct(productId!),
    enabled: Boolean(productId),
    staleTime: 1000 * 60 * 5,
  });
};

export default useProducts;
