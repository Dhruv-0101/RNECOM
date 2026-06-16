import { useDispatch } from "react-redux";
import { useQueryClient } from "@tanstack/react-query";
import { clearAuth } from "../store/authSlice";
import { secureStorage } from "@/src/services/storage/secureStorage";
import { AppDispatch } from "@/src/store/store";

export const useLogout = () => {
  const dispatch = useDispatch<AppDispatch>();
  const queryClient = useQueryClient();

  const logout = async () => {
    // 1. Remove from Secure Store
    await secureStorage.removeToken();
    // 2. Clear Redux auth state
    dispatch(clearAuth());
    // 3. Clear Query Client Cache
    queryClient.clear();
  };

  return { logout };
};

export default useLogout;
