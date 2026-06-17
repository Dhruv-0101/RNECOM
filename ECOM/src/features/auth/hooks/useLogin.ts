import { useMutation } from "@tanstack/react-query";
import { useDispatch } from "react-redux";
import { authApi } from "../api/authApi";
import { setAuth } from "../store/authSlice";
import { secureStorage } from "@/src/services/storage/secureStorage";
import { LoginFormData } from "../schemas/login.schema";
import { AppDispatch } from "@/src/store/store";

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
      }
    },
  });
};

export default useLogin;
