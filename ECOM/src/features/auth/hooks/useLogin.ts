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
      const token = data.token;
      const user = data.userFound;

      if (token && user) {
        // 1. Save JWT to Secure Store
        await secureStorage.setToken(token);
        // 2. Dispatch to Redux Store
        dispatch(setAuth({ user, token }));
      }
    },
  });
};

export default useLogin;
