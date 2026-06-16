import { QueryClient } from "@tanstack/react-query";

/**
 * Global TanStack QueryClient instance.
 * 
 * Manages cache state, query hydration, and mutations across the application.
 * Optimized with default options specifically for a mobile environment.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Limit retries to 1 (instead of the default 3) to prevent battery/data drain
      // on poor cellular network connections before displaying an error.
      retry: 1,
      
      // Disabled since window-focus listeners do not apply in native mobile
      // screens (avoiding unexpected fetches in background).
      refetchOnWindowFocus: false,
      
      // Treat query results as fresh for 5 minutes. During this period, the app
      // will read cached values instead of making immediate network requests.
      staleTime: 1000 * 60 * 5,
    },
  },
});

export default queryClient;
