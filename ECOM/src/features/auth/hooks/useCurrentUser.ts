import { useSelector } from "react-redux";
import { RootState } from "@/src/store/store";

export const useCurrentUser = () => {
  const { user, token, isAuthenticated, isInitialized } = useSelector(
    (state: RootState) => state.auth
  );

  return {
    user,
    token,
    isAuthenticated,
    isInitialized,
  };
};

export default useCurrentUser;
