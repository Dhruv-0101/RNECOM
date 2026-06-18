import { useDispatch } from "react-redux";
import { useQueryClient } from "@tanstack/react-query";
import { clearAuth } from "../store/authSlice";
import { authApi } from "../api/authApi";
import { secureStorage } from "@/src/services/storage/secureStorage";
import { AppDispatch } from "@/src/store/store";
import { clearWishlist } from "@/src/features/wishlist/store/wishlistSlice";

export const useLogout = () => {
  const dispatch = useDispatch<AppDispatch>();
  const queryClient = useQueryClient();

  const logout = async () => {
    try {
      // 1. Revoke the refresh token on the backend
      const refreshToken = await secureStorage.getRefreshToken();
      if (refreshToken) {
        await authApi.logout(refreshToken);
      }
    } catch (error) {
      console.log("Error during backend token revocation logout:", error);
    } finally {
      // 2. Clear all local session tokens
      await secureStorage.clearTokens();
      // 3. Reset state & cache
      dispatch(clearAuth());
      dispatch(clearWishlist());
      queryClient.clear();
    }
  };

  return { logout };
};

export default useLogout;
