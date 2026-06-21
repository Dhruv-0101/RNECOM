import { useQuery } from "@tanstack/react-query";
import { categoriesApi } from "../api/categoriesApi";

export const useCategories = (params?: { page?: number; limit?: number; name?: string }) => {
  return useQuery({
    queryKey: ["categories", params],
    queryFn: () => categoriesApi.getCategories(params),
    // Cache categories list for 30 minutes since categories are relatively static
    staleTime: 1000 * 60 * 30,
  });
};

export default useCategories;
