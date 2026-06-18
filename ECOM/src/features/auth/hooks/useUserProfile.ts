import { useQuery } from "@tanstack/react-query";
import { useDispatch } from "react-redux";
import { useEffect } from "react";
import { authApi } from "../api/authApi";
import { updateUser } from "../store/authSlice";
import { useCurrentUser } from "./useCurrentUser";
import { AppDispatch } from "@/src/store/store";

export const useUserProfile = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { isAuthenticated } = useCurrentUser();

  const query = useQuery({
    queryKey: ["userProfile"],
    queryFn: () => authApi.getProfile(),
    staleTime: 1000 * 60 * 5, // 5 minutes cache stale duration
    enabled: isAuthenticated, // Only fetch profile if the user is authenticated
  });

  const userData = query.data?.user || query.data?.userFound;

  useEffect(() => {
    if (userData) {
      dispatch(updateUser(userData));
    }
  }, [userData, dispatch]);

  return query;
};

export default useUserProfile;
