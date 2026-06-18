import { useQuery } from "@tanstack/react-query";
import { categoriesApi } from "../api/categoriesApi";

export const useCategories = () => {
  return useQuery({
    queryKey: ["categories"],
    queryFn: () => categoriesApi.getCategories(),
    // Cache categories list for 30 minutes since categories are relatively static
    staleTime: 1000 * 60 * 30,
  });
};

export default useCategories;
