import { useMutation } from "@tanstack/react-query";
import { useDispatch } from "react-redux";
import { authApi } from "../api/authApi";
import { setAuth } from "../store/authSlice";
import { secureStorage } from "@/src/services/storage/secureStorage";
import { LoginFormData } from "../schemas/login.schema";
import { AppDispatch, store } from "@/src/store/store";
import { wishlistApi } from "@/src/features/wishlist/api/wishlistApi";
import { setWishlist } from "@/src/features/wishlist/store/wishlistSlice";

export const useLogin = () => {
  const dispatch = useDispatch<AppDispatch>();

  return useMutation({
    mutationFn: (credentials: LoginFormData) => authApi.login(credentials),
    onSuccess: async (data) => {
      const accessToken = data.accessToken || data.token;
      const refreshToken = data.refreshToken;
      const user = data.userFound;

      if (accessToken && user) {
        // 1. Save Access and Refresh Tokens to Secure Store
        await secureStorage.setAccessToken(accessToken);
        if (refreshToken) {
          await secureStorage.setRefreshToken(refreshToken);
        }
        // 2. Dispatch to Redux Store
        dispatch(setAuth({ user, token: accessToken }));

        // 3. Sync wishlist (merge guest items with server)
        try {
          const localWishlist = store.getState().wishlist.items;
          const localIds = localWishlist.map((item) => item._id);

          let response;
          if (localIds.length > 0) {
            response = await wishlistApi.mergeWishlist(localIds);
          } else {
            response = await wishlistApi.getWishlist();
          }
          dispatch(setWishlist(response.wishlist || []));
        } catch (wErr) {
          console.log("Failed to sync wishlist on login success:", wErr);
        }
      }
    },
  });
};

export default useLogin;
